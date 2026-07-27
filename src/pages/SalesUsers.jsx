import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Eye, EyeOff, ChevronDown, Check, X, Loader2, Plus, Search, Edit2, Trash2, Loader, AlertCircle,
  MoreVertical, User, Mail, Phone, CheckCircle, XCircle
} from 'lucide-react'
import {
  getSalesUsers, createSalesUser, updateSalesUser,
  deleteSalesUser, toggleUserStatus, getDistinctBrandsFromProducts
} from '../services/adminApi'
import Pagination from '../components/Pagination'
import { useToast } from '../components/Toast'

// Brand Multi-Select Component
function BrandMultiSelect({ selectedBrands, onChange, disabled }) {
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef(null)

  // Fetch all available brands
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await getDistinctBrandsFromProducts()
        if (response.success && response.data?.brands) {
          setBrands(response.data.brands)
        } else if (response.data) {
          // Handle case where data is directly the array
          setBrands(Array.isArray(response.data) ? response.data : [])
        }
      } catch (err) {
        console.error('Failed to fetch brands:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchBrands()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleBrand = (brand) => {
    if (selectedBrands.includes(brand)) {
      onChange(selectedBrands.filter(b => b !== brand))
    } else {
      onChange([...selectedBrands, brand])
    }
  }

  const filteredBrands = brands.filter(brand =>
    brand.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`input-field min-h-[42px] cursor-pointer flex flex-wrap gap-1 items-center ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {selectedBrands.length === 0 ? (
          <span className="text-gray-400">Select brands...</span>
        ) : (
          selectedBrands.slice(0, 3).map(brand => (
            <span
              key={brand}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs"
            >
              {brand}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleBrand(brand)
                }}
                className="hover:text-blue-600"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        )}
        {selectedBrands.length > 3 && (
          <span className="text-xs text-gray-500">+{selectedBrands.length - 3} more</span>
        )}
        <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          <div className="sticky top-0 bg-white p-2 border-b border-gray-100">
            <input
              type="text"
              placeholder="Search brands..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          {loading ? (
            <div className="p-3 text-center text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
            </div>
          ) : filteredBrands.length === 0 ? (
            <div className="p-3 text-center text-gray-400 text-sm">No brands found</div>
          ) : (
            <div className="p-1">
              {filteredBrands.map(brand => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => toggleBrand(brand)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                    selectedBrands.includes(brand)
                      ? 'bg-blue-50 text-blue-700'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                      selectedBrands.includes(brand)
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedBrands.includes(brand) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    {brand}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Modal Component
function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl w-full max-w-md shadow-xl animate-fadeIn mx-4 my-8 max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="font-semibold text-lg text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}

// User Form Component
function UserForm({ user, onSubmit, onCancel, loading }) {
  const toast = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    phone: user?.phone || '',
    role: user?.role || 'user',
    assignedBrands: user?.assignedBrands || [],
    isActive: user?.isActive ?? true,
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleRoleChange = (e) => {
    const { value } = e.target
    setFormData((prev) => ({
      ...prev,
      role: value,
      // Clear assigned brands if role is not product_manager (only product_manager needs brands)
      assignedBrands: value !== 'product_manager' ? [] : prev.assignedBrands,
    }))
  }

  const handleBrandsChange = (brands) => {
    setFormData((prev) => ({
      ...prev,
      assignedBrands: brands,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Name validation
    if (!formData.name.trim()) {
      toast.error('Name is required')
      return
    }
    if (!/^[a-zA-Z\s]+$/.test(formData.name.trim())) {
      toast.error('Name should contain only letters and spaces')
      return
    }

    // Email validation
    if (!formData.email.trim()) {
      toast.error('Email is required')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      toast.error('Please enter a valid email address')
      return
    }

    // Password validation (required for new users)
    if (!user) {
      if (!formData.password) {
        toast.error('Password is required')
        return
      }
      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters')
        return
      }
    } else if (formData.password && formData.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    // Phone validation (optional but must be valid if provided)
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      toast.error('Phone must be 10 digits')
      return
    }

    // Assigned brands validation for product_manager only
    if (formData.role === 'product_manager' && formData.assignedBrands.length === 0) {
      toast.error('Please assign at least one brand for this role')
      return
    }

    const data = { ...formData }
    if (!data.password) delete data.password
    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={(e) => {
            const value = e.target.value
            // Allow only letters + space
            if (/^[a-zA-Z\s]*$/.test(value)) {
              handleChange(e)
            }
          }}
          required
          className="input-field"
          placeholder="Enter full name"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="input-field"
          placeholder="Enter email address"
        />
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password {user ? '(leave blank to keep current)' : '*'}
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleChange}
            required={!user}
            className="input-field pr-10"
            placeholder="Enter password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={(e) => {
            const value = e.target.value
            // Allow only numbers
            if (/^\d*$/.test(value)) {
              handleChange(e)
            }
          }}
          className="input-field"
          placeholder="Enter phone number"
          maxLength={10}
        />
      </div>

      {/* Role */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
        <select
          name="role"
          value={formData.role}
          onChange={handleRoleChange}
          className="input-field"
        >
          <option value="user">Sales User</option>
          <option value="product_manager">Product Manager</option>
          <option value="account_manager">Account Manager</option>
          <option value="admin">Admin</option>
        </select>
        {formData.role === 'product_manager' && (
          <p className="text-xs text-gray-500 mt-1">
            Users with this role can only see products from their assigned brands.
          </p>
        )}
      </div>

      {/* Assigned Brands - Show for product_manager only */}
      {formData.role === 'product_manager' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assigned Brands *
          </label>
          <BrandMultiSelect
            selectedBrands={formData.assignedBrands}
            onChange={handleBrandsChange}
            disabled={loading}
          />
          {formData.assignedBrands.length === 0 && (
            <p className="text-xs text-amber-600 mt-1">
              Please select at least one brand for this role.
            </p>
          )}
        </div>
      )}

      {/* Active Status */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="isActive"
          id="isActive"
          checked={formData.isActive}
          onChange={handleChange}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="isActive" className="text-sm text-gray-700">
          Active Account
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 pb-2">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary flex-1"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary flex-1 flex items-center justify-center gap-2"
          disabled={loading}
        >
          {loading && <Loader className="w-4 h-4 animate-spin" />}
          {user ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  )
}

// Delete Confirmation Modal
function DeleteModal({ user, onConfirm, onCancel, loading }) {
  return (
    <div className="p-6 text-center">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-6 h-6 text-red-600" />
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">Delete User</h3>
      <p className="text-gray-500 mb-6">
        Are you sure you want to delete <strong>{user?.name}</strong>? This action cannot be undone.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="btn-secondary flex-1"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="btn-danger flex-1 flex items-center justify-center gap-2"
          disabled={loading}
        >
          {loading && <Loader className="w-4 h-4 animate-spin" />}
          Delete
        </button>
      </div>
    </div>
  )
}

export default function SalesUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const toast = useToast()

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    limit: 10,
  })

  // Fetch users
  const fetchUsers = async (page = currentPage, limit = pagination.limit) => {
    setLoading(true)
    setError(null)
    try {
      const response = await getSalesUsers({ page, limit })
      if (response.success !== false) {
        // Handle both paginated and non-paginated responses
        if (response.pagination) {
          setUsers(response.data || [])
          setPagination({
            total: response.pagination.totalItems || response.pagination.total || 0,
            totalPages: response.pagination.totalPages || 1,
            limit: response.pagination.itemsPerPage || response.pagination.limit || 10,
          })
        } else {
          // Fallback for non-paginated API response
          setUsers(response.data || [])
          setPagination({
            total: (response.data || []).length,
            totalPages: 1,
            limit: 9999,
          })
        }
      } else {
        setError(response.message || 'Failed to fetch users')
      }
    } catch (err) {
      setError('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers(1)
  }, [])

  const handlePageChange = (page) => {
    setCurrentPage(page)
    fetchUsers(page)
  }

  // Filter users by search query (client-side)
  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.phone?.toLowerCase().includes(query)
    )
  })

  // Handle create user
  const handleCreate = async (data) => {
    setFormLoading(true)
    try {
      const response = await createSalesUser(data)
      if (response.success) {
        toast.success('User created successfully')
        fetchUsers(currentPage)
        setShowModal(false)
        setSelectedUser(null)
      } else {
        toast.error(response.message || 'Failed to create user')
      }
    } catch (err) {
      toast.error('Failed to create user')
    } finally {
      setFormLoading(false)
    }
  }

  // Handle update user
  const handleUpdate = async (data) => {
    setFormLoading(true)
    try {
      const response = await updateSalesUser(selectedUser._id, data)
      if (response.success) {
        toast.success('User updated successfully')
        setUsers((prev) =>
          prev.map((u) => (u._id === selectedUser._id ? response.data : u))
        )
        setShowModal(false)
        setSelectedUser(null)
      } else {
        toast.error(response.message || 'Failed to update user')
      }
    } catch (err) {
      toast.error('Failed to update user')
    } finally {
      setFormLoading(false)
    }
  }

  // Handle delete user
  const handleDelete = async () => {
    setFormLoading(true)
    try {
      const response = await deleteSalesUser(selectedUser._id)
      if (response.success) {
        toast.success('User deleted successfully')
        if (users.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1)
          fetchUsers(currentPage - 1)
        } else {
          fetchUsers(currentPage)
        }
        setShowDeleteModal(false)
        setSelectedUser(null)
      } else {
        toast.error(response.message || 'Failed to delete user')
      }
    } catch (err) {
      toast.error('Failed to delete user')
    } finally {
      setFormLoading(false)
    }
  }

  // Handle toggle status
  const handleToggleStatus = async (user) => {
    try {
      const response = await toggleUserStatus(user._id)
      if (response.success) {
        toast.success('User status updated successfully')
        setUsers((prev) =>
          prev.map((u) =>
            u._id === user._id ? { ...u, isActive: !u.isActive } : u
          )
        )
      }
    } catch (err) {
      toast.error('Failed to toggle user status')
    }
  }

  // Open edit modal
  const openEditModal = (user) => {
    setSelectedUser(user)
    setShowModal(true)
  }

  // Open delete modal
  const openDeleteModal = (user) => {
    setSelectedUser(user)
    setShowDeleteModal(true)
  }

  // Only show full error state if we have no users at all
  if (error && users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-gray-600 mb-4">{error}</p>
        <button onClick={() => fetchUsers(1)} className="btn-primary">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Users</h1>
          <p className="text-gray-500 mt-1">Manage your sales team accounts</p>
        </div>
        <button
          onClick={() => {
            setSelectedUser(null)
            setShowModal(true)
          }}
          className="btn-primary flex items-center gap-2 whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          Add User
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">User</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 hidden md:table-cell">Email</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 hidden lg:table-cell">Phone</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Role</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 hidden sm:table-cell">Created</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No users found</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#1F3A5F] rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-medium">
                            {user.name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{user.name}</p>
                          <p className="text-sm text-gray-500 truncate md:hidden">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 hidden md:table-cell">{user.email}</td>
                    <td className="px-6 py-4 text-gray-600 hidden lg:table-cell">{user.phone || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium inline-block w-fit ${
                            user.role === 'admin'
                              ? 'bg-purple-100 text-purple-700'
                              : user.role === 'product_manager'
                              ? 'bg-emerald-100 text-emerald-700'
                              : user.role === 'account_manager'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {user.role === 'admin'
                            ? 'Admin'
                            : user.role === 'product_manager'
                            ? 'Product Mgr'
                            : user.role === 'account_manager'
                            ? 'Account Mgr'
                            : 'Sales'}
                        </span>
                        {user.role === 'product_manager' && (
                          <span className="text-xs text-gray-500">
                            {user.assignedBrands?.length || 0} brand{(user.assignedBrands?.length || 0) !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                          user.isActive
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {user.isActive ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm hidden sm:table-cell">
                      {new Date(user.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(user)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          onPageChange={handlePageChange}
        />
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setSelectedUser(null)
        }}
        title={selectedUser ? 'Edit User' : 'Add New User'}
      >
        <UserForm
          user={selectedUser}
          onSubmit={selectedUser ? handleUpdate : handleCreate}
          onCancel={() => {
            setShowModal(false)
            setSelectedUser(null)
          }}
          loading={formLoading}
        />
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setSelectedUser(null)
        }}
        title="Delete User"
      >
        <DeleteModal
          user={selectedUser}
          onConfirm={handleDelete}
          onCancel={() => {
            setShowDeleteModal(false)
            setSelectedUser(null)
          }}
          loading={formLoading}
        />
      </Modal>
    </div>
  )
}