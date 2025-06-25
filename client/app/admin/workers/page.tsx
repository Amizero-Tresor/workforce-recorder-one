'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { User, PaginatedResponse } from '@/types';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { 
  Plus, 
  Download,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  UserCheck,
  UserX,
  Mail,
  Shield,
  ShieldCheck
} from 'lucide-react';
import { formatDate, getRoleDisplayName } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function AdminWorkersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [workers, setWorkers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<User | null>(null);
  const [statusAction, setStatusAction] = useState<'ACTIVE' | 'DEACTIVATED'>('ACTIVE');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchWorkers();
  }, [pagination.page, roleFilter]);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(roleFilter && { role: roleFilter })
      });

      const response = await api.get(`/users?${params}`);
      const data: PaginatedResponse<User> = response.data;
      
      setWorkers(data.data);
      setPagination(prev => ({
        ...prev,
        total: data.meta.total,
        totalPages: data.meta.totalPages
      }));
    } catch (error) {
      console.error('Error fetching workers:', error);
      toast.error('Failed to fetch workers');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = (worker: User) => {
    setSelectedWorker(worker);
    setStatusAction(worker.status === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE');
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    if (!selectedWorker) return;

    try {
      await api.patch(`/users/${selectedWorker.id}/status`, { status: statusAction });
      
      toast.success(`User ${statusAction.toLowerCase()}`);
      setShowStatusModal(false);
      setSelectedWorker(null);
      fetchWorkers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      const params = new URLSearchParams({
        format,
        ...(roleFilter && { role: roleFilter })
      });

      const response = await api.get(`/users/export?${params}`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `workers-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.success(`Workers exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export workers');
    }
  };

  const filteredWorkers = workers.filter(worker =>
    worker.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                  <h1 className="text-lg lg:text-xl font-semibold text-gray-900">Workers Management</h1>
                  <p className="text-sm text-gray-600">Manage your team members and their access</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                  <Button
                    onClick={() => router.push('/admin/workers/create')}
                    variant="outline"
                    size="sm"
                    className="flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Worker</span>
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
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search workers by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080] text-sm"
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080] text-sm"
                >
                  <option value="">All Roles</option>
                  <option value="WORKER">Workers</option>
                  <option value="COMPANY_ADMIN">Company Admins</option>
                  {user?.role === 'CORPORATE_ADMIN' && (
                    <option value="CORPORATE_ADMIN">Corporate Admins</option>
                  )}
                </select>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden">
              {filteredWorkers.map((worker) => (
                <div key={worker.id} className="p-4 border-b border-gray-200">
                  <div className="flex items-start space-x-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#008080] to-[#006666] rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {worker.firstName[0]}{worker.lastName[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">
                        {worker.firstName} {worker.lastName}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {worker.email}
                      </div>
                      {worker.phoneNumber && (
                        <div className="text-xs text-gray-400">
                          {worker.phoneNumber}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      worker.role === 'CORPORATE_ADMIN' ? 'bg-purple-100 text-purple-800' :
                      worker.role === 'COMPANY_ADMIN' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {worker.role === 'CORPORATE_ADMIN' && <Shield className="w-3 h-3 mr-1" />}
                      {worker.role === 'COMPANY_ADMIN' && <ShieldCheck className="w-3 h-3 mr-1" />}
                      {getRoleDisplayName(worker.role)}
                    </span>
                    
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      worker.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {worker.status === 'ACTIVE' ? (
                        <>
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                          Active
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                          Deactivated
                        </>
                      )}
                    </span>
                  </div>

                  <div className="text-xs text-gray-500 mb-3">
                    Last login: {worker.lastLoginAt ? formatDate(worker.lastLoginAt) : (
                      <span className="text-yellow-600">Never logged in</span>
                    )}
                  </div>

                  <div className="flex items-center justify-end space-x-2">
                    <button
                      className="text-blue-600 hover:text-blue-900 p-2 rounded-full hover:bg-blue-100"
                      title="Edit User"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleStatusToggle(worker)}
                      className={`p-2 rounded-full ${
                        worker.status === 'ACTIVE'
                          ? 'text-red-600 hover:text-red-900 hover:bg-red-100'
                          : 'text-green-600 hover:text-green-900 hover:bg-green-100'
                      }`}
                      title={worker.status === 'ACTIVE' ? 'Deactivate User' : 'Activate User'}
                    >
                      {worker.status === 'ACTIVE' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    </button>
                    <button
                      className="text-gray-600 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100"
                      title="Send Email"
                    >
                      <Mail className="w-4 h-4" />
                    </button>
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
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredWorkers.map((worker) => (
                    <tr key={worker.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#008080] to-[#006666] rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {worker.firstName[0]}{worker.lastName[0]}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {worker.firstName} {worker.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {worker.email}
                            </div>
                            {worker.phoneNumber && (
                              <div className="text-xs text-gray-400">
                                {worker.phoneNumber}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          worker.role === 'CORPORATE_ADMIN' ? 'bg-purple-100 text-purple-800' :
                          worker.role === 'COMPANY_ADMIN' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {worker.role === 'CORPORATE_ADMIN' && <Shield className="w-3 h-3 mr-1" />}
                          {worker.role === 'COMPANY_ADMIN' && <ShieldCheck className="w-3 h-3 mr-1" />}
                          {getRoleDisplayName(worker.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          worker.status === 'ACTIVE' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {worker.status === 'ACTIVE' ? (
                            <>
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                              Active
                            </>
                          ) : (
                            <>
                              <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                              Deactivated
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {worker.lastLoginAt ? formatDate(worker.lastLoginAt) : (
                          <span className="text-yellow-600">Never logged in</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-100"
                            title="Edit User"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleStatusToggle(worker)}
                            className={`p-1 rounded-full ${
                              worker.status === 'ACTIVE'
                                ? 'text-red-600 hover:text-red-900 hover:bg-red-100'
                                : 'text-green-600 hover:text-green-900 hover:bg-green-100'
                            }`}
                            title={worker.status === 'ACTIVE' ? 'Deactivate User' : 'Activate User'}
                          >
                            {worker.status === 'ACTIVE' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                          <button
                            className="text-gray-600 hover:text-gray-900 p-1 rounded-full hover:bg-gray-100"
                            title="Send Email"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {filteredWorkers.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No workers found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || roleFilter 
                    ? 'No workers match your current filters.'
                    : 'Get started by adding your first worker.'
                  }
                </p>
              </div>
            )}

            {/* Pagination */}
            {filteredWorkers.length > 0 && (
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

      {/* Status Change Confirmation Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setSelectedWorker(null);
        }}
        title={`${statusAction === 'ACTIVE' ? 'Activate' : 'Deactivate'} User`}
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#008080] to-[#006666] rounded-full flex items-center justify-center">
              <span className="text-white font-medium">
                {selectedWorker?.firstName[0]}{selectedWorker?.lastName[0]}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {selectedWorker?.firstName} {selectedWorker?.lastName}
              </h3>
              <p className="text-sm text-gray-500">{selectedWorker?.email}</p>
            </div>
          </div>

          <div className={`p-4 rounded-lg ${
            statusAction === 'ACTIVE' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <p className={`text-sm ${
              statusAction === 'ACTIVE' ? 'text-green-800' : 'text-red-800'
            }`}>
              {statusAction === 'ACTIVE' 
                ? '✅ This user will be able to log in and access the system.'
                : '⚠️ This user will be temporarily blocked from accessing the system. They can be reactivated at any time.'
              }
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
            <Button
              onClick={() => {
                setShowStatusModal(false);
                setSelectedWorker(null);
              }}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmStatusChange}
              className={`w-full sm:w-auto ${statusAction === 'ACTIVE' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {statusAction === 'ACTIVE' ? 'Activate User' : 'Deactivate User'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}