const { logAuditEvent } = require('../utils/logger');
const { getTenantContext } = require('./tenantMiddleware');

// Audit logger middleware
const auditLogger = (req, res, next) => {
  // Skip audit logging for certain paths
  const skipPaths = ['/health', '/api-docs', '/favicon.ico'];
  const shouldSkip = skipPaths.some(path => req.path.includes(path));
  
  if (shouldSkip) {
    return next();
  }
  
  // Store original response methods
  const originalSend = res.send;
  const originalJson = res.json;
  
  // Capture request start time
  const startTime = Date.now();
  
  // Capture response data
  let responseData = null;
  let responseSize = 0;
  
  // Override send method
  res.send = function(data) {
    responseData = data;
    responseSize = Buffer.byteLength(data || '', 'utf8');
    return originalSend.call(this, data);
  };
  
  // Override json method
  res.json = function(data) {
    responseData = data;
    responseSize = Buffer.byteLength(JSON.stringify(data || {}), 'utf8');
    return originalJson.call(this, data);
  };
  
  // Log audit event on response finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const tenantContext = getTenantContext(req);
    
    const auditData = {
      // Request information
      method: req.method,
      url: req.originalUrl,
      path: req.path,
      query: req.query,
      params: req.params,
      headers: {
        'user-agent': req.get('User-Agent'),
        'x-forwarded-for': req.get('X-Forwarded-For'),
        'x-tenant-id': req.get('X-Tenant-ID'),
        'content-type': req.get('Content-Type')
      },
      body: sanitizeRequestBody(req.body),
      
      // Response information
      statusCode: res.statusCode,
      responseSize,
      duration,
      
      // User and tenant context
      userId: req.user?.id,
      userEmail: req.user?.email,
      userRole: req.user?.role,
      tenantId: tenantContext.tenantId,
      
      // Network information
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      
      // Timestamp
      timestamp: new Date().toISOString()
    };
    
    // Determine audit event type
    const eventType = determineEventType(req.method, req.path, res.statusCode);
    
    // Log audit event
    logAuditEvent(eventType, req.user?.id, tenantContext.tenantId, auditData);
    
    // Log critical events separately
    if (isCriticalEvent(eventType, res.statusCode)) {
      logCriticalEvent(eventType, auditData);
    }
  });
  
  next();
};

// Sanitize request body to remove sensitive information
const sanitizeRequestBody = (body) => {
  if (!body || typeof body !== 'object') {
    return body;
  }
  
  const sensitiveFields = [
    'password',
    'passwordConfirm',
    'token',
    'refreshToken',
    'apiKey',
    'secret',
    'creditCard',
    'bankAccount',
    'ssn',
    'aadhar'
  ];
  
  const sanitized = { ...body };
  
  const sanitizeObject = (obj) => {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const lowerKey = key.toLowerCase();
        
        if (sensitiveFields.some(field => lowerKey.includes(field))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      }
    }
  };
  
  sanitizeObject(sanitized);
  return sanitized;
};

