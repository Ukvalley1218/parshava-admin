import { useState, useEffect } from 'react'
import {
  Plus, Search, Edit2, Trash2, X, Loader, AlertCircle,
  UserCircle, Mail, Phone, MapPin, Building
} from 'lucide-react'
import { getAdminCustomers, createAdminCustomer, updateAdminCustomer, deleteAdminCustomer } from '../services/adminApi'
import Pagination from '../components/Pagination'

// Modal Component
function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl animate-fadeIn max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white">
          <h3 className="font-semibold text-lg text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// Customer Form Component
function CustomerForm({ customer, onSubmit, onCancel, loading }) {
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    email: customer?.email || '',
    mobile: customer?.mobile || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    city: customer?.city || '',
    state: customer?.state || '',
    pincode: customer?.pincode || '',
    gstin: customer?.gstin || '',
    companyName: customer?.companyName || '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
          <input type="text" name="companyName" value={formData.companyName} onChange={handleChange}
            className="input-field" placeholder="Enter company name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name *</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required
            className="input-field" placeholder="Enter contact name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mobile *</label>
          <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} required
            className="input-field" placeholder="Enter mobile number" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange}
            className="input-field" placeholder="Enter email" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
            className="input-field" placeholder="Enter phone number" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input type="text" name="address" value={formData.address} onChange={handleChange}
            className="input-field" placeholder="Enter address" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <input type="text" name="city" value={formData.city} onChange={handleChange}
            className="input-field" placeholder="Enter city" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
          <input type="text" name="state" value={formData.state} onChange={handleChange}
            className="input-field" placeholder="Enter state" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
          <input type="text" name="pincode" value={formData.pincode} onChange={handleChange}
            className="input-field" placeholder="Enter pincode" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
          <input type="text" name="gstin" value={formData.gstin} onChange={handleChange}
            className="input-field" placeholder="Enter GSTIN" />
        </div>
      </div>
      <div className="flex gap-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1" disabled={loading}>Cancel</button>
        <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={loading}>
          {loading && <Loader className="w-4 h-4 animate-spin" />}
          {customer ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  )
}

// Delete Confirmation Modal
function DeleteModal({ customer, onConfirm, onCancel, loading }) {
  return (
    <div className="p-6 text-center">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-6 h-6 text-red-600" />
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">Delete Customer</h3>
      <p className="text-gray-500 mb-6">
        Are you sure you want to delete <strong>{customer?.name}</strong>? This action cannot be undone.
      </p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="btn-secondary flex-1" disabled={loading}>Cancel</button>
        <button onClick={onConfirm} className="btn-danger flex-1 flex items-center justify-center gap-2" disabled={loading}>
          {loading && <Loader className="w-4 h-4 animate-spin" />}
          Delete
        </button>
      </div>
    </div>
  )
}

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [formLoading, setFormLoading] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    limit: 10,
  })

  const fetchCustomers = async (page = currentPage, limit = pagination.limit) => {
    setLoading(true)
    setError(null)
    try {
      const response = await getAdminCustomers({ page, limit })
      if (response.success !== false) {
        // Handle both paginated and non-paginated responses
        if (response.pagination) {
          setCustomers(response.data || [])
          setPagination({
            total: response.pagination.total || 0,
            totalPages: response.pagination.totalPages || 1,
            limit: response.pagination.limit || 10,
          })
        } else {
          // Fallback for non-paginated API response
          setCustomers(response.data || response || [])
          setPagination({
            total: (response.data || response || []).length,
            totalPages: 1,
            limit: 9999,
          })
        }
      } else {
        setError(response.message || 'Failed to fetch customers')
      }
    } catch (err) {
      setError('Failed to fetch customers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers(1)
  }, [])

  const handlePageChange = (page) => {
    setCurrentPage(page)
    fetchCustomers(page)
  }

  // Client-side search filter (for immediate feedback)
  const filteredCustomers = customers.filter((c) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      c.name?.toLowerCase().includes(query) ||
      c.companyName?.toLowerCase().includes(query) ||
      c.mobile?.toLowerCase().includes(query) ||
      c.email?.toLowerCase().includes(query) ||
      c.city?.toLowerCase().includes(query)
    )
  })

  const handleCreate = async (data) => {
    setFormLoading(true)
    try {
      const response = await createAdminCustomer(data)
      if (response.success) {
        // Refresh the current page
        fetchCustomers(currentPage)
        setShowModal(false)
        setSelectedCustomer(null)
      } else {
        alert(response.message || 'Failed to create customer')
      }
    } catch (err) {
      alert('Failed to create customer')
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdate = async (data) => {
    setFormLoading(true)
    try {
      const response = await updateAdminCustomer(selectedCustomer._id, data)
      if (response.success) {
        setCustomers((prev) =>
          prev.map((c) => (c._id === selectedCustomer._id ? response.data : c))
        )
        setShowModal(false)
        setSelectedCustomer(null)
      } else {
        alert(response.message || 'Failed to update customer')
      }
    } catch (err) {
      alert('Failed to update customer')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    setFormLoading(true)
    try {
      const response = await deleteAdminCustomer(selectedCustomer._id)
      if (response.success) {
        // Refresh current page or go to previous if current page is empty
        if (customers.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1)
          fetchCustomers(currentPage - 1)
        } else {
          fetchCustomers(currentPage)
        }
        setShowDeleteModal(false)
        setSelectedCustomer(null)
      } else {
        alert(response.message || 'Failed to delete customer')
      }
    } catch (err) {
      alert('Failed to delete customer')
    } finally {
      setFormLoading(false)
    }
  }

  if (loading && currentPage === 1) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-gray-600 mb-4">{error}</p>
        <button onClick={() => fetchCustomers(1)} className="btn-primary">Retry</button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500 mt-1">Manage your customer database</p>
        </div>
        <button onClick={() => { setSelectedCustomer(null); setShowModal(true) }} className="btn-primary flex items-center gap-2 whitespace-nowrap">
          <Plus className="w-5 h-5" />
          Add Customer
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Search customers..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Customer</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 hidden md:table-cell">Contact</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 hidden lg:table-cell">Location</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 hidden lg:table-cell">GSTIN</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 hidden sm:table-cell">Created</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <UserCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No customers found</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{customer.companyName || customer.name}</p>
                        {customer.companyName && <p className="text-sm text-gray-500">{customer.name}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-gray-600 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />{customer.mobile || '-'}
                        </span>
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />{customer.email || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="text-gray-600 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        {customer.city ? `${customer.city}, ${customer.state}` : customer.state || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell text-gray-600">{customer.gstin || '-'}</td>
                    <td className="px-6 py-4 hidden sm:table-cell text-gray-500 text-sm">
                      {new Date(customer.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setSelectedCustomer(customer); setShowModal(true) }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4 text-gray-500" />
                        </button>
                        <button onClick={() => { setSelectedCustomer(customer); setShowDeleteModal(true) }}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
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

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setSelectedCustomer(null) }}
        title={selectedCustomer ? 'Edit Customer' : 'Add Customer'}>
        <CustomerForm customer={selectedCustomer} onSubmit={selectedCustomer ? handleUpdate : handleCreate}
          onCancel={() => { setShowModal(false); setSelectedCustomer(null) }} loading={formLoading} />
      </Modal>

      <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setSelectedCustomer(null) }} title="Delete Customer">
        <DeleteModal customer={selectedCustomer} onConfirm={handleDelete}
          onCancel={() => { setShowDeleteModal(false); setSelectedCustomer(null) }} loading={formLoading} />
      </Modal>
    </div>
  )
}