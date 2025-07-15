const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Tenants',
        key: 'id'
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [8, 128]
      }
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 50]
      }
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 50]
      }
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        is: /^[\+]?[1-9][\d]{0,15}$/
      }
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    gender: {
      type: DataTypes.ENUM('Male', 'Female', 'Other'),
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true
    },
    state: {
      type: DataTypes.STRING,
      allowNull: true
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'India'
    },
    pincode: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [6, 6]
      }
    },
    aadharNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: {
        len: [12, 12]
      }
    },
    panNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: {
        is: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
      }
    },
    profileImage: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isPhoneVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    loginAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lockedUntil: {
      type: DataTypes.DATE,
      allowNull: true
    },
    passwordChangedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    emailVerificationToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    emailVerificationExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    passwordResetToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    mfaSecret: {
      type: DataTypes.STRING,
      allowNull: true
    },
    mfaEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    mfaBackupCodes: {
      type: DataTypes.JSON,
      allowNull: true
    },
    preferences: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {
        language: 'en',
        timezone: 'Asia/Kolkata',
        dateFormat: 'DD/MM/YYYY',
        currency: 'INR',
        notifications: {
          email: true,
          sms: false,
          push: true
        }
      }
    },
    employeeId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    designation: {
      type: DataTypes.STRING,
      allowNull: true
    },
    department: {
      type: DataTypes.STRING,
      allowNull: true
    },
    joiningDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    salary: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    bankAccountNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    bankName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    bankIFSC: {
      type: DataTypes.STRING,
      allowNull: true
    },
    emergencyContact: {
      type: DataTypes.JSON,
      allowNull: true
    },
    documents: {
      type: DataTypes.JSON,
      allowNull: true
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  }, {
    tableName: 'users',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['email']
      },
      {
        unique: true,
        fields: ['aadhar_number']
      },
      {
        unique: true,
        fields: ['pan_number']
      },
      {
        fields: ['tenant_id']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['employee_id']
      }
    ]
  });

  // Instance methods
  User.prototype.validatePassword = async function(password) {
    return bcrypt.compare(password, this.password);
  };

  User.prototype.generatePasswordResetToken = function() {
    const resetToken = uuidv4();
    this.passwordResetToken = resetToken;
    this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    return resetToken;
  };

  User.prototype.generateEmailVerificationToken = function() {
    const verificationToken = uuidv4();
    this.emailVerificationToken = verificationToken;
    this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    return verificationToken;
  };

  User.prototype.isAccountLocked = function() {
    return this.lockedUntil && this.lockedUntil > new Date();
  };

  User.prototype.incrementLoginAttempts = function() {
    this.loginAttempts += 1;
    
    // Lock account after 5 failed attempts
    if (this.loginAttempts >= 5) {
      this.lockedUntil = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
    }
    
    return this.save();
  };

  User.prototype.resetLoginAttempts = function() {
    this.loginAttempts = 0;
    this.lockedUntil = null;
    this.lastLogin = new Date();
    return this.save();
  };

  User.prototype.getFullName = function() {
    return `${this.firstName} ${this.lastName}`;
  };

  User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    
    // Remove sensitive fields
    delete values.password;
    delete values.passwordResetToken;
    delete values.passwordResetExpires;
    delete values.emailVerificationToken;
    delete values.emailVerificationExpires;
    delete values.mfaSecret;
    delete values.mfaBackupCodes;
    
    return values;
  };

  // Hooks
  User.beforeCreate(async (user) => {
    if (user.password) {
      const salt = await bcrypt.genSalt(12);
      user.password = await bcrypt.hash(user.password, salt);
    }
  });

  User.beforeUpdate(async (user) => {
    if (user.changed('password')) {
      const salt = await bcrypt.genSalt(12);
      user.password = await bcrypt.hash(user.password, salt);
      user.passwordChangedAt = new Date();
    }
  });

  // Associations
  User.associate = (models) => {
    // User belongs to Tenant
    User.belongsTo(models.Tenant, {
      foreignKey: 'tenantId',
      as: 'tenant'
    });

    // User has many UserRoles
    User.hasMany(models.UserRole, {
      foreignKey: 'userId',
      as: 'userRoles'
    });

    // User belongs to many Roles through UserRoles
    User.belongsToMany(models.Role, {
      through: models.UserRole,
      foreignKey: 'userId',
      otherKey: 'roleId',
      as: 'roles'
    });

    // User has many Projects as owner
    User.hasMany(models.Project, {
      foreignKey: 'ownerId',
      as: 'ownedProjects'
    });

    // User belongs to many Projects through ProjectMembers
    User.belongsToMany(models.Project, {
      through: models.ProjectMember,
      foreignKey: 'userId',
      otherKey: 'projectId',
      as: 'projects'
    });

    // User has many Tasks assigned
    User.hasMany(models.Task, {
      foreignKey: 'assignedTo',
      as: 'assignedTasks'
    });

    // User has many Payroll records
    User.hasMany(models.Payroll, {
      foreignKey: 'userId',
      as: 'payrolls'
    });

    // User has many Transactions
    User.hasMany(models.Transaction, {
      foreignKey: 'createdBy',
      as: 'transactions'
    });

    // User has many ShareHolders
    User.hasMany(models.ShareHolder, {
      foreignKey: 'userId',
      as: 'shares'
    });

    // Self-referential associations for createdBy/updatedBy
    User.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });

    User.belongsTo(models.User, {
      foreignKey: 'updatedBy',
      as: 'updater'
    });
  };

  return User;
};