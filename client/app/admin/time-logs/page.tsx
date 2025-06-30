'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { TimeLog, PaginatedResponse, TimeLogFilters, Project } from '@/types';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TimeLogDetailsModal } from '@/components/ui/TimeLogDetailsModal';
import {
  Check,
  X,
  Edit3,
  Download,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  FileText,
} from 'lucide-react';
import {
  formatDate,
  formatTime,
  formatDuration,
  getStatusColor,
} from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AdminTimeLogsPage() {
  const { user } = useAuth();
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLogs, setSelectedLogs] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<
    'APPROVED' | 'REJECTED' | 'EDIT_REQUESTED' | ''
  >('');
  const [feedback, setFeedback] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showEditRequestModal, setShowEditRequestModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTimeLog, setSelectedTimeLog] = useState<TimeLog | null>(null);
  const [editRequestTimeLogId, setEditRequestTimeLogId] = useState<string>('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<TimeLogFilters>({
    status: '',
    projectId: '',
    userId: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchTimeLogs();
    fetchProjects();
  }, [pagination.page, filters]);

  const fetchTimeLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
      });

      const response = await api.get(`/time-logs?${params}`);
      const data: PaginatedResponse<TimeLog> = response.data;

      setTimeLogs(data.data);
      setPagination((prev) => ({
        ...prev,
        total: data.meta.total,
        totalPages: data.meta.totalPages,
      }));
    } catch (error) {
      console.error('Error fetching time logs:', error);
      toast.error('Failed to fetch time logs');
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

  const handleSelectAll = () => {
    if (selectedLogs.length === timeLogs.length) {
      setSelectedLogs([]);
    } else {
      setSelectedLogs(timeLogs.map((log) => log.id));
    }
  };

  const handleSelectLog = (logId: string) => {
    setSelectedLogs((prev) =>
      prev.includes(logId)
        ? prev.filter((id) => id !== logId)
        : [...prev, logId]
    );
  };

  const handleViewDetails = (timeLog: TimeLog) => {
    setSelectedTimeLog(timeLog);
    setShowDetailsModal(true);
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedLogs.length === 0) return;

    if (bulkAction === 'EDIT_REQUESTED' && !feedback.trim()) {
      toast.error('Feedback is required for edit requests');
      return;
    }

    try {
      await api.post('/time-logs/bulk-action', {
        timeLogIds: selectedLogs,
        action: bulkAction,
        feedback: feedback || undefined,
      });

      toast.success(
        `Successfully ${bulkAction.toLowerCase()} ${
          selectedLogs.length
        } time logs`
      );
      setSelectedLogs([]);
      setBulkAction('');
      setFeedback('');
      setShowBulkModal(false);
      fetchTimeLogs();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Failed to perform bulk action'
      );
    }
  };

  const handleSingleAction = async (
    logId: string,
    action: 'APPROVED' | 'REJECTED'
  ) => {
    try {
      await api.patch(`/time-logs/${logId}/review`, {
        status: action,
      });

      toast.success(`Time log ${action.toLowerCase()}`);
      fetchTimeLogs();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update time log');
    }
  };

  const handleEditRequest = async () => {
    if (!feedback.trim()) {
      toast.error('Please provide feedback for the edit request');
      return;
    }

    try {
      await api.patch(`/time-logs/${editRequestTimeLogId}/review`, {
        status: 'EDIT_REQUESTED',
        feedback: feedback,
      });

      toast.success('Edit request sent successfully');
      setShowEditRequestModal(false);
      setEditRequestTimeLogId('');
      setFeedback('');
      fetchTimeLogs();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Failed to send edit request'
      );
    }
  };

  const openEditRequestModal = (logId: string) => {
    setEditRequestTimeLogId(logId);
    setShowEditRequestModal(true);
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      const params = new URLSearchParams({
        format,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
      });

      const response = await api.get(`/time-logs/export?${params}`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `time-logs-${new Date().toISOString().split('T')[0]}.${
        format === 'excel' ? 'xlsx' : 'csv'
      }`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.success(`Time logs exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export time logs');
    }
  };

  const formatTimeWorked = (totalHours: number) => {
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);

    if (hours === 0) {
      return `${minutes}m`;
    } else if (minutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${minutes}m`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#171717]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#008080]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#171717] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col lg:ml-0">
        <Header />

        <main className="flex-1 p-4 lg:p-6">
          <div className="bg-white dark:bg-[#171717] rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="px-4 lg:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div>
                  <h1 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white">
                    Time Logs
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Review and manage worker time entries
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                  <Button
                    onClick={() => handleExport('csv')}
                    variant="outline"
                    size="sm"
                    className="flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export CSV</span>
                  </Button>
                  <Button
                    onClick={() => handleExport('excel')}
                    variant="outline"
                    size="sm"
                    className="flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export Excel</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="px-4 lg:px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#171717]/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, status: e.target.value }))
                  }
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080] text-sm bg-white dark:bg-[#171717] text-gray-900 dark:text-white"
                >
                  <option value="">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="EDIT_REQUESTED">Edit Requested</option>
                </select>

                <select
                  value={filters.projectId}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      projectId: e.target.value,
                    }))
                  }
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080] text-sm bg-white dark:bg-[#171717] text-gray-900 dark:text-white"
                >
                  <option value="">All Projects</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>

                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080] text-sm bg-white dark:bg-[#171717] text-gray-900 dark:text-white"
                  placeholder="Start Date"
                />

                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080] text-sm bg-white dark:bg-[#171717] text-gray-900 dark:text-white"
                  placeholder="End Date"
                />
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedLogs.length > 0 && (
              <div className="px-4 lg:px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 animate-in slide-in-from-top duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <span className="text-sm text-blue-700 dark:text-blue-300">
                    {selectedLogs.length} item(s) selected
                  </span>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <Button
                      onClick={() => {
                        setBulkAction('APPROVED');
                        setShowBulkModal(true);
                      }}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 flex items-center justify-center"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => {
                        setBulkAction('REJECTED');
                        setShowBulkModal(true);
                      }}
                      size="sm"
                      variant="danger"
                      className="flex items-center justify-center"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      onClick={() => {
                        setBulkAction('EDIT_REQUESTED');
                        setShowBulkModal(true);
                      }}
                      size="sm"
                      variant="outline"
                      className="flex items-center justify-center"
                    >
                      <Edit3 className="w-4 h-4 mr-1" />
                      Request Edit
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Card View */}
            <div className="lg:hidden">
              {timeLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 border-b border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedLogs.includes(log.id)}
                        onChange={() => handleSelectLog(log.id)}
                        className="rounded border-gray-300 dark:border-gray-600 text-[#008080] focus:ring-[#008080] bg-white dark:bg-[#171717]"
                      />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {log.user?.firstName} {log.user?.lastName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {log.user?.email}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        log.status
                      )}`}
                    >
                      {log.status === 'PENDING' && '⏳ Pending'}
                      {log.status === 'APPROVED' && '✅ Approved'}
                      {log.status === 'REJECTED' && '❌ Rejected'}
                      {log.status === 'EDIT_REQUESTED' && '📝 Edit Requested'}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">
                        Project:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {log.project?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">
                        Date:
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        {formatDate(log.startTime)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">
                        Time:
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        {formatTime(log.startTime)} -{' '}
                        {log.endTime ? formatTime(log.endTime) : 'Ongoing'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">
                        Duration:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatTimeWorked(log.totalHours || 0)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2 mt-3">
                    {log.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleSingleAction(log.id, 'APPROVED')}
                          className="text-green-600 hover:text-green-900 p-2 rounded-full hover:bg-green-100 dark:hover:bg-green-900/20"
                          title="Approve"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleSingleAction(log.id, 'REJECTED')}
                          className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20"
                          title="Reject"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditRequestModal(log.id)}
                          className="text-orange-600 hover:text-orange-900 p-2 rounded-full hover:bg-orange-100 dark:hover:bg-orange-900/20"
                          title="Request Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleViewDetails(log)}
                      className="text-blue-600 hover:text-blue-900 p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/20"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-[#171717]/50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={
                          selectedLogs.length === timeLogs.length &&
                          timeLogs.length > 0
                        }
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 dark:border-gray-600 text-[#008080] focus:ring-[#008080] bg-white dark:bg-[#171717]"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Staff
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Check In
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Check Out
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Total Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-[#171717] divide-y divide-gray-200 dark:divide-gray-700">
                  {timeLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedLogs.includes(log.id)}
                          onChange={() => handleSelectLog(log.id)}
                          className="rounded border-gray-300 dark:border-gray-600 text-[#008080] focus:ring-[#008080] bg-white dark:bg-[#171717]"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {log.user?.firstName} {log.user?.lastName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {log.user?.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {log.project?.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatTime(log.startTime)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(log.startTime)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {log.endTime ? formatTime(log.endTime) : '--:--'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatTimeWorked(log.totalHours || 0)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            log.status
                          )}`}
                        >
                          {log.status === 'PENDING' && '⏳ Pending'}
                          {log.status === 'APPROVED' && '✅ Approved'}
                          {log.status === 'REJECTED' && '❌ Rejected'}
                          {log.status === 'EDIT_REQUESTED' &&
                            '📝 Edit Requested'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {log.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() =>
                                  handleSingleAction(log.id, 'APPROVED')
                                }
                                className="text-green-600 hover:text-green-900 p-1 rounded-full hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors duration-150"
                                title="Approve"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  handleSingleAction(log.id, 'REJECTED')
                                }
                                className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors duration-150"
                                title="Reject"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openEditRequestModal(log.id)}
                                className="text-orange-600 hover:text-orange-900 p-1 rounded-full hover:bg-orange-100 dark:hover:bg-orange-900/20 transition-colors duration-150"
                                title="Request Edit"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleViewDetails(log)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors duration-150"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {timeLogs.length === 0 && (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  No time logs found
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  No time logs match your current filters.
                </p>
              </div>
            )}

            {/* Pagination */}
            {timeLogs.length > 0 && (
              <div className="px-4 lg:px-6 py-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div className="text-sm text-gray-700 dark:text-gray-300 text-center sm:text-left">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total
                    )}{' '}
                    of {pagination.total} results
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <Button
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: prev.page - 1,
                        }))
                      }
                      disabled={pagination.page === 1}
                      variant="outline"
                      size="sm"
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <Button
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: prev.page + 1,
                        }))
                      }
                      disabled={pagination.page === pagination.totalPages}
                      variant="outline"
                      size="sm"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Edit Request Modal */}
      <Modal
        isOpen={showEditRequestModal}
        onClose={() => {
          setShowEditRequestModal(false);
          setEditRequestTimeLogId('');
          setFeedback('');
        }}
        title="Request Edit"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Feedback for Staff *
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Please explain what needs to be corrected or provide additional details..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080] bg-white dark:bg-[#171717] text-gray-900 dark:text-white"
              rows={4}
              required
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
            <Button
              onClick={() => {
                setShowEditRequestModal(false);
                setEditRequestTimeLogId('');
                setFeedback('');
              }}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditRequest}
              disabled={!feedback.trim()}
              className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700"
            >
              Send Edit Request
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Action Modal */}
      <Modal
        isOpen={showBulkModal}
        onClose={() => {
          setShowBulkModal(false);
          setBulkAction('');
          setFeedback('');
        }}
        title={
          bulkAction === 'APPROVED'
            ? 'Approve Selected Time Logs'
            : bulkAction === 'REJECTED'
            ? 'Reject Selected Time Logs'
            : 'Request Edit for Selected Time Logs'
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Feedback{' '}
              {bulkAction === 'EDIT_REQUESTED' ? '(Required)' : '(Optional)'}
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={
                bulkAction === 'APPROVED'
                  ? 'Add feedback for workers...'
                  : bulkAction === 'REJECTED'
                  ? 'Reason for rejection...'
                  : 'What needs to be edited?'
              }
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080] bg-white dark:bg-[#171717] text-gray-900 dark:text-white"
              rows={3}
              required={bulkAction === 'EDIT_REQUESTED'}
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
            <Button
              onClick={() => {
                setShowBulkModal(false);
                setBulkAction('');
                setFeedback('');
              }}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkAction}
              disabled={bulkAction === 'EDIT_REQUESTED' && !feedback.trim()}
              className={`w-full sm:w-auto ${
                bulkAction === 'APPROVED'
                  ? 'bg-green-600 hover:bg-green-700'
                  : bulkAction === 'REJECTED'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              Confirm{' '}
              {bulkAction === 'APPROVED'
                ? 'Approval'
                : bulkAction === 'REJECTED'
                ? 'Rejection'
                : 'Edit Request'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Time Log Details Modal */}
      <TimeLogDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedTimeLog(null);
        }}
        timeLog={selectedTimeLog}
      />
    </div>
  );
}
