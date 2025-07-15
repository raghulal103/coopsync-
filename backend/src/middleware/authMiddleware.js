const jwt = require('jsonwebtoken');
const { AppError, asyncHandler } = require('./errorMiddleware');
const { logger, logSecurityEvent } = require('../utils/logger');

// Verify JWT token
const verifyToken = asyncHandler(async (req, res, next) => {
  let token;
  
  // Get token from header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }
  
  if (!token) {
    logSecurityEvent('NO_TOKEN_PROVIDED', {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    return next(new AppError('No token provided, access denied', 401));
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // TODO: Get user from database and add to request
    // For now, we'll use the decoded token data
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      tenantId: decoded.tenantId,
      permissions: decoded.permissions || []
    };
    
    // Log successful authentication
    logger.info('User authenticated successfully', {
      userId: req.user.id,
      email: req.user.email,
      role: req.user.role,
      tenantId: req.user.tenantId,
      ip: req.ip
    });
    
    next();
  } catch (error) {
    logSecurityEvent('INVALID_TOKEN', {
      token: token.substring(0, 20) + '...',
      error: error.message,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expired, please log in again', 401));
    }
    
    return next(new AppError('Invalid token, access denied', 401));
  }
});

// Role-based access control
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('User not authenticated', 401));
    }
    
    if (!roles.includes(req.user.role)) {
      logSecurityEvent('INSUFFICIENT_PERMISSIONS', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip
      });
      return next(new AppError('Insufficient permissions', 403));
    }
    
    next();
  };
};

// Permission-based access control
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('User not authenticated', 401));
    }
    
    if (!req.user.permissions.includes(permission)) {
      logSecurityEvent('PERMISSION_DENIED', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredPermission: permission,
        userPermissions: req.user.permissions,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip
      });
      return next(new AppError('Permission denied', 403));
    }
    
    next();
  };
};

// Resource ownership check
const checkOwnership = (resourceField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('User not authenticated', 401));
    }
    
    // Admin and super admin can access all resources
    if (['admin', 'super_admin'].includes(req.user.role)) {
      return next();
    }
    
    // Check if resource belongs to user
    const resourceUserId = req.params[resourceField] || req.body[resourceField];
    
    if (resourceUserId && resourceUserId !== req.user.id) {
      logSecurityEvent('UNAUTHORIZED_RESOURCE_ACCESS', {
        userId: req.user.id,
        requestedResourceUserId: resourceUserId,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip
      });
      return next(new AppError('Access denied to this resource', 403));
    }
    
    next();
  };
};

// Tenant access control
const checkTenantAccess = (req, res, next) => {
  if (!req.user || !req.tenant) {
    return next(new AppError('User or tenant not authenticated', 401));
  }
  
  // Super admin can access all tenants
  if (req.user.role === 'super_admin') {
    return next();
  }
  
  // Check if user belongs to the tenant
  if (req.user.tenantId !== req.tenant.id) {
    logSecurityEvent('CROSS_TENANT_ACCESS_ATTEMPT', {
      userId: req.user.id,
      userTenantId: req.user.tenantId,
      requestedTenantId: req.tenant.id,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip
    });
    return next(new AppError('Access denied to this tenant', 403));
  }
  
  next();
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        tenantId: decoded.tenantId,
        permissions: decoded.permissions || []
      };
    } catch (error) {
      // Ignore token errors for optional auth
      logger.warn('Optional auth token verification failed', {
        error: error.message,
        ip: req.ip
      });
    }
  }
  
  next();
});

// Rate limiting per user
const userRateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
  const userRequests = new Map();
  
  return (req, res, next) => {
    const userId = req.user?.id || req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!userRequests.has(userId)) {
      userRequests.set(userId, []);
    }
    
    const requests = userRequests.get(userId);
    
    // Remove old requests
    const recentRequests = requests.filter(time => time > windowStart);
    userRequests.set(userId, recentRequests);
    
    if (recentRequests.length >= max) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', {
        userId: req.user?.id,
        ip: req.ip,
        requestCount: recentRequests.length,
        windowMs,
        max
      });
      return next(new AppError('Rate limit exceeded', 429));
    }
    
    recentRequests.push(now);
    next();
  };
};

// Session validation
const validateSession = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    return next(new AppError('User not authenticated', 401));
  }
  
  // TODO: Implement session validation logic
  // - Check if session exists in database
  // - Check if session is expired
  // - Check if session is blacklisted
  
  next();
});

// Multi-factor authentication check
const requireMFA = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('User not authenticated', 401));
  }
  
  // Check if MFA is required for this user/role
  const mfaRequiredRoles = ['admin', 'super_admin', 'auditor'];
  
  if (mfaRequiredRoles.includes(req.user.role) && !req.user.mfaVerified) {
    logSecurityEvent('MFA_REQUIRED', {
      userId: req.user.id,
      userRole: req.user.role,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip
    });
    return next(new AppError('Multi-factor authentication required', 403));
  }
  
  next();
};

// IP whitelist check
const checkIPWhitelist = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const whitelist = process.env.IP_WHITELIST?.split(',') || [];
  
  if (whitelist.length > 0 && !whitelist.includes(clientIP)) {
    logSecurityEvent('IP_NOT_WHITELISTED', {
      clientIP,
      url: req.originalUrl,
      method: req.method,
      userAgent: req.get('User-Agent')
    });
    return next(new AppError('Access denied from this IP address', 403));
  }
  
  next();
};

// Generate JWT token
const generateToken = (payload, expiresIn = process.env.JWT_EXPIRES_IN || '7d') => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn,
    issuer: 'cooperative-erp',
    audience: 'cooperative-erp-users'
  });
};

// Generate refresh token
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    issuer: 'cooperative-erp',
    audience: 'cooperative-erp-refresh'
  });
};

module.exports = {
  verifyToken,
  authorize,
  requirePermission,
  checkOwnership,
  checkTenantAccess,
  optionalAuth,
  userRateLimit,
  validateSession,
  requireMFA,
  checkIPWhitelist,
  generateToken,
  generateRefreshToken
};