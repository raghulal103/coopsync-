import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  FiUsers, 
  FiFolder, 
  FiDollarSign, 
  FiTrendingUp, 
  FiClock, 
  FiCheckCircle,
  FiAlertCircle,
  FiCalendar,
  FiActivity
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const DashboardPage = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalUsers: 248,
      activeProjects: 12,
      monthlyRevenue: 1250000,
      completedTasks: 89
    },
    recentActivities: [
      { id: 1, type: 'project', message: 'Project Alpha completed', time: '2 hours ago' },
      { id: 2, type: 'user', message: 'New user John Doe registered', time: '4 hours ago' },
      { id: 3, type: 'payment', message: 'Payment of ₹50,000 received', time: '6 hours ago' },
      { id: 4, type: 'task', message: 'Task "Update inventory" completed', time: '1 day ago' }
    ],
    upcomingTasks: [
      { id: 1, title: 'Monthly GST Filing', dueDate: '2024-01-15', priority: 'high' },
      { id: 2, title: 'Payroll Processing', dueDate: '2024-01-20', priority: 'medium' },
      { id: 3, title: 'Asset Maintenance Review', dueDate: '2024-01-25', priority: 'low' }
    ],
    alerts: [
      { id: 1, type: 'warning', message: 'GST filing due in 3 days', urgent: true },
      { id: 2, type: 'info', message: 'System backup completed successfully', urgent: false }
    ]
  });

  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <div className="flex items-center mt-2">
              <FiTrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">{trend}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  const ActivityItem = ({ activity }) => {
    const getIcon = (type) => {
      switch (type) {
        case 'project': return <FiFolder className="h-4 w-4 text-blue-500" />;
        case 'user': return <FiUsers className="h-4 w-4 text-green-500" />;
        case 'payment': return <FiDollarSign className="h-4 w-4 text-yellow-500" />;
        case 'task': return <FiCheckCircle className="h-4 w-4 text-purple-500" />;
        default: return <FiActivity className="h-4 w-4 text-gray-500" />;
      }
    };

    return (
      <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
        <div className="flex-shrink-0">
          {getIcon(activity.type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{activity.message}</p>
          <p className="text-sm text-gray-500">{activity.time}</p>
        </div>
      </div>
    );
  };

  const TaskItem = ({ task }) => {
    const getPriorityColor = (priority) => {
      switch (priority) {
        case 'high': return 'bg-red-100 text-red-800';
        case 'medium': return 'bg-yellow-100 text-yellow-800';
        case 'low': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{task.title}</p>
          <p className="text-sm text-gray-500">Due: {task.dueDate}</p>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
      </div>
    );
  };

  const AlertItem = ({ alert }) => (
    <div className={`p-4 rounded-lg ${alert.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' : 'bg-blue-50 border border-blue-200'}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <FiAlertCircle className={`h-5 w-5 ${alert.type === 'warning' ? 'text-yellow-400' : 'text-blue-400'}`} />
        </div>
        <div className="ml-3">
          <p className={`text-sm font-medium ${alert.type === 'warning' ? 'text-yellow-800' : 'text-blue-800'}`}>
            {alert.message}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Dashboard - Cooperative ERP</title>
        <meta name="description" content="ERP Dashboard for Cooperative Society Management" />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <h1 className="text-2xl font-bold text-gray-900">
                Good morning, {user?.firstName}!
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Here's what's happening with your cooperative society today.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Users"
              value={dashboardData.stats.totalUsers}
              icon={FiUsers}
              color="bg-blue-500"
              trend="+12% from last month"
            />
            <StatCard
              title="Active Projects"
              value={dashboardData.stats.activeProjects}
              icon={FiFolder}
              color="bg-green-500"
              trend="+5% from last month"
            />
            <StatCard
              title="Monthly Revenue"
              value={`₹${(dashboardData.stats.monthlyRevenue / 100000).toFixed(1)}L`}
              icon={FiDollarSign}
              color="bg-yellow-500"
              trend="+8% from last month"
            />
            <StatCard
              title="Completed Tasks"
              value={dashboardData.stats.completedTasks}
              icon={FiCheckCircle}
              color="bg-purple-500"
              trend="+15% from last month"
            />
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Activities */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Recent Activities</h2>
                </div>
                <div className="p-4 space-y-2">
                  {dashboardData.recentActivities.map(activity => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                </div>
              </div>
            </div>

            {/* Upcoming Tasks */}
            <div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Upcoming Tasks</h2>
                </div>
                <div className="p-4 space-y-2">
                  {dashboardData.upcomingTasks.map(task => (
                    <TaskItem key={task.id} task={task} />
                  ))}
                </div>
              </div>

              {/* Alerts */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Alerts</h2>
                </div>
                <div className="p-4 space-y-3">
                  {dashboardData.alerts.map(alert => (
                    <AlertItem key={alert.id} alert={alert} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button className="btn btn-primary flex items-center justify-center">
                    <FiUsers className="h-4 w-4 mr-2" />
                    Add User
                  </button>
                  <button className="btn btn-secondary flex items-center justify-center">
                    <FiFolder className="h-4 w-4 mr-2" />
                    Create Project
                  </button>
                  <button className="btn btn-success flex items-center justify-center">
                    <FiDollarSign className="h-4 w-4 mr-2" />
                    Process Payroll
                  </button>
                  <button className="btn btn-warning flex items-center justify-center">
                    <FiCalendar className="h-4 w-4 mr-2" />
                    Schedule Task
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;