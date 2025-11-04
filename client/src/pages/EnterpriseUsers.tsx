import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Users, Search, Filter, User, Mail, Calendar, Shield, CheckCircle, XCircle, Trash2, UserCog, Ban, CheckCheck, Download, AlertTriangle } from 'lucide-react'
import api from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

interface User {
  id: string
  email: string
  username: string
  firstName: string | null
  lastName: string | null
  role: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function EnterpriseUsers() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'USER'>('ALL')
  const [showInactive, setShowInactive] = useState(true) // Show all users by default
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [userToChangeRole, setUserToChangeRole] = useState<User | null>(null)
  const [newRole, setNewRole] = useState<'ADMIN' | 'USER'>('USER')

  // Protect this page - only admins can access
  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      navigate('/', { replace: true })
    }
  }, [user, navigate])

  const { data, isLoading, error } = useQuery({
    queryKey: ['all-users', showInactive],
    queryFn: async () => {
      const response = await api.get(`/users/all?hideInactive=${!showInactive}`)
      return response.data.data as User[]
    },
    enabled: !!user && user.role === 'ADMIN' // Only fetch if user is admin
  })

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/users/${userId}`)
    },
    onSuccess: () => {
      toast.success('User deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['all-users'] })
      setUserToDelete(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete user')
    }
  })

  const handleDeleteUser = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete.id)
    }
  }

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.patch(`/users/${userId}/toggle-active`)
    },
    onSuccess: () => {
      toast.success('User status updated successfully')
      queryClient.invalidateQueries({ queryKey: ['all-users'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update user status')
    }
  })

  // Change role mutation
  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      await api.patch(`/users/${userId}/change-role`, { role })
    },
    onSuccess: () => {
      toast.success('User role updated successfully')
      queryClient.invalidateQueries({ queryKey: ['all-users'] })
      setUserToChangeRole(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update user role')
    }
  })

  // Bulk activate users mutation
  const bulkActivateMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      await api.post('/users/bulk-activate', { userIds })
    },
    onSuccess: (_, userIds) => {
      toast.success(`Activated ${userIds.length} user(s) successfully`)
      queryClient.invalidateQueries({ queryKey: ['all-users'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to activate users')
    }
  })

  const handleBulkActivate = () => {
    const inactiveUsers = data?.filter(u => !u.isActive) || []
    if (inactiveUsers.length === 0) {
      toast.error('No inactive users to activate')
      return
    }
    const userIds = inactiveUsers.map(u => u.id)
    bulkActivateMutation.mutate(userIds)
  }

  const handleChangeRole = () => {
    if (userToChangeRole) {
      changeRoleMutation.mutate({
        userId: userToChangeRole.id,
        role: newRole
      })
    }
  }

  // Export users to CSV
  const exportToCSV = () => {
    if (!data || data.length === 0) {
      toast.error('No users to export')
      return
    }

    // CSV headers
    const headers = ['Username', 'Email', 'First Name', 'Last Name', 'Role', 'Status', 'Joined Date']
    
    // CSV rows
    const rows = data.map((u: any) => [
      u.username,
      u.email,
      u.firstName || '',
      u.lastName || '',
      u.role,
      u.isActive ? 'Active' : 'Inactive',
      new Date(u.createdAt).toLocaleDateString()
    ])

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success(`Exported ${data.length} users to CSV`)
  }

  // Don't render anything if not admin
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Access Denied</p>
        </div>
      </div>
    )
  }

  const filteredUsers = data?.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter

    return matchesSearch && matchesRole
  })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-teal-600" />
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  User Management
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {data?.filter(u => u.isActive).length || 0} active users
                  {data && data.some(u => !u.isActive) && (
                    <span className="ml-2 text-orange-600 dark:text-orange-400">
                      ({data.filter(u => !u.isActive).length} inactive)
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {data && data.some(u => !u.isActive) && (
                <button
                  onClick={handleBulkActivate}
                  disabled={bulkActivateMutation.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCheck className="h-4 w-4" />
                  {bulkActivateMutation.isPending ? 'Activating...' : `Activate All (${data.filter(u => !u.isActive).length})`}
                </button>
              )}
              <button
                onClick={exportToCSV}
                disabled={!data || data.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
              <Link
                to="/dashboard"
                className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Filter Bar */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, username, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-slate-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="ALL">All Roles</option>
                <option value="ADMIN">Admins</option>
                <option value="USER">Users</option>
              </select>
            </div>

            {/* Show Inactive Toggle */}
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Show Inactive
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
            <p className="text-red-800 dark:text-red-200">Failed to load users. Please try again.</p>
          </div>
        )}

        {/* Warning for inactive users */}
        {!isLoading && !error && data && !showInactive && data.some(u => !u.isActive) && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <p className="text-orange-800 dark:text-orange-200">
                  There are <strong>{data.filter(u => !u.isActive).length} inactive user(s)</strong> not shown.
                </p>
              </div>
              <button
                onClick={() => setShowInactive(true)}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Show Inactive Users
              </button>
            </div>
          </div>
        )}

        {/* Users Table */}
        {!isLoading && !error && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredUsers?.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center">
                            <span className="text-teal-700 dark:text-teal-300 font-semibold">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 dark:text-slate-100">
                              {user.firstName && user.lastName 
                                ? `${user.firstName} ${user.lastName}`
                                : user.username
                              }
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                              @{user.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <Mail className="h-4 w-4" />
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'ADMIN' 
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        }`}>
                          <Shield className="h-3 w-3" />
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            <CheckCircle className="h-3 w-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            <XCircle className="h-3 w-3" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <Calendar className="h-4 w-4" />
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleActiveMutation.mutate(user.id)}
                            disabled={toggleActiveMutation.isPending}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium ${
                              user.isActive
                                ? 'text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30'
                                : 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30'
                            }`}
                            title={user.isActive ? 'Deactivate user' : 'Activate user'}
                          >
                            {user.isActive ? <Ban className="h-4 w-4" /> : <CheckCheck className="h-4 w-4" />}
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => {
                              setUserToChangeRole(user)
                              setNewRole(user.role === 'ADMIN' ? 'USER' : 'ADMIN')
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors text-sm font-medium"
                            title="Change role"
                          >
                            <UserCog className="h-4 w-4" />
                            Role
                          </button>
                          <button
                            onClick={() => setUserToDelete(user)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors text-sm font-medium"
                            title="Delete user"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {filteredUsers?.length === 0 && (
              <div className="text-center py-12">
                <User className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400 mb-2">No users found</p>
                <p className="text-sm text-slate-500 dark:text-slate-500">
                  Try adjusting your search or filters
                </p>
              </div>
            )}
          </div>
        )}

        {/* Summary Stats */}
        {!isLoading && !error && data && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Users</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{data.length}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Admins</div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {data.filter(u => u.role === 'ADMIN').length}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Active Users</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {data.filter(u => u.isActive).length}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Change Role Modal */}
      {userToChangeRole && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                <UserCog className="h-6 w-6 text-purple-600 dark:text-purple-300" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Change User Role
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Update user permissions
                </p>
              </div>
            </div>
            
            <p className="text-slate-700 dark:text-slate-300 mb-4">
              Change role for <strong>{userToChangeRole.username}</strong> ({userToChangeRole.email})?
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Select New Role
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as 'ADMIN' | 'USER')}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setUserToChangeRole(null)}
                className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors font-medium"
                disabled={changeRoleMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleChangeRole}
                disabled={changeRoleMutation.isPending}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {changeRoleMutation.isPending ? 'Updating...' : 'Change Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
                <Trash2 className="h-6 w-6 text-red-600 dark:text-red-300" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Delete User
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  This action cannot be undone
                </p>
              </div>
            </div>
            
            <p className="text-slate-700 dark:text-slate-300 mb-6">
              Are you sure you want to delete <strong>{userToDelete.username}</strong> ({userToDelete.email})?
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors font-medium"
                disabled={deleteUserMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={deleteUserMutation.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteUserMutation.isPending ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

