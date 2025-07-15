const express = require('express');
const { body } = require('express-validator');
const { 
  verifyToken, 
  optionalAuth, 
  userRateLimit 
} = require('../middleware/authMiddleware');
const { 
  auditEvent, 
  complianceAudit 
} = require('../middleware/auditMiddleware');
const router = express.Router();

// Import controllers (will be created)
const authController = require('../controllers/authController');

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *               - tenantId
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               firstName:
 *                 type: string
 *                 minLength: 1
 *               lastName:
 *                 type: string
 *                 minLength: 1
 *               tenantId:
 *                 type: string
 *                 format: uuid
 *               phone:
 *                 type: string
 *               designation:
 *                 type: string
 *               department:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: User already exists
 */
router.post('/register', [
  // Rate limiting
  userRateLimit(15 * 60 * 1000, 5), // 5 attempts per 15 minutes
  
  // Validation
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  
  body('tenantId')
    .isUUID()
    .withMessage('Please provide a valid tenant ID'),
  
  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('aadharNumber')
    .optional()
    .isLength({ min: 12, max: 12 })
    .withMessage('Aadhar number must be 12 digits'),
  
  body('panNumber')
    .optional()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .withMessage('Please provide a valid PAN number'),
  
  // Audit logging
  auditEvent('USER_REGISTRATION', 'User registration attempt'),
  complianceAudit('USER_MANAGEMENT')
], authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Login user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               rememberMe:
 *                 type: boolean
 *               mfaCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       423:
 *         description: Account locked
 */
router.post('/login', [
  // Rate limiting
  userRateLimit(15 * 60 * 1000, 10), // 10 attempts per 15 minutes
  
  // Validation
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  body('rememberMe')
    .optional()
    .isBoolean()
    .withMessage('Remember me must be a boolean'),
  
  body('mfaCode')
    .optional()
    .isLength({ min: 6, max: 6 })
    .withMessage('MFA code must be 6 digits'),
  
  // Audit logging
  auditEvent('LOGIN_ATTEMPT', 'User login attempt'),
  complianceAudit('AUTHENTICATION')
], authController.login);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Logout user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 */
router.post('/logout', [
  verifyToken,
  auditEvent('LOGOUT', 'User logout')
], authController.logout);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Authentication]
 *     summary: Refresh access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh', [
  userRateLimit(15 * 60 * 1000, 20), // 20 attempts per 15 minutes
  
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required'),
  
  auditEvent('TOKEN_REFRESH', 'Token refresh attempt')
], authController.refresh);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Request password reset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent
 *       404:
 *         description: User not found
 */
router.post('/forgot-password', [
  userRateLimit(15 * 60 * 1000, 3), // 3 attempts per 15 minutes
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  auditEvent('PASSWORD_RESET_REQUEST', 'Password reset request'),
  complianceAudit('AUTHENTICATION')
], authController.forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Reset password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 */
router.post('/reset-password', [
  userRateLimit(15 * 60 * 1000, 5), // 5 attempts per 15 minutes
  
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  auditEvent('PASSWORD_RESET', 'Password reset attempt'),
  complianceAudit('AUTHENTICATION')
], authController.resetPassword);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Change password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid current password
 *       401:
 *         description: Unauthorized
 */
router.post('/change-password', [
  verifyToken,
  userRateLimit(15 * 60 * 1000, 5), // 5 attempts per 15 minutes
  
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  auditEvent('PASSWORD_CHANGE', 'Password change attempt'),
  complianceAudit('AUTHENTICATION')
], authController.changePassword);

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     tags: [Authentication]
 *     summary: Verify email address
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */
router.post('/verify-email', [
  userRateLimit(15 * 60 * 1000, 5), // 5 attempts per 15 minutes
  
  body('token')
    .notEmpty()
    .withMessage('Verification token is required'),
  
  auditEvent('EMAIL_VERIFICATION', 'Email verification attempt'),
  complianceAudit('USER_MANAGEMENT')
], authController.verifyEmail);

/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     tags: [Authentication]
 *     summary: Resend email verification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Verification email sent
 *       404:
 *         description: User not found
 */
router.post('/resend-verification', [
  userRateLimit(15 * 60 * 1000, 3), // 3 attempts per 15 minutes
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  auditEvent('EMAIL_VERIFICATION_RESEND', 'Email verification resend')
], authController.resendVerification);

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     tags: [Authentication]
 *     summary: Get user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/profile', [
  verifyToken
], authController.getProfile);

/**
 * @swagger
 * /auth/mfa/setup:
 *   post:
 *     tags: [Authentication]
 *     summary: Setup MFA
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: MFA setup initiated
 *       401:
 *         description: Unauthorized
 */
router.post('/mfa/setup', [
  verifyToken,
  auditEvent('MFA_SETUP', 'MFA setup attempt'),
  complianceAudit('AUTHENTICATION')
], authController.setupMFA);

/**
 * @swagger
 * /auth/mfa/verify:
 *   post:
 *     tags: [Authentication]
 *     summary: Verify MFA setup
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *     responses:
 *       200:
 *         description: MFA verified successfully
 *       400:
 *         description: Invalid MFA token
 *       401:
 *         description: Unauthorized
 */
router.post('/mfa/verify', [
  verifyToken,
  
  body('token')
    .isLength({ min: 6, max: 6 })
    .withMessage('MFA token must be 6 digits'),
  
  auditEvent('MFA_VERIFICATION', 'MFA verification attempt'),
  complianceAudit('AUTHENTICATION')
], authController.verifyMFA);

/**
 * @swagger
 * /auth/mfa/disable:
 *   post:
 *     tags: [Authentication]
 *     summary: Disable MFA
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: MFA disabled successfully
 *       400:
 *         description: Invalid password
 *       401:
 *         description: Unauthorized
 */
router.post('/mfa/disable', [
  verifyToken,
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  auditEvent('MFA_DISABLE', 'MFA disable attempt'),
  complianceAudit('AUTHENTICATION')
], authController.disableMFA);

module.exports = router;