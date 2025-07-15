module.exports = (sequelize, DataTypes) => {
  const Tenant = sequelize.define('Tenant', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 100]
      }
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        is: /^[a-z0-9-]+$/
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM(
        'agricultural',
        'housing',
        'credit',
        'consumer',
        'marketing',
        'multipurpose',
        'other'
      ),
      allowNull: false,
      defaultValue: 'multipurpose'
    },
    registrationNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    registrationDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    gstNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: {
        is: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
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
    tanNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        is: /^[\+]?[1-9][\d]{0,15}$/
      }
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true
      }
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
    logo: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    subscriptionStatus: {
      type: DataTypes.ENUM('trial', 'active', 'suspended', 'cancelled'),
      defaultValue: 'trial'
    },
    subscriptionPlan: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'basic'
    },
    subscriptionStartDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    subscriptionEndDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    maxUsers: {
      type: DataTypes.INTEGER,
      defaultValue: 10
    },
    maxProjects: {
      type: DataTypes.INTEGER,
      defaultValue: 5
    },
    maxStorage: {
      type: DataTypes.BIGINT, // in bytes
      defaultValue: 1073741824 // 1GB
    },
    features: {
      type: DataTypes.JSON,
      defaultValue: {
        userManagement: true,
        projectManagement: true,
        labourManagement: true,
        payrollManagement: true,
        accounting: true,
        gstCompliance: true,
        assetManagement: true,
        reporting: true,
        auditTrail: true,
        apiAccess: false,
        advancedReporting: false,
        multiCurrency: false,
        customFields: false
      }
    },
    settings: {
      type: DataTypes.JSON,
      defaultValue: {
        timezone: 'Asia/Kolkata',
        dateFormat: 'DD/MM/YYYY',
        currency: 'INR',
        fiscalYearStart: '04-01',
        workingHours: {
          start: '09:00',
          end: '18:00'
        },
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        notifications: {
          email: true,
          sms: false,
          push: true
        },
        security: {
          passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSymbols: true
          },
          sessionTimeout: 30, // minutes
          mfaRequired: false,
          ipWhitelist: []
        }
      }
    },
    bankDetails: {
      type: DataTypes.JSON,
      allowNull: true
    },
    compliance: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {
        gstEnabled: true,
        tdsEnabled: true,
        pf: true,
        esi: true,
        professionalTax: true,
        labourWelfareFund: true
      }
    },
    documents: {
      type: DataTypes.JSON,
      allowNull: true
    },
    lastBillingDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    nextBillingDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    billingCycle: {
      type: DataTypes.ENUM('monthly', 'quarterly', 'annually'),
      defaultValue: 'monthly'
    },
    totalRevenue: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
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
    tableName: 'tenants',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['slug']
      },
      {
        unique: true,
        fields: ['registration_number']
      },
      {
        unique: true,
        fields: ['gst_number']
      },
      {
        unique: true,
        fields: ['pan_number']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['subscription_status']
      },
      {
        fields: ['subscription_plan']
      }
    ]
  });

  // Instance methods
  Tenant.prototype.isFeatureEnabled = function(feature) {
    return this.features && this.features[feature] === true;
  };

  Tenant.prototype.getSetting = function(settingPath) {
    if (!this.settings) return null;
    
    const pathArray = settingPath.split('.');
    let current = this.settings;
    
    for (const key of pathArray) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return null;
      }
    }
    
    return current;
  };

  Tenant.prototype.setSetting = function(settingPath, value) {
    if (!this.settings) this.settings = {};
    
    const pathArray = settingPath.split('.');
    let current = this.settings;
    
    for (let i = 0; i < pathArray.length - 1; i++) {
      const key = pathArray[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[pathArray[pathArray.length - 1]] = value;
    this.changed('settings', true);
  };

  Tenant.prototype.isSubscriptionActive = function() {
    return this.subscriptionStatus === 'active' && 
           this.subscriptionEndDate && 
           new Date(this.subscriptionEndDate) > new Date();
  };

  Tenant.prototype.getRemainingDays = function() {
    if (!this.subscriptionEndDate) return 0;
    
    const now = new Date();
    const endDate = new Date(this.subscriptionEndDate);
    const diffTime = endDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  Tenant.prototype.getUsageStats = async function() {
    // TODO: Implement usage statistics
    // This would typically query related models to get usage data
    return {
      userCount: 0,
      projectCount: 0,
      storageUsed: 0,
      lastActivity: null
    };
  };

  Tenant.prototype.canCreateUser = async function() {
    const stats = await this.getUsageStats();
    return stats.userCount < this.maxUsers;
  };

  Tenant.prototype.canCreateProject = async function() {
    const stats = await this.getUsageStats();
    return stats.projectCount < this.maxProjects;
  };

  Tenant.prototype.hasStorageSpace = function(requiredBytes) {
    // TODO: Implement storage check
    return true; // For now, always allow
  };

  // Static methods
  Tenant.findBySlug = function(slug) {
    return this.findOne({ where: { slug, isActive: true } });
  };

  Tenant.findActiveByGST = function(gstNumber) {
    return this.findOne({ where: { gstNumber, isActive: true } });
  };

  // Hooks
  Tenant.beforeCreate((tenant) => {
    if (!tenant.slug) {
      tenant.slug = tenant.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    }
  });

  Tenant.beforeUpdate((tenant) => {
    if (tenant.changed('name') && !tenant.changed('slug')) {
      tenant.slug = tenant.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    }
  });

  // Associations
  Tenant.associate = (models) => {
    // Tenant has many Users
    Tenant.hasMany(models.User, {
      foreignKey: 'tenantId',
      as: 'users'
    });

    // Tenant has many Projects
    Tenant.hasMany(models.Project, {
      foreignKey: 'tenantId',
      as: 'projects'
    });

    // Tenant has many Subscriptions
    Tenant.hasMany(models.Subscription, {
      foreignKey: 'tenantId',
      as: 'subscriptions'
    });

    // Tenant has many Accounts
    Tenant.hasMany(models.Account, {
      foreignKey: 'tenantId',
      as: 'accounts'
    });

    // Tenant has many Assets
    Tenant.hasMany(models.Asset, {
      foreignKey: 'tenantId',
      as: 'assets'
    });

    // Tenant has many Shares
    Tenant.hasMany(models.Share, {
      foreignKey: 'tenantId',
      as: 'shares'
    });

    // Tenant has many Invoices
    Tenant.hasMany(models.Invoice, {
      foreignKey: 'tenantId',
      as: 'invoices'
    });

    // Tenant has many AuditLogs
    Tenant.hasMany(models.AuditLog, {
      foreignKey: 'tenantId',
      as: 'auditLogs'
    });

    // Self-referential associations for createdBy/updatedBy
    Tenant.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });

    Tenant.belongsTo(models.User, {
      foreignKey: 'updatedBy',
      as: 'updater'
    });
  };

  return Tenant;
};