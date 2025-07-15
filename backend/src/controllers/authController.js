const { validationResult } = require('express-validator');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { User, Tenant, Role, UserRole } = require('../models');
const { AppError, asyncHandler, sendSuccessResponse, sendErrorResponse } = require('../middleware/errorMiddleware');
const { generateToken, generateRefreshToken } = require('../middleware/authMiddleware');
const { logger, logAuditEvent, logSecurityEvent } = require('../utils/logger');
const { getTenantContext } = require('../middleware/tenantMiddleware');

// Register new user
const register = asyncHandler(async (req, res, next) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendErrorResponse(res, 400, 'Validation failed', errors.array());
  }

  const {
    email,
    password,
    firstName,
    lastName,
    tenantId,
    phone,
    designation,
    department,
    aadharNumber,
    panNumber
  } = req.body;

  // Check if tenant exists and is active
  const tenant = await Tenant.findOne({
    where: { id: tenantId, isActive: true }
  });

  if (!tenant) {
    return next(new AppError('Invalid tenant', 400));
  }

  // Check if tenant can create more users
  const canCreateUser = await tenant.canCreateUser();
  if (!canCreateUser) {
    return next(new AppError('User limit exceeded for this tenant', 400));
  }

  // Check if user already exists
  const existingUser = await User.findOne({
    where: { email }
  });

  if (existingUser) {
    logSecurityEvent('DUPLICATE_REGISTRATION', {
      email,
      tenantId,
      ip: req.ip
    });
    return next(new AppError('User already exists with this email', 409));
  }

  // Create user
  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
    tenantId,
    phone,
    designation,
    department,
    aadharNumber,
    panNumber
  });

  // Assign default role
  const defaultRole = await Role.getDefaultRole(tenantId);
  if (defaultRole) {
    await UserRole.assignRole(user.id, defaultRole.id, user.id);
  }

  // Generate email verification token
  const verificationToken = user.generateEmailVerificationToken();
  await user.save();

  // TODO: Send verification email
  // await sendVerificationEmail(user.email, verificationToken);

  // Generate tokens
  const accessToken = generateToken({
    id: user.id,
    email: user.email,
    tenantId: user.tenantId,
    role: defaultRole?.slug || 'user'
  });

  const refreshToken = generateRefreshToken({
    id: user.id,
    email: user.email,
    tenantId: user.tenantId
  });

  // Log successful registration
  logAuditEvent('USER_REGISTERED', user.id, tenantId, {
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    ip: req.ip
  });

  sendSuccessResponse(res, 201, 'User registered successfully', {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isEmailVerified: user.isEmailVerified,
      tenantId: user.tenantId
    },
    tokens: {
      accessToken,
      refreshToken
    }
  });
});

// Login user
const login = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendErrorResponse(res, 400, 'Validation failed', errors.array());
  }

  const { email, password, rememberMe, mfaCode } = req.body;

  // Find user
  const user = await User.findOne({
    where: { email, isActive: true },
    include: [
      {
        model: Tenant,
        as: 'tenant',
        where: { isActive: true }
      },
      {
        model: Role,
        as: 'roles',
        through: { where: { isActive: true } }
      }
    ]
  });

  if (!user) {
    logSecurityEvent('LOGIN_FAILED', {
      email,
      reason: 'User not found',
      ip: req.ip
    });
    return next(new AppError('Invalid credentials', 401));
  }

  // Check if account is locked
  if (user.isAccountLocked()) {
    logSecurityEvent('LOGIN_BLOCKED', {
      userId: user.id,
      email,
      reason: 'Account locked',
      ip: req.ip
    });
    return next(new AppError('Account is locked. Please try again later.', 423));
  }

  // Validate password
  const isPasswordValid = await user.validatePassword(password);
  if (!isPasswordValid) {
    await user.incrementLoginAttempts();
    
    logSecurityEvent('LOGIN_FAILED', {
      userId: user.id,
      email,
      reason: 'Invalid password',
      attempts: user.loginAttempts + 1,
      ip: req.ip
    });
    
    return next(new AppError('Invalid credentials', 401));
  }

  // Check MFA if enabled
  if (user.mfaEnabled) {
    if (!mfaCode) {
      return next(new AppError('MFA code required', 400));
    }

    const isValidMFA = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: mfaCode,
      window: 1
    });

    if (!isValidMFA) {
      logSecurityEvent('MFA_FAILED', {
        userId: user.id,
        email,
        ip: req.ip
      });
      return next(new AppError('Invalid MFA code', 401));
    }
  }

  // Reset login attempts
  await user.resetLoginAttempts();

  // Generate tokens
  const tokenExpiry = rememberMe ? '30d' : '7d';
  const accessToken = generateToken({
    id: user.id,
    email: user.email,
    tenantId: user.tenantId,
    role: user.roles[0]?.slug || 'user',
    permissions: [] // TODO: Get user permissions
  }, tokenExpiry);

  const refreshToken = generateRefreshToken({
    id: user.id,
    email: user.email,
    tenantId: user.tenantId
  });

  // Log successful login
  logAuditEvent('LOGIN_SUCCESS', user.id, user.tenantId, {
    email: user.email,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  sendSuccessResponse(res, 200, 'Login successful', {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isEmailVerified: user.isEmailVerified,
      tenantId: user.tenantId,
      roles: user.roles.map(role => ({
        id: role.id,
        name: role.name,
        slug: role.slug
      }))
    },
    tokens: {
      accessToken,
      refreshToken
    }
  });
});

