module.exports = (sequelize, DataTypes) => {
  const UserRole = sequelize.define('UserRole', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    roleId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Roles',
        key: 'id'
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    assignedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    assignedBy: {
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
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {}
    }
  }, {
    tableName: 'user_roles',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'role_id']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['role_id']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['assigned_at']
      }
    ]
  });

  // Instance methods
  UserRole.prototype.activate = function() {
    this.isActive = true;
    this.revokedAt = null;
    this.revokedBy = null;
    return this.save();
  };

  UserRole.prototype.revoke = function(revokedBy) {
    this.isActive = false;
    this.revokedAt = new Date();
    this.revokedBy = revokedBy;
    return this.save();
  };

  UserRole.prototype.isExpired = function() {
    // Add logic for role expiration if needed
    return false;
  };

  // Static methods
  UserRole.getActiveRoles = function(userId) {
    return this.findAll({
      where: { userId, isActive: true },
      include: [{
        model: sequelize.models.Role,
        as: 'role',
        where: { isActive: true }
      }]
    });
  };

  UserRole.getUsersByRole = function(roleId) {
    return this.findAll({
      where: { roleId, isActive: true },
      include: [{
        model: sequelize.models.User,
        as: 'user',
        where: { isActive: true }
      }]
    });
  };

  UserRole.assignRole = async function(userId, roleId, assignedBy) {
    const [userRole, created] = await this.findOrCreate({
      where: { userId, roleId },
      defaults: {
        isActive: true,
        assignedAt: new Date(),
        assignedBy
      }
    });

    if (!created && !userRole.isActive) {
      userRole.isActive = true;
      userRole.assignedAt = new Date();
      userRole.assignedBy = assignedBy;
      userRole.revokedAt = null;
      userRole.revokedBy = null;
      await userRole.save();
    }

    return userRole;
  };

  UserRole.revokeRole = async function(userId, roleId, revokedBy) {
    const userRole = await this.findOne({
      where: { userId, roleId, isActive: true }
    });

    if (userRole) {
      return userRole.revoke(revokedBy);
    }

    return null;
  };

  // Hooks
  UserRole.beforeCreate((userRole) => {
    if (!userRole.assignedAt) {
      userRole.assignedAt = new Date();
    }
  });

  // Associations
  UserRole.associate = (models) => {
    // UserRole belongs to User
    UserRole.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });

    // UserRole belongs to Role
    UserRole.belongsTo(models.Role, {
      foreignKey: 'roleId',
      as: 'role'
    });

    // UserRole belongs to User (assignedBy)
    UserRole.belongsTo(models.User, {
      foreignKey: 'assignedBy',
      as: 'assigner'
    });

    // UserRole belongs to User (revokedBy)
    UserRole.belongsTo(models.User, {
      foreignKey: 'revokedBy',
      as: 'revoker'
    });
  };

  return UserRole;
};