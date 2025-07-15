module.exports = (sequelize, DataTypes) => {
  const RolePermission = sequelize.define('RolePermission', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    roleId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Roles',
        key: 'id'
      }
    },
    permissionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Permissions',
        key: 'id'
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    grantedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    grantedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    revokedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    conditions: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {}
    }
  }, {
    tableName: 'role_permissions',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['role_id', 'permission_id']
      },
      {
        fields: ['role_id']
      },
      {
        fields: ['permission_id']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['granted_at']
      }
    ]
  });

  // Instance methods
  RolePermission.prototype.activate = function() {
    this.isActive = true;
    this.revokedAt = null;
    this.revokedBy = null;
    return this.save();
  };

  RolePermission.prototype.revoke = function(revokedBy) {
    this.isActive = false;
    this.revokedAt = new Date();
    this.revokedBy = revokedBy;
    return this.save();
  };

  RolePermission.prototype.hasCondition = function(condition) {
    return this.conditions && this.conditions[condition] !== undefined;
  };

  RolePermission.prototype.getConditionValue = function(condition) {
    return this.conditions && this.conditions[condition];
  };

  RolePermission.prototype.setCondition = function(condition, value) {
    if (!this.conditions) this.conditions = {};
    this.conditions[condition] = value;
    this.changed('conditions', true);
    return this;
  };

  RolePermission.prototype.removeCondition = function(condition) {
    if (this.conditions && this.conditions[condition] !== undefined) {
      delete this.conditions[condition];
      this.changed('conditions', true);
    }
    return this;
  };

  // Static methods
  RolePermission.getPermissionsByRole = function(roleId) {
    return this.findAll({
      where: { roleId, isActive: true },
      include: [{
        model: sequelize.models.Permission,
        as: 'permission',
        where: { isActive: true }
      }]
    });
  };

  RolePermission.getRolesByPermission = function(permissionId) {
    return this.findAll({
      where: { permissionId, isActive: true },
      include: [{
        model: sequelize.models.Role,
        as: 'role',
        where: { isActive: true }
      }]
    });
  };

  RolePermission.grantPermission = async function(roleId, permissionId, grantedBy, conditions = {}) {
    const [rolePermission, created] = await this.findOrCreate({
      where: { roleId, permissionId },
      defaults: {
        isActive: true,
        grantedAt: new Date(),
        grantedBy,
        conditions
      }
    });

    if (!created && !rolePermission.isActive) {
      rolePermission.isActive = true;
      rolePermission.grantedAt = new Date();
      rolePermission.grantedBy = grantedBy;
      rolePermission.conditions = conditions;
      rolePermission.revokedAt = null;
      rolePermission.revokedBy = null;
      await rolePermission.save();
    }

    return rolePermission;
  };

  RolePermission.revokePermission = async function(roleId, permissionId, revokedBy) {
    const rolePermission = await this.findOne({
      where: { roleId, permissionId, isActive: true }
    });

    if (rolePermission) {
      return rolePermission.revoke(revokedBy);
    }

    return null;
  };

  RolePermission.hasPermission = async function(roleId, permissionId) {
    const rolePermission = await this.findOne({
      where: { roleId, permissionId, isActive: true }
    });

    return !!rolePermission;
  };

  RolePermission.syncPermissions = async function(roleId, permissionIds, grantedBy) {
    // Get current permissions
    const currentPermissions = await this.findAll({
      where: { roleId, isActive: true }
    });

    const currentPermissionIds = currentPermissions.map(rp => rp.permissionId);

    // Revoke permissions that are no longer needed
    const toRevoke = currentPermissionIds.filter(id => !permissionIds.includes(id));
    for (const permissionId of toRevoke) {
      await this.revokePermission(roleId, permissionId, grantedBy);
    }

    // Grant new permissions
    const toGrant = permissionIds.filter(id => !currentPermissionIds.includes(id));
    for (const permissionId of toGrant) {
      await this.grantPermission(roleId, permissionId, grantedBy);
    }

    return true;
  };

  // Hooks
  RolePermission.beforeCreate((rolePermission) => {
    if (!rolePermission.grantedAt) {
      rolePermission.grantedAt = new Date();
    }
  });

  // Associations
  RolePermission.associate = (models) => {
    // RolePermission belongs to Role
    RolePermission.belongsTo(models.Role, {
      foreignKey: 'roleId',
      as: 'role'
    });

    // RolePermission belongs to Permission
    RolePermission.belongsTo(models.Permission, {
      foreignKey: 'permissionId',
      as: 'permission'
    });

    // RolePermission belongs to User (grantedBy)
    RolePermission.belongsTo(models.User, {
      foreignKey: 'grantedBy',
      as: 'granter'
    });

    // RolePermission belongs to User (revokedBy)
    RolePermission.belongsTo(models.User, {
      foreignKey: 'revokedBy',
      as: 'revoker'
    });
  };

  return RolePermission;
};