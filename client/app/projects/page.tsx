'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Project, PaginatedResponse, TimeLog } from '@/types';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Modal } from '@/components/ui/Modal';
import { 
  FolderOpen, 
  Calendar, 
  Users,
  Clock,
  CheckCircle,
  Eye,
  BarChart3
} from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function WorkerProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectTimeLogs, setProjectTimeLogs] = useState<TimeLog[]>([]);
  const [showTimeLogsModal, setShowTimeLogsModal] = useState(false);
  const [timeLogsLoading, setTimeLogsLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/projects');
      const data: PaginatedResponse<Project> = response.data;
      setProjects(data.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectTimeLogs = async (projectId: string) => {
    try {
      setTimeLogsLoading(true);
      const response = await api.get(`/time-logs?projectId=${projectId}&limit=50`);
      setProjectTimeLogs(response.data.data);
    } catch (error) {
      console.error('Error fetching project time logs:', error);
      toast.error('Failed to fetch project time logs');
    } finally {
      setTimeLogsLoading(false);
    }
  };

  const handleViewProjectTimes = async (project: Project) => {
    setSelectedProject(project);
    setShowTimeLogsModal(true);
    await fetchProjectTimeLogs(project.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#008080]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col lg:ml-0">
        <Header />
        
        <main className="flex-1 p-4 lg:p-6">
          <div className="mb-6">
            <h1 className="text-lg lg:text-2xl font-semibold text-gray-900">My Projects</h1>
            <p className="text-sm lg:text-base text-gray-600">Projects you're currently assigned to and your work history</p>
          </div>

          {projects.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 lg:p-12 text-center">
              <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No projects assigned</h3>
              <p className="mt-1 text-sm text-gray-500">
                You haven't been assigned to any projects yet. Contact your administrator.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
              {projects.map((project) => (
                <div key={project.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
                  <div className="p-4 lg:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-[#008080] to-[#006666] rounded-xl flex items-center justify-center">
                        <FolderOpen className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 lg:px-2.5 lg:py-0.5 rounded-full text-xs font-medium ${
                        project.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {project.isActive ? '🟢 Active' : '🔴 Inactive'}
                      </span>
                    </div>
                    
                    <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {project.name}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {project.description || 'No description available'}
                    </p>
                    
                    <div className="space-y-2 lg:space-y-3">
                      <div className="flex items-center text-xs lg:text-sm text-gray-500">
                        <Calendar className="w-3 h-3 lg:w-4 lg:h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">Created {formatDate(project.createdAt)}</span>
                      </div>
                      
                      <div className="flex items-center text-xs lg:text-sm text-gray-500">
                        <Users className="w-3 h-3 lg:w-4 lg:h-4 mr-2 flex-shrink-0" />
                        <span>{project._count?.workerProjects || 0} team members</span>
                      </div>
                      
                      <div className="flex items-center text-xs lg:text-sm text-gray-500">
                        <Clock className="w-3 h-3 lg:w-4 lg:h-4 mr-2 flex-shrink-0" />
                        <span>{project._count?.timeLogs || 0} time entries</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 lg:mt-6 pt-4 border-t border-gray-200">
                      <button 
                        onClick={() => handleViewProjectTimes(project)}
                        className="w-full bg-gradient-to-r from-[#008080] to-[#006666] text-white py-2 lg:py-2.5 px-4 rounded-lg hover:from-[#006666] hover:to-[#004d4d] transition-all duration-200 text-sm font-medium flex items-center justify-center space-x-2"
                      >
                        <BarChart3 className="w-4 h-4" />
                        <span>View My Work History</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Project Time Logs Modal */}
      <Modal
        isOpen={showTimeLogsModal}
        onClose={() => {
          setShowTimeLogsModal(false);
          setSelectedProject(null);
          setProjectTimeLogs([]);
        }}
        title={`Work History - ${selectedProject?.name}`}
        size="full"
      >
        <div className="space-y-4 lg:space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-3 lg:p-4 text-center">
              <div className="text-xl lg:text-2xl font-bold text-blue-600">
                {projectTimeLogs.length}
              </div>
              <div className="text-xs lg:text-sm text-blue-600">Total Entries</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 lg:p-4 text-center">
              <div className="text-xl lg:text-2xl font-bold text-green-600">
                {projectTimeLogs.filter(log => log.status === 'APPROVED').length}
              </div>
              <div className="text-xs lg:text-sm text-green-600">Approved</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 lg:p-4 text-center">
              <div className="text-xl lg:text-2xl font-bold text-purple-600">
                {projectTimeLogs
                  .filter(log => log.status === 'APPROVED')
                  .reduce((total, log) => total + (log.totalHours || 0), 0)
                  .toFixed(1)}h
              </div>
              <div className="text-xs lg:text-sm text-purple-600">Total Hours</div>
            </div>
          </div>

          {timeLogsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#008080]"></div>
            </div>
          ) : projectTimeLogs.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No work history</h3>
              <p className="mt-1 text-sm text-gray-500">
                You haven't logged any time for this project yet.
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="lg:hidden space-y-3">
                {projectTimeLogs.map((log) => (
                  <div key={log.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm font-medium text-gray-900">
                        {formatDate(log.startTime)}
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        log.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        log.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        log.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {log.status === 'APPROVED' && '✅'}
                        {log.status === 'PENDING' && '⏳'}
                        {log.status === 'REJECTED' && '❌'}
                        {log.status === 'EDIT_REQUESTED' && '📝'}
                        {' '}
                        {log.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Time:</span>
                        <span>{formatTime(log.startTime)} - {log.endTime ? formatTime(log.endTime) : 'Ongoing'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Hours:</span>
                        <span className="font-medium">{log.totalHours?.toFixed(1) || '0.0'}h</span>
                      </div>
                      {log.description && (
                        <div className="mt-2">
                          <span className="text-gray-500 text-xs">Description:</span>
                          <p className="text-gray-600 text-xs mt-1">{log.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {projectTimeLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatDate(log.startTime)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatTime(log.startTime)} - {log.endTime ? formatTime(log.endTime) : 'Ongoing'}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {log.totalHours?.toFixed(1) || '0.0'}h
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            log.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                            log.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            log.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {log.status === 'APPROVED' && '✅'}
                            {log.status === 'PENDING' && '⏳'}
                            {log.status === 'REJECTED' && '❌'}
                            {log.status === 'EDIT_REQUESTED' && '📝'}
                            {' '}
                            {log.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                          <div className="truncate" title={log.description || 'No description'}>
                            {log.description || 'No description'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}