'use client';

import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { api } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/utils';
import {
  FolderOpen,
  Users,
  Clock,
  BarChart3,
  Calendar,
  Target,
  Activity,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ProjectDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
}

export function ProjectDetailsModal({
  isOpen,
  onClose,
  project,
}: ProjectDetailsModalProps) {
  const [projectDetails, setProjectDetails] = useState<any>(null);
  const [timeLogs, setTimeLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && project) {
      fetchProjectDetails();
    }
  }, [isOpen, project]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const [detailsResponse, timeLogsResponse] = await Promise.all([
        api.get(`/projects/${project.id}`),
        api.get(`/time-logs?projectId=${project.id}&limit=50`),
      ]);

      setProjectDetails(detailsResponse.data);
      setTimeLogs(timeLogsResponse.data.data);
    } catch (error) {
      console.error('Error fetching project details:', error);
      toast.error('Failed to fetch project details');
    } finally {
      setLoading(false);
    }
  };

  const getTotalHours = () => {
    return timeLogs
      .filter((log) => log.status === 'APPROVED')
      .reduce((total, log) => total + (log.totalHours || 0), 0);
  };

  const getWorkerCount = () => {
    return projectDetails?.workerProjects?.length || 0;
  };

  if (!project) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Project Details - ${project.name}`}
      size="full"
    >
      <div className="space-y-4 lg:space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#008080]"></div>
          </div>
        ) : (
          <>
            {/* Project Info */}
            <div className="bg-gradient-to-r from-[#008080]/10 to-[#006666]/10 rounded-lg p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-[#008080] to-[#006666] rounded-xl flex items-center justify-center flex-shrink-0">
                  <FolderOpen className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-2">
                    {project.name}
                  </h3>
                  <p className="text-gray-600 mb-3 text-sm lg:text-base">
                    {project.description || 'No description available'}
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Created {formatDate(project.createdAt)}</span>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        project.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {project.isActive ? '🟢 Active' : '🔴 Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <Users className="w-6 h-6 lg:w-8 lg:h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-xl lg:text-2xl font-bold text-blue-900">
                  {getWorkerCount()}
                </div>
                <div className="text-sm text-blue-700">Total Staff</div>
              </div>

              <div className="bg-green-50 rounded-lg p-4 text-center">
                <Clock className="w-6 h-6 lg:w-8 lg:h-8 text-green-600 mx-auto mb-2" />
                <div className="text-xl lg:text-2xl font-bold text-green-900">
                  {getTotalHours().toFixed(1)}h
                </div>
                <div className="text-sm text-green-700">Total Hours</div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <BarChart3 className="w-6 h-6 lg:w-8 lg:h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-xl lg:text-2xl font-bold text-purple-900">
                  {timeLogs.length}
                </div>
                <div className="text-sm text-purple-700">Time Entries</div>
              </div>
            </div>

            {/* Assigned Staff */}
            {projectDetails?.workerProjects &&
              projectDetails.workerProjects.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center text-sm lg:text-base">
                    <Users className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
                    Assigned Staff
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {projectDetails.workerProjects.map((wp: any) => (
                      <div
                        key={wp.worker.id}
                        className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-[#008080] to-[#006666] rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-xs">
                            {wp.worker.firstName[0]}
                            {wp.worker.lastName[0]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {wp.worker.firstName} {wp.worker.lastName}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {wp.worker.email}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Time Logs Table */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="p-4 border-b border-gray-200">
                <h4 className="font-semibold text-gray-900 flex items-center text-sm lg:text-base">
                  <Activity className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
                  Recent Time Logs
                </h4>
              </div>

              {timeLogs.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No time logs recorded for this project yet.</p>
                </div>
              ) : (
                <>
                  {/* Mobile Card View */}
                  <div className="lg:hidden">
                    {timeLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-4 border-b border-gray-200 last:border-b-0"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium text-gray-900 text-sm">
                            {log.user?.firstName} {log.user?.lastName}
                          </div>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              log.status === 'APPROVED'
                                ? 'bg-green-100 text-green-800'
                                : log.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-800'
                                : log.status === 'REJECTED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {log.status === 'APPROVED' && '✅'}
                            {log.status === 'PENDING' && '⏳'}
                            {log.status === 'REJECTED' && '❌'}
                            {log.status === 'EDIT_REQUESTED' && '📝'}{' '}
                            {log.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Date:</span>
                            <span>{formatDate(log.startTime)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Time:</span>
                            <span>
                              {formatTime(log.startTime)} -{' '}
                              {log.endTime
                                ? formatTime(log.endTime)
                                : 'Ongoing'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Hours:</span>
                            <span className="font-medium">
                              {log.totalHours?.toFixed(1) || '0.0'}h
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden lg:block max-h-64 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Staff
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Date
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Time
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Hours
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {timeLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">
                              <div className="font-medium text-gray-900">
                                {log.user?.firstName} {log.user?.lastName}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {formatDate(log.startTime)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {formatTime(log.startTime)} -{' '}
                              {log.endTime
                                ? formatTime(log.endTime)
                                : 'Ongoing'}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {log.totalHours?.toFixed(1) || '0.0'}h
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  log.status === 'APPROVED'
                                    ? 'bg-green-100 text-green-800'
                                    : log.status === 'PENDING'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : log.status === 'REJECTED'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {log.status === 'APPROVED' && '✅'}
                                {log.status === 'PENDING' && '⏳'}
                                {log.status === 'REJECTED' && '❌'}
                                {log.status === 'EDIT_REQUESTED' && '📝'}{' '}
                                {log.status.replace('_', ' ')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