// Logout user
const logout = asyncHandler(async (req, res, next) => {
  const tenantContext = getTenantContext(req);
  
  // TODO: Blacklist the token
  // await blacklistToken(req.headers.authorization);

  logAuditEvent('LOGOUT_SUCCESS', req.user.id, tenantContext.tenantId, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  sendSuccessResponse(res, 200, 'Logout successful');
});

// Refresh access token
const refresh = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendErrorResponse(res, 400, 'Validation failed', errors.array());
  }

  const { refreshToken } = req.body;

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Find user
    const user = await User.findOne({
      where: { id: decoded.id, isActive: true },
      include: [
        {
          model: Role,
          as: 'roles',
          through: { where: { isActive: true } }
        }
      ]
    });

    if (!user) {
      return next(new AppError('Invalid refresh token', 401));
    }

    // Generate new access token
    const accessToken = generateToken({
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.roles[0]?.slug || 'user',
      permissions: [] // TODO: Get user permissions
    });

    logAuditEvent('TOKEN_REFRESHED', user.id, user.tenantId, {
      ip: req.ip
    });

    sendSuccessResponse(res, 200, 'Token refreshed successfully', {
      accessToken
    });
  } catch (error) {
    logSecurityEvent('REFRESH_TOKEN_FAILED', {
      error: error.message,
      ip: req.ip
    });
    return next(new AppError('Invalid refresh token', 401));
  }
});

// Forgot password
const forgotPassword = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendErrorResponse(res, 400, 'Validation failed', errors.array());
  }

  const { email } = req.body;

  const user = await User.findOne({
    where: { email, isActive: true }
  });

  if (!user) {
    // Don't reveal whether user exists or not
    return sendSuccessResponse(res, 200, 'If the email exists, a password reset link has been sent');
  }

  const resetToken = user.generatePasswordResetToken();
  await user.save();

  // TODO: Send password reset email
  // await sendPasswordResetEmail(user.email, resetToken);

  logAuditEvent('PASSWORD_RESET_REQUESTED', user.id, user.tenantId, {
    email: user.email,
    ip: req.ip
  });

  sendSuccessResponse(res, 200, 'Password reset email sent');
});

// Reset password
const resetPassword = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendErrorResponse(res, 400, 'Validation failed', errors.array());
  }

  const { token, password } = req.body;

  const user = await User.findOne({
    where: {
      passwordResetToken: token,
      passwordResetExpires: { [Op.gt]: new Date() },
      isActive: true
    }
  });

  if (!user) {
    return next(new AppError('Invalid or expired reset token', 400));
  }

  user.password = password;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  user.passwordChangedAt = new Date();
  await user.save();

  logAuditEvent('PASSWORD_RESET_SUCCESS', user.id, user.tenantId, {
    email: user.email,
    ip: req.ip
  });

  sendSuccessResponse(res, 200, 'Password reset successful');
});

// Change password
const changePassword = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendErrorResponse(res, 400, 'Validation failed', errors.array());
  }

  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  const user = await User.findByPk(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const isCurrentPasswordValid = await user.validatePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    return next(new AppError('Current password is incorrect', 400));
  }

  user.password = newPassword;
  await user.save();

  logAuditEvent('PASSWORD_CHANGED', user.id, user.tenantId, {
    email: user.email,
    ip: req.ip
  });

  sendSuccessResponse(res, 200, 'Password changed successfully');
});

