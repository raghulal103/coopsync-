module.exports = (sequelize, DataTypes) => {
  const Permission = sequelize.define('Permission', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        len: [1, 100]
      }
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        is: /^[a-z0-9_.-]+$/
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    module: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 50]
      }
    },
    resource: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 50]
      }
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 50]
      }
    },
    type: {
      type: DataTypes.ENUM('system', 'custom'),
      defaultValue: 'system'
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
    metadata: {
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
    tableName: 'permissions',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['slug']
      },
      {
        fields: ['module']
      },
      {
        fields: ['resource']
      },
      {
        fields: ['action']
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
  Permission.prototype.getFullName = function() {
    return `${this.module}.${this.resource}.${this.action}`;
  };

  Permission.prototype.matches = function(module, resource, action) {
    return this.module === module && 
           this.resource === resource && 
           this.action === action;
  };

  Permission.prototype.getRoleCount = async function() {
    const RolePermission = sequelize.models.RolePermission;
    const count = await RolePermission.count({
      where: { permissionId: this.id }
    });
    return count;
  };

  // Static methods
  Permission.getSystemPermissions = function() {
    return this.findAll({
      where: { type: 'system', isActive: true }
    });
  };

  Permission.getByModule = function(module) {
    return this.findAll({
      where: { module, isActive: true },
      order: [['resource', 'ASC'], ['action', 'ASC']]
    });
  };

  Permission.findBySlug = function(slug) {
    return this.findOne({
      where: { slug, isActive: true }
    });
  };

  Permission.findByResourceAction = function(module, resource, action) {
    return this.findOne({
      where: { module, resource, action, isActive: true }
    });
  };

  Permission.getHierarchy = function() {
    return this.findAll({
      where: { isActive: true },
      order: [['module', 'ASC'], ['level', 'ASC']]
    });
  };

  // Hooks
  Permission.beforeCreate((permission) => {
    if (!permission.slug) {
      permission.slug = `${permission.module}.${permission.resource}.${permission.action}`;
    }
  });

  Permission.beforeUpdate((permission) => {
    if (permission.changed('module') || permission.changed('resource') || permission.changed('action')) {
      permission.slug = `${permission.module}.${permission.resource}.${permission.action}`;
    }
  });

  // Associations
  Permission.associate = (models) => {
    // Permission has many RolePermissions
    Permission.hasMany(models.RolePermission, {
      foreignKey: 'permissionId',
      as: 'rolePermissions'
    });

    // Permission belongs to many Roles through RolePermissions
    Permission.belongsToMany(models.Role, {
      through: models.RolePermission,
      foreignKey: 'permissionId',
      otherKey: 'roleId',
      as: 'roles'
    });

    // Self-referential associations for createdBy/updatedBy
    Permission.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });

    Permission.belongsTo(models.User, {
      foreignKey: 'updatedBy',
      as: 'updater'
    });
  };

  return Permission;
};