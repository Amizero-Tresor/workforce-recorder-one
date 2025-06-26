'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { TimeLog, PaginatedResponse } from '@/types';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TimeLogDetailsModal } from '@/components/ui/TimeLogDetailsModal';
import { 
  Clock, 
  Calendar, 
  CheckCircle, 
  AlertCircle,
  XCircle,
  Edit3,
  Eye,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { formatDate, formatTime, formatDuration, getStatusColor } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function WorkerTimeLogPage() {
  const { user } = useAuth();
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLog, setEditingLog] = useState<TimeLog | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTimeLog, setSelectedTimeLog] = useState<TimeLog | null>(null);
  const [editFormData, setEditFormData] = useState({
    startTime: '',
    endTime: '',
    description: '',
    date: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchTimeLogs();
  }, [pagination.page, filters]);

  const fetchTimeLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      });

      const response = await api.get(`/time-logs?${params}`);
      const data: PaginatedResponse<TimeLog> = response.data;
      
      setTimeLogs(data.data);
      setPagination(prev => ({
        ...prev,
        total: data.meta.total,
        totalPages: data.meta.totalPages
      }));
    } catch (error) {
      console.error('Error fetching time logs:', error);
      toast.error('Failed to fetch time logs');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (timeLog: TimeLog) => {
    setSelectedTimeLog(timeLog);
    setShowDetailsModal(true);
  };

  const handleEditLog = (log: TimeLog) => {
    if (log.status !== 'REJECTED' && log.status !== 'EDIT_REQUESTED') {
      toast.error('You can only edit rejected or edit-requested time logs');
      return;
    }

    const startDate = new Date(log.startTime);
    const endDate = log.endTime ? new Date(log.endTime) : null;

    setEditingLog(log);
    setEditFormData({
      date: startDate.toISOString().split('T')[0],
      startTime: startDate.toTimeString().slice(0, 5),
      endTime: endDate ? endDate.toTimeString().slice(0, 5) : '',
      description: log.description || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLog) return;

    try {
      const startDateTime = new Date(`${editFormData.date}T${editFormData.startTime}`);
      const endDateTime = editFormData.endTime 
        ? new Date(`${editFormData.date}T${editFormData.endTime}`)
        : null;

      if (endDateTime && endDateTime <= startDateTime) {
        toast.error('End time must be after start time');
        return;
      }

      await api.put(`/time-logs/${editingLog.id}`, {
        startTime: startDateTime.toISOString(),
        endTime: endDateTime?.toISOString(),
        description: editFormData.description,
      });

      toast.success('Time log updated successfully!');
      setShowEditModal(false);
      setEditingLog(null);
      fetchTimeLogs();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update time log');
    }
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      const params = new URLSearchParams({
        format,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      });

      const response = await api.get(`/time-logs/export?${params}`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `my-time-logs-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.success(`Time logs exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export time logs');
    }
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
          <div className="bg-white rounded-lg shadow-sm">
            {/* Header */}
            <div className="px-4 lg:px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div>
                  <h1 className="text-lg lg:text-xl font-semibold text-gray-900">My Time Logs</h1>
                  <p className="text-sm text-gray-600">Track and manage your work time</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                  <Button
                    onClick={fetchTimeLogs}
                    variant="outline"
                    size="sm"
                    className="flex items-center justify-center space-x-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Refresh</span>
                  </Button>
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
            <div className="px-4 lg:px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080] text-sm"
                >
                  <option value="">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="EDIT_REQUESTED">Edit Requested</option>
                </select>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080] text-sm"
                  placeholder="Start Date"
                />
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080] text-sm"
                  placeholder="End Date"
                />
                <Button
                  onClick={() => {
                    setFilters({ status: '', startDate: '', endDate: '' });
                    fetchTimeLogs();
                  }}
                  variant="outline"
                  size="sm"
                >
                  Clear Filters
                </Button>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden">
              {timeLogs.map((log) => (
                <div key={log.id} className="p-4 border-b border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {log.project?.name}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(log.startTime)}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                      {log.status === 'PENDING' && (
                        <>
                          <Clock className="w-3 h-3 mr-1" />
                          Pending Review
                        </>
                      )}
                      {log.status === 'APPROVED' && (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Approved
                        </>
                      )}
                      {log.status === 'REJECTED' && (
                        <>
                          <XCircle className="w-3 h-3 mr-1" />
                          Rejected
                        </>
                      )}
                      {log.status === 'EDIT_REQUESTED' && (
                        <>
                          <Edit3 className="w-3 h-3 mr-1" />
                          Edit Requested
                        </>
                      )}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Time Period:</span>
                      <span>{formatTime(log.startTime)} - {log.endTime ? formatTime(log.endTime) : 'Ongoing'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Duration:</span>
                      <span className="font-medium">{formatDuration(log.totalHours || 0)}</span>
                    </div>
                    {log.description && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Description:</span>
                        <span className="text-right max-w-32 truncate">{log.description}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end space-x-2 mt-3">
                    <button
                      onClick={() => handleViewDetails(log)}
                      className="text-blue-600 hover:text-blue-900 p-2 rounded-full hover:bg-blue-100"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {(log.status === 'REJECTED' || log.status === 'EDIT_REQUESTED') && (
                      <button
                        onClick={() => handleEditLog(log)}
                        className="text-orange-600 hover:text-orange-900 p-2 rounded-full hover:bg-orange-100"
                        title="Edit Entry"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {timeLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(log.startTime)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {log.project?.name}
                        </div>
                        {log.description && (
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {log.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatTime(log.startTime)} - {log.endTime ? formatTime(log.endTime) : 'Ongoing'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatDuration(log.totalHours || 0)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                          {log.status === 'PENDING' && (
                            <>
                              <Clock className="w-3 h-3 mr-1" />
                              Pending Review
                            </>
                          )}
                          {log.status === 'APPROVED' && (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Approved
                            </>
                          )}
                          {log.status === 'REJECTED' && (
                            <>
                              <XCircle className="w-3 h-3 mr-1" />
                              Rejected
                            </>
                          )}
                          {log.status === 'EDIT_REQUESTED' && (
                            <>
                              <Edit3 className="w-3 h-3 mr-1" />
                              Edit Requested
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewDetails(log)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-100"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {(log.status === 'REJECTED' || log.status === 'EDIT_REQUESTED') && (
                            <button
                              onClick={() => handleEditLog(log)}
                              className="text-orange-600 hover:text-orange-900 p-1 rounded-full hover:bg-orange-100"
                              title="Edit Entry"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
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
                <Clock className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No time logs found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {Object.values(filters).some(v => v) 
                    ? 'No time logs match your current filters.'
                    : 'Start tracking your time to see logs here.'
                  }
                </p>
              </div>
            )}

            {/* Pagination */}
            {timeLogs.length > 0 && (
              <div className="px-4 lg:px-6 py-3 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div className="text-sm text-gray-700 text-center sm:text-left">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <Button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                      variant="outline"
                      size="sm"
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-700">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <Button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
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

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingLog(null);
        }}
        title="Edit Time Log"
      >
        <form onSubmit={handleUpdateLog} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={editFormData.date}
              onChange={(e) => setEditFormData(prev => ({ ...prev, date: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080]"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time
              </label>
              <input
                type="time"
                value={editFormData.startTime}
                onChange={(e) => setEditFormData(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080]"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time
              </label>
              <input
                type="time"
                value={editFormData.endTime}
                onChange={(e) => setEditFormData(prev => ({ ...prev, endTime: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={editFormData.description}
              onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what you worked on..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080]"
              rows={3}
            />
          </div>

          {editingLog?.feedback && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-yellow-800 mb-1">Feedback from Admin:</h4>
              <p className="text-sm text-yellow-700">{editingLog.feedback}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                setEditingLog(null);
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="w-full sm:w-auto bg-[#008080] hover:bg-[#006666]"
            >
              Update Time Log
            </Button>
          </div>
        </form>
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