// Verify email
const verifyEmail = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendErrorResponse(res, 400, 'Validation failed', errors.array());
  }

  const { token } = req.body;

  const user = await User.findOne({
    where: {
      emailVerificationToken: token,
      emailVerificationExpires: { [Op.gt]: new Date() },
      isActive: true
    }
  });

  if (!user) {
    return next(new AppError('Invalid or expired verification token', 400));
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationExpires = null;
  await user.save();

  logAuditEvent('EMAIL_VERIFIED', user.id, user.tenantId, {
    email: user.email,
    ip: req.ip
  });

  sendSuccessResponse(res, 200, 'Email verified successfully');
});

// Resend verification email
const resendVerification = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendErrorResponse(res, 400, 'Validation failed', errors.array());
  }

  const { email } = req.body;

  const user = await User.findOne({
    where: { email, isActive: true }
  });

  if (!user) {
    return sendSuccessResponse(res, 200, 'If the email exists, a verification link has been sent');
  }

  if (user.isEmailVerified) {
    return next(new AppError('Email is already verified', 400));
  }

  const verificationToken = user.generateEmailVerificationToken();
  await user.save();

  // TODO: Send verification email
  // await sendVerificationEmail(user.email, verificationToken);

  sendSuccessResponse(res, 200, 'Verification email sent');
});

// Get user profile
const getProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findByPk(req.user.id, {
    include: [
      {
        model: Tenant,
        as: 'tenant'
      },
      {
        model: Role,
        as: 'roles',
        through: { where: { isActive: true } }
      }
    ]
  });

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  sendSuccessResponse(res, 200, 'Profile retrieved successfully', {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      designation: user.designation,
      department: user.department,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      mfaEnabled: user.mfaEnabled,
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        type: user.tenant.type
      },
      roles: user.roles.map(role => ({
        id: role.id,
        name: role.name,
        slug: role.slug
      }))
    }
  });
});

// Setup MFA
const setupMFA = asyncHandler(async (req, res, next) => {
  const user = await User.findByPk(req.user.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (user.mfaEnabled) {
    return next(new AppError('MFA is already enabled', 400));
  }

  const secret = speakeasy.generateSecret({
    name: `${user.email} (Cooperative ERP)`,
    length: 20
  });

  user.mfaSecret = secret.base32;
  await user.save();

  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

  sendSuccessResponse(res, 200, 'MFA setup initiated', {
    secret: secret.base32,
    qrCode: qrCodeUrl
  });
});

// Verify MFA
const verifyMFA = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendErrorResponse(res, 400, 'Validation failed', errors.array());
  }

  const { token } = req.body;
  const user = await User.findByPk(req.user.id);

  if (!user || !user.mfaSecret) {
    return next(new AppError('MFA not set up', 400));
  }

  const isValid = speakeasy.totp.verify({
    secret: user.mfaSecret,
    encoding: 'base32',
    token,
    window: 1
  });

  if (!isValid) {
    return next(new AppError('Invalid MFA code', 400));
  }

  user.mfaEnabled = true;
  await user.save();

  logAuditEvent('MFA_ENABLED', user.id, user.tenantId, {
    email: user.email,
    ip: req.ip
  });

  sendSuccessResponse(res, 200, 'MFA enabled successfully');
});

// Disable MFA
const disableMFA = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendErrorResponse(res, 400, 'Validation failed', errors.array());
  }

  const { password } = req.body;
  const user = await User.findByPk(req.user.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const isPasswordValid = await user.validatePassword(password);
  if (!isPasswordValid) {
    return next(new AppError('Invalid password', 400));
  }

  user.mfaEnabled = false;
  user.mfaSecret = null;
  await user.save();

  logAuditEvent('MFA_DISABLED', user.id, user.tenantId, {
    email: user.email,
    ip: req.ip
  });

  sendSuccessResponse(res, 200, 'MFA disabled successfully');
});

module.exports = {
  register,
  login,
  logout,
  refresh,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyEmail,
  resendVerification,
  getProfile,
  setupMFA,
  verifyMFA,
  disableMFA
};