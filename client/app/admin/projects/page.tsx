'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Project, PaginatedResponse, User } from '@/types';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ProjectDetailsModal } from '@/components/ui/ProjectDetailsModal';
import {
  Plus,
  Download,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Users,
  Eye,
  Settings,
  UserPlus,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function AdminProjectsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showWorkersModal, setShowWorkersModal] = useState(false);
  const [showProjectDetailsModal, setShowProjectDetailsModal] = useState(false);
  const [showAssignStaffModal, setShowAssignStaffModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectWorkers, setProjectWorkers] = useState<User[]>([]);
  const [availableWorkers, setAvailableWorkers] = useState<User[]>([]);
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
  const [workersLoading, setWorkersLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  });
  const [editLoading, setEditLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchProjects();
  }, [pagination.page, statusFilter]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      const response = await api.get(`/projects?${params}`);
      const data: PaginatedResponse<Project> = response.data;

      setProjects(data.data);
      setPagination((prev) => ({
        ...prev,
        total: data.meta.total,
        totalPages: data.meta.totalPages,
      }));
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectWorkers = async (projectId: string) => {
    try {
      setWorkersLoading(true);
      const response = await api.get(`/projects/${projectId}`);
      const projectData = response.data;

      // Extract workers from workerProjects relationship
      const workers =
        projectData.workerProjects?.map((wp: any) => wp.worker) || [];
      setProjectWorkers(workers);
    } catch (error) {
      console.error('Error fetching project workers:', error);
      toast.error('Failed to fetch project workers');
    } finally {
      setWorkersLoading(false);
    }
  };

  const fetchAvailableWorkers = async () => {
    try {
      setWorkersLoading(true);
      // Try different approaches to fetch workers
      let response;
      
      try {
        // First try with role parameter
        response = await api.get('/users?role=WORKER&limit=100');
      } catch (error) {
        console.log('Role parameter failed, trying without role filter');
        // If that fails, try without role parameter and filter client-side
        response = await api.get('/users?limit=100');
      }
      
      const allUsers = response.data.data || [];
      
      // Filter for workers only (in case backend doesn't support role filtering)
      const workers = allUsers.filter((worker: User) => worker.role === 'WORKER');
      
      setAvailableWorkers(workers);
    } catch (error) {
      console.error('Error fetching available workers:', error);
      toast.error('Failed to fetch available workers');
      setAvailableWorkers([]); // Set empty array as fallback
    } finally {
      setWorkersLoading(false);
    }
  };

  const handleViewWorkers = async (project: Project) => {
    setSelectedProject(project);
    setShowWorkersModal(true);
    await fetchProjectWorkers(project.id);
  };

  const handleViewProjectDetails = (project: Project) => {
    setSelectedProject(project);
    setShowProjectDetailsModal(true);
  };

  const handleAssignStaff = async (project: Project) => {
    setSelectedProject(project);
    setShowAssignStaffModal(true);
    
    // Fetch available workers and current project workers in parallel
    await Promise.all([
      fetchAvailableWorkers(),
      fetchProjectWorkers(project.id)
    ]);
    
    // Get current worker IDs after fetching project workers
    try {
      const response = await api.get(`/projects/${project.id}`);
      const currentWorkerIds = response.data.workerProjects?.map((wp: any) => wp.worker.id) || [];
      setSelectedWorkerIds(currentWorkerIds);
    } catch (error) {
      console.error('Error fetching current assignments:', error);
      setSelectedWorkerIds([]);
    }
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setEditFormData({
      name: project.name,
      description: project.description || '',
      isActive: project.isActive,
    });
    setShowEditProjectModal(true);
  };

  const handleSaveAssignments = async () => {
    if (!selectedProject) return;

    try {
      setAssignLoading(true);
      await api.post(`/projects/${selectedProject.id}/assign-workers`, {
        workerIds: selectedWorkerIds,
      });
      
      toast.success('Staff assigned successfully!');
      setShowAssignStaffModal(false);
      setSelectedProject(null);
      setSelectedWorkerIds([]);
      fetchProjects(); // Refresh the projects list
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to assign staff');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedProject) return;

    try {
      setEditLoading(true);
      await api.put(`/projects/${selectedProject.id}`, editFormData);
      
      toast.success('Project updated successfully!');
      setShowEditProjectModal(false);
      setSelectedProject(null);
      fetchProjects(); // Refresh the projects list
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update project');
    } finally {
      setEditLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      const params = new URLSearchParams({ format });

      const response = await api.get(`/projects/export?${params}`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `projects-${new Date().toISOString().split('T')[0]}.${
        format === 'excel' ? 'xlsx' : 'csv'
      }`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.success(`Projects exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export projects');
    }
  };

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.description &&
        project.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
                    Projects Management
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Manage projects and assign workers
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                  <Button
                    onClick={() => router.push('/admin/projects/create')}
                    variant="outline"
                    size="sm"
                    className="flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Project</span>
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
            <div className="px-4 lg:px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#171717]/50">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080] text-sm bg-white dark:bg-[#171717] text-gray-900 dark:text-white"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080] text-sm bg-white dark:bg-[#171717] text-gray-900 dark:text-white"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="p-4 border-b border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {project.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {project.description || 'No description'}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ml-2 ${
                        project.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }`}
                    >
                      {project.isActive ? '✅ Active' : '❌ Inactive'}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">
                        Staff:
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-900 dark:text-white">
                          {project._count?.workerProjects || 0}
                        </span>
                        <button
                          onClick={() => handleViewWorkers(project)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/20"
                          title="View Staff"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">
                        Time Logs:
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        {project._count?.timeLogs || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">
                        Created:
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        {formatDate(project.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2 mt-3">
                    <button
                      onClick={() => handleViewProjectDetails(project)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/20"
                      title="View Project Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleAssignStaff(project)}
                      className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 p-2 rounded-full hover:bg-green-100 dark:hover:bg-green-900/20"
                      title="Assign Staff"
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEditProject(project)}
                      className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                      title="Edit Project"
                    >
                      <Edit className="w-4 h-4" />
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Staff
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Time Logs
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-[#171717] divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredProjects.map((project) => (
                    <tr
                      key={project.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {project.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                            {project.description || 'No description'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-900 dark:text-white">
                            {project._count?.workerProjects || 0}
                          </span>
                          <button
                            onClick={() => handleViewWorkers(project)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/20"
                            title="View Staff"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {project._count?.timeLogs || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            project.isActive
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                          }`}
                        >
                          {project.isActive ? '✅ Active' : '❌ Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(project.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewProjectDetails(project)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/20"
                            title="View Project Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleAssignStaff(project)}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 p-1 rounded-full hover:bg-green-100 dark:hover:bg-green-900/20"
                            title="Assign Staff"
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditProject(project)}
                            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                            title="Edit Project"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {filteredProjects.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Settings className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  No projects found
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {searchTerm || statusFilter
                    ? 'No projects match your current filters.'
                    : 'Get started by creating your first project.'}
                </p>
              </div>
            )}

            {/* Pagination */}
            {filteredProjects.length > 0 && (
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

      {/* Project Staff Modal */}
      <Modal
        isOpen={showWorkersModal}
        onClose={() => {
          setShowWorkersModal(false);
          setSelectedProject(null);
          setProjectWorkers([]);
        }}
        title={`Staff - ${selectedProject?.name}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {selectedProject?.description ||
                'No project description available'}
            </p>
            <Button
              onClick={() => {
                setShowWorkersModal(false);
                handleAssignStaff(selectedProject!);
              }}
              size="sm"
              className="flex items-center space-x-2 bg-[#008080] hover:bg-[#006666]"
            >
              <UserPlus className="w-4 h-4" />
              <span>Assign Staff</span>
            </Button>
          </div>

          {workersLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#008080]"></div>
            </div>
          ) : projectWorkers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No workers assigned
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                This project doesn't have any workers assigned yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {projectWorkers.map((worker) => (
                <div
                  key={worker.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#008080] to-[#006666] rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-xs">
                        {worker.firstName[0]}
                        {worker.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {worker.firstName} {worker.lastName}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {worker.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        worker.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }`}
                    >
                      {worker.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Assign Staff Modal */}
      <Modal
        isOpen={showAssignStaffModal}
        onClose={() => {
          setShowAssignStaffModal(false);
          setSelectedProject(null);
          setSelectedWorkerIds([]);
        }}
        title={`Assign Staff - ${selectedProject?.name}`}
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Select staff members to assign to this project. Currently assigned staff are pre-selected.
          </p>

          {workersLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#008080]"></div>
              <p className="ml-3 text-sm text-gray-600 dark:text-gray-300">Loading staff...</p>
            </div>
          ) : availableWorkers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No staff available
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                No staff members found to assign to this project.
              </p>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg">
              {availableWorkers.map((worker) => (
                <div
                  key={worker.id}
                  className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <input
                    type="checkbox"
                    checked={selectedWorkerIds.includes(worker.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedWorkerIds([...selectedWorkerIds, worker.id]);
                      } else {
                        setSelectedWorkerIds(selectedWorkerIds.filter(id => id !== worker.id));
                      }
                    }}
                    className="rounded border-gray-300 dark:border-gray-600 text-[#008080] focus:ring-[#008080]"
                  />
                  <div className="w-8 h-8 bg-gradient-to-br from-[#008080] to-[#006666] rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-xs">
                      {worker.firstName[0]}
                      {worker.lastName[0]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {worker.firstName} {worker.lastName}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {worker.email}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      worker.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                    }`}
                  >
                    {worker.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button
              onClick={() => {
                setShowAssignStaffModal(false);
                setSelectedProject(null);
                setSelectedWorkerIds([]);
              }}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAssignments}
              loading={assignLoading}
              disabled={workersLoading || availableWorkers.length === 0}
              className="bg-[#008080] hover:bg-[#006666]"
            >
              Save Assignments
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Project Modal */}
      <Modal
        isOpen={showEditProjectModal}
        onClose={() => {
          setShowEditProjectModal(false);
          setSelectedProject(null);
        }}
        title={`Edit Project - ${selectedProject?.name}`}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Project Name *
            </label>
            <input
              type="text"
              value={editFormData.name}
              onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080] bg-white dark:bg-[#171717] text-gray-900 dark:text-white"
              placeholder="Enter project name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={editFormData.description}
              onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080] bg-white dark:bg-[#171717] text-gray-900 dark:text-white"
              rows={4}
              placeholder="Project description..."
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="editIsActive"
              checked={editFormData.isActive}
              onChange={(e) => setEditFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="rounded border-gray-300 dark:border-gray-600 text-[#008080] focus:ring-[#008080]"
            />
            <label htmlFor="editIsActive" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Project is active
            </label>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              onClick={() => {
                setShowEditProjectModal(false);
                setSelectedProject(null);
              }}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              loading={editLoading}
              className="bg-[#008080] hover:bg-[#006666]"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Project Details Modal */}
      <ProjectDetailsModal
        isOpen={showProjectDetailsModal}
        onClose={() => {
          setShowProjectDetailsModal(false);
          setSelectedProject(null);
        }}
        project={selectedProject}
      />
    </div>
  );
}