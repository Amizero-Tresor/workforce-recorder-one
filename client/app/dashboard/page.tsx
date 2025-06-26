'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { DashboardStats, TimeLog, Project } from '@/types';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { 
  Clock, 
  Calendar, 
  CheckCircle, 
  AlertCircle,
  Play,
  Square,
  FileText,
  CalendarDays,
  Timer,
  MapPin
} from 'lucide-react';
import { formatTime, formatDuration } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function WorkerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({});
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [currentTimeLog, setCurrentTimeLog] = useState<TimeLog | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [manualEntry, setManualEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    description: '',
    projectId: '',
  });

  useEffect(() => {
    fetchDashboardData();
    fetchProjects();
    checkCurrentStatus();
    
    // Update current time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
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

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const checkCurrentStatus = async () => {
    try {
      // Check if user has any ongoing time logs (no end time)
      const response = await api.get('/time-logs?limit=10');
      const logs = response.data.data;
      
      const ongoingLog = logs.find((log: TimeLog) => !log.endTime && log.userId === user?.id);
      if (ongoingLog) {
        setCurrentTimeLog(ongoingLog);
        setIsCheckedIn(true);
        setManualEntry(prev => ({ ...prev, projectId: ongoingLog.projectId }));
      }
    } catch (error) {
      console.error('Error checking current status:', error);
    }
  };

  const handleCheckIn = async () => {
    if (!manualEntry.projectId) {
      toast.error('Please select a project');
      return;
    }

    setCheckInLoading(true);
    try {
      const response = await api.post('/time-logs', {
        projectId: manualEntry.projectId,
        startTime: new Date().toISOString(),
        description: manualEntry.description || 'Checked in',
      });
      
      setCurrentTimeLog(response.data);
      setIsCheckedIn(true);
      toast.success('Checked in successfully!');
      fetchDashboardData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to check in');
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!currentTimeLog) return;

    setCheckInLoading(true);
    try {
      await api.put(`/time-logs/${currentTimeLog.id}`, {
        endTime: new Date().toISOString(),
        description: manualEntry.description || 'Checked out',
      });
      
      setCurrentTimeLog(null);
      setIsCheckedIn(false);
      setManualEntry(prev => ({ ...prev, description: '', projectId: '' }));
      toast.success('Checked out successfully!');
      fetchDashboardData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to check out');
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!manualEntry.projectId || !manualEntry.startTime || !manualEntry.endTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (manualEntry.startTime >= manualEntry.endTime) {
      toast.error('End time must be after start time');
      return;
    }

    try {
      const startDateTime = new Date(`${manualEntry.date}T${manualEntry.startTime}`);
      const endDateTime = new Date(`${manualEntry.date}T${manualEntry.endTime}`);

      await api.post('/time-logs', {
        projectId: manualEntry.projectId,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        description: manualEntry.description,
      });

      toast.success('Time entry submitted successfully!');
      setManualEntry({
        date: new Date().toISOString().split('T')[0],
        startTime: '',
        endTime: '',
        description: '',
        projectId: '',
      });
      fetchDashboardData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit time entry');
    }
  };

  const getWorkedTimeToday = () => {
    if (!currentTimeLog || !currentTimeLog.startTime) return { hours: 0, minutes: 0 };
    
    const start = new Date(currentTimeLog.startTime);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return { hours, minutes };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#008080]"></div>
      </div>
    );
  }

  const workedTime = getWorkedTimeToday();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col lg:ml-0">
        <Header />
        
        <main className="flex-1 p-4 lg:p-6 ml-0 lg:ml-0">
          {/* Welcome Section */}
          <div className="mb-6 lg:mb-8">
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
              Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 18 ? 'Afternoon' : 'Evening'}, {user?.firstName}! 👋
            </h1>
            <p className="text-sm lg:text-base text-gray-600">Ready to track your productive day?</p>
          </div>

          {/* Current Status Card */}
          {isCheckedIn && (
            <div className="mb-6 lg:mb-8 bg-gradient-to-r from-[#008080] to-[#006666] rounded-xl p-4 lg:p-6 text-white">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div>
                  <h3 className="text-lg font-semibold mb-2">🟢 Currently Working</h3>
                  <p className="text-green-100 text-sm lg:text-base">
                    Started at {currentTimeLog?.startTime ? formatTime(currentTimeLog.startTime) : '--:--'}
                  </p>
                  <p className="text-green-100 text-sm lg:text-base">
                    Project: {projects.find(p => p.id === currentTimeLog?.projectId)?.name || 'Unknown'}
                  </p>
                </div>
                <div className="text-center sm:text-right">
                  <div className="text-2xl lg:text-3xl font-bold">
                    {workedTime.hours}h {workedTime.minutes}m
                  </div>
                  <p className="text-green-100 text-sm lg:text-base">Time Today</p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
            <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl lg:text-2xl font-bold text-gray-900">{formatDuration(stats.thisWeekHours || 0)}</p>
                  <p className="text-sm text-gray-600">This Week</p>
                  <p className="text-xs text-blue-600">+2h 30m from last week</p>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl lg:text-2xl font-bold text-gray-900">{formatDuration(stats.totalHoursWorked || 0)}</p>
                  <p className="text-sm text-gray-600">This Month</p>
                  <p className="text-xs text-green-600">On track</p>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 lg:w-6 lg:h-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl lg:text-2xl font-bold text-gray-900">{stats.logsApproved || 0}</p>
                  <p className="text-sm text-gray-600">Approved</p>
                  <p className="text-xs text-green-600">Great work!</p>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 lg:w-6 lg:h-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl lg:text-2xl font-bold text-gray-900">{stats.logsPending || 0}</p>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-xs text-yellow-600">Under review</p>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 lg:w-6 lg:h-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
            {/* Time Tracking */}
            <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100">
              <div className="flex items-center space-x-2 mb-4 lg:mb-6">
                <div className="w-8 h-8 bg-[#008080]/10 rounded-lg flex items-center justify-center">
                  <Timer className="w-5 h-5 text-[#008080]" />
                </div>
                <h2 className="text-lg font-semibold">Quick Time Tracking</h2>
              </div>

              <div className="space-y-4">
                {/* Project Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Project *
                  </label>
                  <select
                    value={manualEntry.projectId}
                    onChange={(e) => setManualEntry(prev => ({ ...prev, projectId: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080]"
                    disabled={isCheckedIn}
                  >
                    <option value="">Choose a project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Check In/Out Buttons */}
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                  <Button
                    onClick={handleCheckIn}
                    disabled={isCheckedIn || !manualEntry.projectId || checkInLoading}
                    loading={checkInLoading && !isCheckedIn}
                    className="flex-1 flex items-center justify-center space-x-2 bg-[#008080] hover:bg-[#006666]"
                  >
                    <Play className="w-4 h-4" />
                    <span>Check In</span>
                  </Button>
                  
                  <Button
                    onClick={handleCheckOut}
                    disabled={!isCheckedIn || checkInLoading}
                    loading={checkInLoading && isCheckedIn}
                    variant="secondary"
                    className="flex-1 flex items-center justify-center space-x-2"
                  >
                    <Square className="w-4 h-4" />
                    <span>Check Out</span>
                  </Button>
                </div>

                {/* Activity Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Activity Description
                  </label>
                  <textarea
                    value={manualEntry.description}
                    onChange={(e) => setManualEntry(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="What are you working on today?"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080]"
                    rows={3}
                  />
                </div>
              </div>

              {/* Today's Summary */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center space-x-2 mb-4">
                  <CalendarDays className="w-5 h-5 text-[#008080]" />
                  <h3 className="font-semibold">Today's Summary</h3>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Check In:</span>
                    <span className="font-medium">
                      {currentTimeLog?.startTime ? formatTime(currentTimeLog.startTime) : '--:--'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Current Time:</span>
                    <span className="font-medium">{formatTime(currentTime.toISOString())}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Time Worked:</span>
                    <span>{workedTime.hours}h {workedTime.minutes}m</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Manual Time Entry */}
            <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100">
              <div className="flex items-center space-x-2 mb-4 lg:mb-6">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-orange-600" />
                </div>
                <h2 className="text-lg font-semibold">Manual Time Entry</h2>
              </div>

              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={manualEntry.date}
                    onChange={(e) => setManualEntry(prev => ({ ...prev, date: e.target.value }))}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      value={manualEntry.startTime}
                      onChange={(e) => setManualEntry(prev => ({ ...prev, startTime: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080]"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time *
                    </label>
                    <input
                      type="time"
                      value={manualEntry.endTime}
                      onChange={(e) => setManualEntry(prev => ({ ...prev, endTime: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project *
                  </label>
                  <select
                    value={manualEntry.projectId}
                    onChange={(e) => setManualEntry(prev => ({ ...prev, projectId: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080]"
                    required
                  >
                    <option value="">Choose a project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Activity Description
                  </label>
                  <textarea
                    value={manualEntry.description}
                    onChange={(e) => setManualEntry(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what you worked on..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080]"
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full bg-[#008080] hover:bg-[#006666]">
                  <FileText className="w-4 h-4 mr-2" />
                  Submit Time Entry
                </Button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}