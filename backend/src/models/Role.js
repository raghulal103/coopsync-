module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define('Role', {
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
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 50]
      }
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        is: /^[a-z0-9_-]+$/
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM('system', 'custom'),
      defaultValue: 'custom'
    },
    level: {
      type: DataTypes.INTEGER,
      defaultValue: 100,
      validate: {
        min: 1,
        max: 1000
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    capabilities: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    restrictions: {
      type: DataTypes.JSON,
      defaultValue: {}
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
    tableName: 'roles',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['tenant_id', 'slug']
      },
      {
        fields: ['tenant_id']
      },
      {
        fields: ['type']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['level']
      }
    ]
  });

  // Instance methods
  Role.prototype.hasPermission = function(permission) {
    // TODO: Check if role has specific permission
    return false;
  };

  Role.prototype.canAccess = function(resource, action) {
    // TODO: Check if role can access resource with specific action
    return false;
  };

  Role.prototype.isHigherThan = function(otherRole) {
    return this.level > otherRole.level;
  };

  Role.prototype.isLowerThan = function(otherRole) {
    return this.level < otherRole.level;
  };

  Role.prototype.getUserCount = async function() {
    const UserRole = sequelize.models.UserRole;
    const count = await UserRole.count({
      where: { roleId: this.id }
    });
    return count;
  };

  // Static methods
  Role.getSystemRoles = function() {
    return this.findAll({
      where: { type: 'system', isActive: true }
    });
  };

  Role.getDefaultRole = function(tenantId) {
    return this.findOne({
      where: { 
        tenantId, 
        isDefault: true, 
        isActive: true 
      }
    });
  };

  Role.findBySlug = function(tenantId, slug) {
    return this.findOne({
      where: { tenantId, slug, isActive: true }
    });
  };

  // Hooks
  Role.beforeCreate((role) => {
    if (!role.slug) {
      role.slug = role.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
    }
  });

  Role.beforeUpdate((role) => {
    if (role.changed('name') && !role.changed('slug')) {
      role.slug = role.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
    }
  });

  // Associations
  Role.associate = (models) => {
    // Role belongs to Tenant
    Role.belongsTo(models.Tenant, {
      foreignKey: 'tenantId',
      as: 'tenant'
    });

    // Role has many UserRoles
    Role.hasMany(models.UserRole, {
      foreignKey: 'roleId',
      as: 'userRoles'
    });

    // Role belongs to many Users through UserRoles
    Role.belongsToMany(models.User, {
      through: models.UserRole,
      foreignKey: 'roleId',
      otherKey: 'userId',
      as: 'users'
    });

    // Role has many RolePermissions
    Role.hasMany(models.RolePermission, {
      foreignKey: 'roleId',
      as: 'rolePermissions'
    });

    // Role belongs to many Permissions through RolePermissions
    Role.belongsToMany(models.Permission, {
      through: models.RolePermission,
      foreignKey: 'roleId',
      otherKey: 'permissionId',
      as: 'permissions'
    });

    // Self-referential associations for createdBy/updatedBy
    Role.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });

    Role.belongsTo(models.User, {
      foreignKey: 'updatedBy',
      as: 'updater'
    });
  };

  return Role;
};