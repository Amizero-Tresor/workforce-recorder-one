'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { DashboardStats } from '@/types';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Calendar,
  Building,
  Shield,
  Activity,
  Target
} from 'lucide-react';
import { formatDuration } from '@/lib/utils';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({});
  const [loading, setLoading] = useState(true);
  const [recentActivity] = useState([
    { id: 1, user: 'John Doe', action: 'submitted time entry', time: '2 minutes ago', type: 'time_log' },
    { id: 2, user: 'Sarah Wilson', action: 'requested edit', time: '15 minutes ago', type: 'edit_request' },
    { id: 3, user: 'Mike Johnson', action: 'checked in', time: '1 hour ago', type: 'check_in' },
    { id: 4, user: 'Emily Davis', action: 'completed project task', time: '2 hours ago', type: 'task_complete' },
  ]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'time_log': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'edit_request': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'check_in': return <Activity className="w-4 h-4 text-green-500" />;
      case 'task_complete': return <Target className="w-4 h-4 text-purple-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#171717]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const isCorporateAdmin = user?.role === 'CORPORATE_ADMIN';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#171717] flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <Header />
        
        <main className="flex-1 p-4 lg:p-6">
          {/* Welcome Section */}
          <div className="mb-6 lg:mb-8">
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
              Welcome back, {user?.firstName}! 👋
            </h1>
            <p className="text-sm lg:text-base text-gray-600 dark:text-gray-300">
              {isCorporateAdmin 
                ? 'Here\'s an overview of all companies and operations'
                : 'Here\'s what\'s happening in your company today'
              }
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
            {isCorporateAdmin ? (
              <>
                <div className="bg-white dark:bg-[#171717] rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCompanies || 0}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Total Companies</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">Across all operations</p>
                    </div>
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                      <Building className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-[#171717] rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{stats.totalWorkers || 0}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Total Workers</p>
                      <p className="text-xs text-green-600 dark:text-green-400">All companies</p>
                    </div>
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
                      <Users className="w-5 h-5 lg:w-6 lg:h-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-[#171717] rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{stats.totalAdmins || 0}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Company Admins</p>
                      <p className="text-xs text-purple-600 dark:text-purple-400">Management team</p>
                    </div>
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center">
                      <Shield className="w-5 h-5 lg:w-6 lg:h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-[#171717] rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingLogs || 0}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Pending Reviews</p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-400">Require attention</p>
                    </div>
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-yellow-100 dark:bg-yellow-900 rounded-xl flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 lg:w-6 lg:h-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-white dark:bg-[#171717] rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{stats.totalWorkers || 0}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Total Workers</p>
                      <p className="text-xs text-green-600 dark:text-green-400">In your company</p>
                    </div>
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
                      <Users className="w-5 h-5 lg:w-6 lg:h-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-[#171717] rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingLogs || 0}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Pending Reviews</p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-400">Require attention</p>
                    </div>
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-yellow-100 dark:bg-yellow-900 rounded-xl flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 lg:w-6 lg:h-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-[#171717] rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{formatDuration(stats.thisWeekHours || 0)}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Time This Week</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">Team total</p>
                    </div>
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                      <Clock className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-[#171717] rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{stats.activeProjects || 0}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Active Projects</p>
                      <p className="text-xs text-purple-600 dark:text-purple-400">Currently running</p>
                    </div>
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center">
                      <Target className="w-5 h-5 lg:w-6 lg:h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
            {/* Recent Activity */}
            <div className="bg-white dark:bg-[#171717] rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4 lg:mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
                <Activity className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
              
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-white">
                        <span className="font-medium">{activity.user}</span> {activity.action}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Overview */}
            <div className="bg-white dark:bg-[#171717] rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4 lg:mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Performance Overview</h2>
                <TrendingUp className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Approved Logs</span>
                  </div>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">{stats.approvedLogs || 0}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Total Time</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatDuration(stats.thisWeekHours || 0)}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Active Projects</span>
                  </div>
                  <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{stats.activeProjects || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}