// Determine audit event type based on request
const determineEventType = (method, path, statusCode) => {
  const pathLower = path.toLowerCase();
  
  // Authentication events
  if (pathLower.includes('/auth/login')) return 'LOGIN_ATTEMPT';
  if (pathLower.includes('/auth/logout')) return 'LOGOUT';
  if (pathLower.includes('/auth/register')) return 'REGISTRATION';
  if (pathLower.includes('/auth/forgot-password')) return 'PASSWORD_RESET_REQUEST';
  if (pathLower.includes('/auth/reset-password')) return 'PASSWORD_RESET';
  
  // User management events
  if (pathLower.includes('/users') && method === 'POST') return 'USER_CREATE';
  if (pathLower.includes('/users') && method === 'PUT') return 'USER_UPDATE';
  if (pathLower.includes('/users') && method === 'DELETE') return 'USER_DELETE';
  
  // Project management events
  if (pathLower.includes('/projects') && method === 'POST') return 'PROJECT_CREATE';
  if (pathLower.includes('/projects') && method === 'PUT') return 'PROJECT_UPDATE';
  if (pathLower.includes('/projects') && method === 'DELETE') return 'PROJECT_DELETE';
  
  // Financial events
  if (pathLower.includes('/accounting') && method === 'POST') return 'ACCOUNTING_ENTRY';
  if (pathLower.includes('/payroll') && method === 'POST') return 'PAYROLL_PROCESS';
  if (pathLower.includes('/gst') && method === 'POST') return 'GST_FILING';
  
  // Asset management events
  if (pathLower.includes('/assets') && method === 'POST') return 'ASSET_CREATE';
  if (pathLower.includes('/assets') && method === 'PUT') return 'ASSET_UPDATE';
  if (pathLower.includes('/assets') && method === 'DELETE') return 'ASSET_DELETE';
  
  // Dividend events
  if (pathLower.includes('/dividends') && method === 'POST') return 'DIVIDEND_DECLARE';
  if (pathLower.includes('/dividends') && method === 'PUT') return 'DIVIDEND_UPDATE';
  
  // Subscription events
  if (pathLower.includes('/subscriptions') && method === 'POST') return 'SUBSCRIPTION_CREATE';
  if (pathLower.includes('/subscriptions') && method === 'PUT') return 'SUBSCRIPTION_UPDATE';
  
  // Generic events based on HTTP method
  switch (method) {
    case 'GET':
      return 'DATA_ACCESS';
    case 'POST':
      return 'DATA_CREATE';
    case 'PUT':
    case 'PATCH':
      return 'DATA_UPDATE';
    case 'DELETE':
      return 'DATA_DELETE';
    default:
      return 'API_REQUEST';
  }
};

// Check if event is critical and needs special logging
const isCriticalEvent = (eventType, statusCode) => {
  const criticalEvents = [
    'LOGIN_ATTEMPT',
    'PASSWORD_RESET',
    'USER_CREATE',
    'USER_DELETE',
    'PROJECT_DELETE',
    'ACCOUNTING_ENTRY',
    'PAYROLL_PROCESS',
    'GST_FILING',
    'ASSET_DELETE',
    'DIVIDEND_DECLARE',
    'SUBSCRIPTION_UPDATE'
  ];
  
  return criticalEvents.includes(eventType) || statusCode >= 400;
};

// Log critical events with additional context
const logCriticalEvent = (eventType, auditData) => {
  logAuditEvent(
    'CRITICAL_EVENT',
    auditData.userId,
    auditData.tenantId,
    {
      ...auditData,
      criticalEventType: eventType,
      severity: auditData.statusCode >= 500 ? 'HIGH' : 'MEDIUM'
    }
  );
};

// Middleware for specific audit events
const auditEvent = (eventType, description) => {
  return (req, res, next) => {
    const tenantContext = getTenantContext(req);
    
    logAuditEvent(eventType, req.user?.id, tenantContext.tenantId, {
      description,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    
    next();
  };
};

// Audit data changes middleware
const auditDataChanges = (tableName) => {
  return (req, res, next) => {
    // Store original response methods
    const originalJson = res.json;
    
    res.json = function(data) {
      const tenantContext = getTenantContext(req);
      
      if (res.statusCode >= 200 && res.statusCode < 300) {
        logAuditEvent('DATA_CHANGE', req.user?.id, tenantContext.tenantId, {
          tableName,
          operation: req.method,
          recordId: data.data?.id || 'unknown',
          changes: req.body,
          url: req.originalUrl,
          ip: req.ip,
          timestamp: new Date().toISOString()
        });
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// Compliance audit middleware
const complianceAudit = (complianceType) => {
  return (req, res, next) => {
    const tenantContext = getTenantContext(req);
    
    logAuditEvent('COMPLIANCE_ACTIVITY', req.user?.id, tenantContext.tenantId, {
      complianceType,
      activity: req.method,
      url: req.originalUrl,
      requestData: sanitizeRequestBody(req.body),
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
    
    next();
  };
};

module.exports = {
  auditLogger,
  auditEvent,
  auditDataChanges,
  complianceAudit
};