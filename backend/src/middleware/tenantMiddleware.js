const { AppError } = require('./errorMiddleware');
const { logger, logSecurityEvent } = require('../utils/logger');

// Tenant resolver middleware
const tenantResolver = async (req, res, next) => {
  try {
    // Get tenant ID from various sources
    let tenantId = null;
    
    // 1. Check X-Tenant-ID header
    if (req.headers['x-tenant-id']) {
      tenantId = req.headers['x-tenant-id'];
    }
    
    // 2. Check subdomain (for subdomain-based tenancy)
    else if (req.headers.host) {
      const subdomain = req.headers.host.split('.')[0];
      if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
        tenantId = subdomain;
      }
    }
    
    // 3. Check query parameter
    else if (req.query.tenant) {
      tenantId = req.query.tenant;
    }
    
    // 4. Check if it's a tenant registration request
    else if (req.path.includes('/register-tenant') || req.path.includes('/health')) {
      // Skip tenant resolution for these endpoints
      return next();
    }
    
    // 5. Use default tenant if none specified
    if (!tenantId) {
      tenantId = process.env.DEFAULT_TENANT || 'default';
    }
    
    // Validate tenant ID format
    if (!/^[a-zA-Z0-9_-]+$/.test(tenantId)) {
      logSecurityEvent('INVALID_TENANT_ID', {
        tenantId,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return next(new AppError('Invalid tenant identifier', 400));
    }
    
    // TODO: Validate tenant exists in database
    // This would typically involve checking a tenants table
    // For now, we'll add the tenant to the request object
    
    req.tenant = {
      id: tenantId,
      name: tenantId,
      dbSchema: `${process.env.TENANT_DB_PREFIX || 'tenant_'}${tenantId}`,
      isActive: true
    };
    
    // Log tenant access
    logger.info(`Tenant access: ${tenantId}`, {
      tenantId,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
    
    next();
    
  } catch (error) {
    logger.error('Tenant resolution error:', error);
    next(new AppError('Tenant resolution failed', 500));
  }
};

// Tenant validation middleware
const validateTenant = async (req, res, next) => {
  try {
    if (!req.tenant) {
      return next(new AppError('Tenant not resolved', 400));
    }
    
    // TODO: Additional tenant validation logic
    // - Check if tenant is active
    // - Check tenant subscription status
    // - Check tenant permissions
    
    next();
  } catch (error) {
    logger.error('Tenant validation error:', error);
    next(new AppError('Tenant validation failed', 500));
  }
};

// Tenant-specific database connection middleware
const tenantDatabase = async (req, res, next) => {
  try {
    if (!req.tenant) {
      return next(new AppError('Tenant not resolved', 400));
    }
    
    // TODO: Set up tenant-specific database connection
    // This could involve switching database schemas or connections
    // For now, we'll set a tenant context that can be used by models
    
    req.tenantContext = {
      tenantId: req.tenant.id,
      dbSchema: req.tenant.dbSchema,
      // Add other tenant-specific context
    };
    
    next();
  } catch (error) {
    logger.error('Tenant database setup error:', error);
    next(new AppError('Tenant database setup failed', 500));
  }
};

// Tenant isolation middleware for API responses
const tenantIsolation = (req, res, next) => {
  // Store original json method
  const originalJson = res.json;
  
  // Override json method to add tenant context
  res.json = function(data) {
    const response = {
      ...data,
      tenant: req.tenant ? {
        id: req.tenant.id,
        name: req.tenant.name
      } : null
    };
    
    return originalJson.call(this, response);
  };
  
  next();
};

// Tenant-specific rate limiting
const tenantRateLimit = (req, res, next) => {
  // TODO: Implement tenant-specific rate limiting
  // This could involve different limits for different tenant tiers
  next();
};

// Tenant subscription validation
const validateSubscription = async (req, res, next) => {
  try {
    if (!req.tenant) {
      return next(new AppError('Tenant not resolved', 400));
    }
    
    // TODO: Check tenant subscription status
    // - Verify subscription is active
    // - Check feature access permissions
    // - Validate usage limits
    
    req.tenantSubscription = {
      isActive: true,
      plan: 'basic',
      features: ['user_management', 'project_management', 'basic_reporting'],
      limits: {
        users: 100,
        projects: 50,
        storage: 1024 * 1024 * 1024 // 1GB
      }
    };
    
    next();
  } catch (error) {
    logger.error('Subscription validation error:', error);
    next(new AppError('Subscription validation failed', 500));
  }
};

// Feature access control middleware
const requireFeature = (featureName) => {
  return (req, res, next) => {
    if (!req.tenantSubscription || !req.tenantSubscription.features.includes(featureName)) {
      logSecurityEvent('FEATURE_ACCESS_DENIED', {
        tenantId: req.tenant?.id,
        userId: req.user?.id,
        feature: featureName,
        ip: req.ip
      });
      return next(new AppError('Feature not available in current subscription', 403));
    }
    next();
  };
};

// Tenant context helper
const getTenantContext = (req) => {
  return {
    tenantId: req.tenant?.id,
    tenantName: req.tenant?.name,
    dbSchema: req.tenant?.dbSchema,
    subscription: req.tenantSubscription,
    userId: req.user?.id
  };
};

module.exports = {
  tenantResolver,
  validateTenant,
  tenantDatabase,
  tenantIsolation,
  tenantRateLimit,
  validateSubscription,
  requireFeature,
  getTenantContext
};