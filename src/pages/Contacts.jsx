import { useState, useEffect, useRef } from 'react'
import {
  Plus, Search, Edit2, Trash2, X, Loader, AlertCircle, Eye,
  User, Building, Phone
} from 'lucide-react'
import { getContacts, getContactById, createContact, updateContact, deleteContact, getAdminCustomers } from '../services/adminApi'
import Pagination from '../components/Pagination'

// Modal Component
function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  }
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`bg-white rounded-2xl w-full ${sizeClasses[size]} shadow-xl animate-fadeIn max-h-[90vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
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

// Contact Form Component
function ContactForm({ contact, onSubmit, onCancel, loading, customers }) {
  const [formData, setFormData] = useState({
    name: contact?.name || '',
    customer: contact?.customer?._id || contact?.customer || '',
    firmName: contact?.firmName || '',
    designation: contact?.designation || '',
    mobile1: contact?.mobile1 || '',
    email: contact?.email || '',
    isPrimary: contact?.isPrimary || false,
    isWhatsApp: contact?.isWhatsApp !== false,
    notes: contact?.notes || '',
  })

  const [errors, setErrors] = useState({})
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowCustomerDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const validators = {
    name: {
      required: true,
      validate: (value) => {
        if (!value?.trim()) return 'Name is required'
        if (value.length > 100) return 'Name must be less than 100 characters'
        return null
      }
    },
    mobile1: {
      required: false,
      validate: (value) => {
        if (value && !/^[6-9]\d{9}$/.test(value)) return 'Enter valid 10-digit mobile number'
        return null
      }
    },
    email: {
      required: false,
      validate: (value) => {
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter valid email address'
        return null
      }
    }
  }

  const validateField = (name, value) => {
    const validator = validators[name]
    if (!validator) return null
    return validator.validate(value)
  }

  const validateForm = () => {
    const newErrors = {}
    Object.keys(validators).forEach(field => {
      const error = validateField(field, formData[field])
      if (error) newErrors[field] = error
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    let newValue = type === 'checkbox' ? checked : value

    // Filter input based on field type
    if (name === 'mobile1') {
      newValue = value.replace(/\D/g, '').slice(0, 10)
    }

    setFormData((prev) => ({
      ...prev,
      [name]: newValue
    }))

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null
      }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validateForm()) {
      return
    }
    onSubmit(formData)
  }

  // Filter customers based on search
  const filteredCustomers = customers.filter(c => {
    const searchLower = customerSearch.toLowerCase()
    if (!searchLower) return true // Show all when no search
    return (
      c.firmName?.toLowerCase().includes(searchLower) ||
      c.name?.toLowerCase().includes(searchLower) ||
      c.mobile?.toLowerCase().includes(searchLower)
    )
  })

  // Get selected customer name
  const selectedCustomer = customers.find(c => c._id === formData.customer)

  // Handle customer selection
  const handleCustomerSelect = (customer) => {
    setFormData((prev) => ({
      ...prev,
      customer: customer._id,
      firmName: customer.firmName || customer.name
    }))
    setCustomerSearch('')
    setShowCustomerDropdown(false)
  }

  // Clear customer selection
  const handleClearCustomer = () => {
    setFormData((prev) => ({
      ...prev,
      customer: '',
      firmName: ''
    }))
    setCustomerSearch('')
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      {/* Link to Client/Firm */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Link to Client/Firm</label>
        {formData.customer ? (
          <div className="flex items-center gap-2 p-2.5 border border-gray-200 rounded-xl bg-gray-50">
            <Building className="w-4 h-4 text-gray-400" />
            <span className="flex-1 text-sm text-gray-900 truncate">
              {selectedCustomer?.firmName || selectedCustomer?.name || formData.firmName}
            </span>
            <button
              type="button"
              onClick={handleClearCustomer}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        ) : (
          <div className="relative" ref={dropdownRef}>
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value)
                setShowCustomerDropdown(true)
              }}
              onFocus={() => setShowCustomerDropdown(true)}
              className="input-field"
              placeholder="Type to search clients..."
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

            {showCustomerDropdown && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {customers.length === 0 ? (
                  <div className="p-3 text-sm text-gray-500 text-center">
                    No clients available
                  </div>
                ) : filteredCustomers.length === 0 ? (
                  <div className="p-3 text-sm text-gray-500 text-center">
                    No clients found matching "{customerSearch}"
                  </div>
                ) : (
                  <>
                    {customerSearch === '' && (
                      <div className="px-4 py-2 text-xs text-gray-400 bg-gray-50 border-b border-gray-100">
                        Select a client or type to search
                      </div>
                    )}
                    {filteredCustomers.slice(0, 20).map((customer) => (
                      <button
                        key={customer._id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          handleCustomerSelect(customer)
                        }}
                        className="w-full px-4 py-2.5 text-left hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-b-0"
                      >
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {customer.firmName || customer.name}
                            </p>
                            {customer.mobile && (
                              <p className="text-xs text-gray-500">{customer.mobile}</p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                    {filteredCustomers.length > 20 && (
                      <div className="px-4 py-2 text-xs text-gray-400 bg-gray-50">
                        +{filteredCustomers.length - 20} more clients...
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
        {/* <p className="text-xs text-gray-400 mt-1">Optional: Link this contact to an existing client</p> */}
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`input-field ${errors.name ? 'border-red-500' : ''}`}
          placeholder="Contact person name"
        />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
      </div>

      {/* Designation */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
        <input
          type="text"
          name="designation"
          value={formData.designation}
          onChange={handleChange}
          className="input-field"
          placeholder="e.g., Manager, Owner, Proprietor"
        />
      </div>

      {/* Mobile */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mobile Number
        </label>
        <input
          type="tel"
          name="mobile1"
          value={formData.mobile1}
          onChange={handleChange}
          className={`input-field ${errors.mobile1 ? 'border-red-500' : ''}`}
          placeholder="Enter mobile number"
          maxLength={10}
        />
        {errors.mobile1 && <p className="text-xs text-red-500 mt-1">{errors.mobile1}</p>}
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={`input-field ${errors.email ? 'border-red-500' : ''}`}
          placeholder="Enter email address"
        />
        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
      </div>

      {/* Checkboxes */}
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="isPrimary"
            checked={formData.isPrimary}
            onChange={handleChange}
            className="w-4 h-4 text-[#1F3A5F] border-gray-300 rounded focus:ring-[#1F3A5F]"
          />
          <span className="text-sm text-gray-700">Set as Primary Contact</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="isWhatsApp"
            checked={formData.isWhatsApp}
            onChange={handleChange}
            className="w-4 h-4 text-[#1F3A5F] border-gray-300 rounded focus:ring-[#1F3A5F]"
          />
          <span className="text-sm text-gray-700">WhatsApp Available</span>
        </label>
      </div>

     

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          className="input-field"
          placeholder="Internal notes"
          rows={2}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1" disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={loading}>
          {loading && <Loader className="w-4 h-4 animate-spin" />}
          {contact ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  )
}

// Delete Confirmation Modal
function DeleteModal({ contact, onConfirm, onCancel, loading }) {
  return (
    <div className="p-6 text-center">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-6 h-6 text-red-600" />
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">Delete Contact</h3>
      <p className="text-gray-500 mb-6">
        Are you sure you want to delete contact <strong>{contact?.name}</strong>? This action cannot be undone.
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

// Contact View Modal
function ContactViewModal({ contact, onClose }) {
  if (!contact) return null

  const StatusBadge = ({ status }) => {
    const statusColors = {
      new: 'bg-blue-100 text-blue-700',
      in_progress: 'bg-amber-100 text-amber-700',
      resolved: 'bg-green-100 text-green-700',
      closed: 'bg-gray-100 text-gray-700'
    }
    const statusLabels = {
      new: 'New',
      in_progress: 'In Progress',
      resolved: 'Resolved',
      closed: 'Closed'
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-700'}`}>
        {statusLabels[status] || status}
      </span>
    )
  }

  const getFileUrl = (url) => {
    if (!url) return null
    if (url.startsWith('http')) return url
    return url.startsWith('/') ? url : `/${url}`
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start gap-4 pb-4 border-b border-gray-100">
        <div className="w-16 h-16 bg-[#1F3A5F] rounded-lg flex items-center justify-center">
          <span className="text-white font-semibold text-xl">
            {contact.name?.charAt(0)?.toUpperCase() || 'C'}
          </span>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-900">{contact.name}</h3>
          {contact.designation && <p className="text-sm text-gray-500">{contact.designation}</p>}
          <div className="flex flex-wrap gap-2 mt-2">
            <StatusBadge status={contact.status} />
            {contact.isPrimary && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                Primary
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Linked Client */}
      {(contact.customer || contact.firmName) && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
          <Building className="w-4 h-4 text-blue-600" />
          <div className="flex-1">
            <span className="text-xs text-blue-600">Linked to</span>
            <p className="text-sm font-medium text-gray-900">
              {contact.customer?.firmName || contact.customer?.name || contact.firmName}
            </p>
          </div>
        </div>
      )}

      {/* Contact Details */}
      <div className="space-y-3">
        {/* Mobile */}
        {contact.mobile1 && (
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-gray-400" />
            <div className="flex-1">
              <span className="text-sm text-gray-900">{contact.mobile1}</span>
              {contact.isWhatsApp && (
                <span className="ml-2 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">WhatsApp</span>
              )}
            </div>
          </div>
        )}

        {/* Email */}
        {contact.email && (
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 flex items-center justify-center text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            </div>
            <span className="text-sm text-gray-900">{contact.email}</span>
          </div>
        )}
      </div>

      {/* Notes */}
      {contact.notes && (
        <div className="bg-amber-50 rounded-lg p-4">
          <span className="text-xs text-amber-600 block mb-1">Internal Notes</span>
          <p className="text-sm text-gray-700">{contact.notes}</p>
        </div>
      )}

      {/* Timestamps */}
      <div className="pt-3 border-t border-gray-100 text-xs text-gray-400 flex justify-between">
        <span>Created: {new Date(contact.createdAt).toLocaleString()}</span>
        <span>Updated: {new Date(contact.updatedAt).toLocaleString()}</span>
      </div>

      {/* Close Button */}
      <div className="pt-3">
        <button onClick={onClose} className="btn-secondary w-full">Close</button>
      </div>
    </div>
  )
}

export default function Contacts() {
  const [contacts, setContacts] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedContact, setSelectedContact] = useState(null)
  const [formLoading, setFormLoading] = useState(false)

  // Filter state
  const [statusFilter, setStatusFilter] = useState('all')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    limit: 10,
  })

  // Fetch all customers for dropdown
  const fetchCustomers = async () => {
    try {
      const response = await getAdminCustomers({ limit: 9999 })
      if (response.success !== false) {
        setCustomers(response.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err)
    }
  }

  const fetchContacts = async (page = currentPage, limit = pagination.limit) => {
    setLoading(true)
    setError(null)
    try {
      const params = { page, limit }
      if (statusFilter !== 'all') {
        params.status = statusFilter
      }
      const response = await getContacts(params)
      if (response.success !== false) {
        if (response.pagination) {
          setContacts(response.data || [])
          setPagination({
            total: response.pagination.totalItems || response.pagination.total || 0,
            totalPages: response.pagination.totalPages || 1,
            limit: response.pagination.itemsPerPage || response.pagination.limit || 10,
          })
        } else {
          setContacts(response.data || response || [])
          setPagination({
            total: (response.data || response || []).length,
            totalPages: 1,
            limit: 9999,
          })
        }
      } else {
        setError(response.message || 'Failed to fetch contacts')
      }
    } catch (err) {
      setError('Failed to fetch contacts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContacts(1)
    fetchCustomers()
  }, [statusFilter])

  const handlePageChange = (page) => {
    setCurrentPage(page)
    fetchContacts(page)
  }

  // Client-side search filter
  const filteredContacts = contacts.filter((c) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      c.name?.toLowerCase().includes(query) ||
      c.firmName?.toLowerCase().includes(query) ||
      c.customer?.firmName?.toLowerCase().includes(query) ||
      c.customer?.name?.toLowerCase().includes(query) ||
      c.mobile1?.toLowerCase().includes(query) ||
      c.email?.toLowerCase().includes(query) ||
      c.designation?.toLowerCase().includes(query)
    )
  })

  const handleCreate = async (data) => {
    setFormLoading(true)
    try {
      const response = await createContact(data)
      if (response.success) {
        fetchContacts(currentPage)
        setShowModal(false)
        setSelectedContact(null)
      } else {
        alert(response.message || 'Failed to create contact')
      }
    } catch (err) {
      alert('Failed to create contact')
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdate = async (data) => {
    setFormLoading(true)
    try {
      const response = await updateContact(selectedContact._id, data)
      if (response.success) {
        setContacts((prev) =>
          prev.map((c) => (c._id === selectedContact._id ? response.data : c))
        )
        setShowModal(false)
        setSelectedContact(null)
      } else {
        alert(response.message || 'Failed to update contact')
      }
    } catch (err) {
      alert('Failed to update contact')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    setFormLoading(true)
    try {
      const response = await deleteContact(selectedContact._id)
      if (response.success) {
        if (contacts.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1)
          fetchContacts(currentPage - 1)
        } else {
          fetchContacts(currentPage)
        }
        setShowDeleteModal(false)
        setSelectedContact(null)
      } else {
        alert(response.message || 'Failed to delete contact')
      }
    } catch (err) {
      alert('Failed to delete contact')
    } finally {
      setFormLoading(false)
    }
  }

  // Status badge component for table
  const StatusBadge = ({ status }) => {
    const statusColors = {
      new: 'bg-blue-100 text-blue-700',
      in_progress: 'bg-amber-100 text-amber-700',
      resolved: 'bg-green-100 text-green-700',
      closed: 'bg-gray-100 text-gray-700'
    }
    const statusLabels = {
      new: 'New',
      in_progress: 'In Progress',
      resolved: 'Resolved',
      closed: 'Closed'
    }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-700'}`}>
        {statusLabels[status] || status}
      </span>
    )
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
        <button onClick={() => fetchContacts(1)} className="btn-primary">Retry</button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-500 mt-1">Manage contact entries</p>
        </div>
        <button
          onClick={() => { setSelectedContact(null); setShowModal(true) }}
          className="btn-primary flex items-center gap-2 whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          Add Contact
        </button>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, firm, mobile, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Contact</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 hidden md:table-cell">Firm</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 hidden lg:table-cell">Mobile</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 hidden sm:table-cell">Created</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No contacts found</p>
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => (
                  <tr key={contact._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#1F3A5F] rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {contact.name?.charAt(0)?.toUpperCase() || 'C'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 truncate">{contact.name}</p>
                            {contact.isPrimary && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">Primary</span>
                            )}
                          </div>
                          {contact.designation && (
                            <p className="text-xs text-gray-500 truncate">{contact.designation}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="flex flex-col">
                        <p className="text-gray-600 truncate max-w-[150px]">
                          {contact.customer?.firmName || contact.firmName || '-'}
                        </p>
                        {contact.customer && (
                          <span className="text-xs text-blue-500">Linked</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <div className="flex flex-col">
                        <p className="text-gray-600">{contact.mobile1 || '-'}</p>
                        {contact.isWhatsApp && contact.mobile1 && (
                          <span className="text-xs text-green-600">WhatsApp</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={contact.status} />
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm hidden sm:table-cell">
                      {new Date(contact.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setSelectedContact(contact); setShowViewModal(true) }}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-blue-500" />
                        </button>
                        <button
                          onClick={() => { setSelectedContact(contact); setShowModal(true) }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => { setSelectedContact(contact); setShowDeleteModal(true) }}
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
        onClose={() => { setShowModal(false); setSelectedContact(null) }}
        title={selectedContact ? 'Edit Contact' : 'Add Contact'}
        size="lg"
      >
        <ContactForm
          contact={selectedContact}
          onSubmit={selectedContact ? handleUpdate : handleCreate}
          onCancel={() => { setShowModal(false); setSelectedContact(null) }}
          loading={formLoading}
          customers={customers}
        />
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setSelectedContact(null) }}
        title="Delete Contact"
        size="sm"
      >
        <DeleteModal
          contact={selectedContact}
          onConfirm={handleDelete}
          onCancel={() => { setShowDeleteModal(false); setSelectedContact(null) }}
          loading={formLoading}
        />
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => { setShowViewModal(false); setSelectedContact(null) }}
        title="Contact Details"
        size="md"
      >
        <ContactViewModal
          contact={selectedContact}
          onClose={() => { setShowViewModal(false); setSelectedContact(null) }}
        />
      </Modal>
    </div>
  )
}