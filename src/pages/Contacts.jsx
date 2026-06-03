import { useState, useEffect } from 'react'
import {
  Plus, Search, Edit2, Trash2, X, Loader, AlertCircle, Eye,
  User, Building, Phone, MapPin, Upload, FileText
} from 'lucide-react'
import { getContacts, getContactById, createContact, updateContact, deleteContact, uploadFile } from '../services/adminApi'
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
function ContactForm({ contact, onSubmit, onCancel, loading }) {
  const [formData, setFormData] = useState({
    name: contact?.name || '',
    firmName: contact?.firmName || '',
    designation: contact?.designation || '',
    landmark: contact?.landmark || '',
    city: contact?.city || '',
    mobile1: contact?.mobile1 || '',
    mobile2: contact?.mobile2 || '',
    mobile3: contact?.mobile3 || '',
    photo: contact?.photo || '',
    aadharNumber: contact?.aadharNumber || '',
    panNumber: contact?.panNumber || '',
    status: contact?.status || 'new',
    notes: contact?.notes || '',
  })

  const [errors, setErrors] = useState({})
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

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
    mobile2: {
      required: false,
      validate: (value) => {
        if (value && !/^[6-9]\d{9}$/.test(value)) return 'Enter valid 10-digit mobile number'
        return null
      }
    },
    mobile3: {
      required: false,
      validate: (value) => {
        if (value && !/^[6-9]\d{9}$/.test(value)) return 'Enter valid 10-digit mobile number'
        return null
      }
    },
    aadharNumber: {
      required: false,
      validate: (value) => {
        if (value && !/^\d{12}$/.test(value)) return 'Enter valid 12-digit Aadhar number'
        return null
      }
    },
    panNumber: {
      required: false,
      validate: (value) => {
        if (value && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value.toUpperCase())) return 'Enter valid PAN (10 characters)'
        return null
      }
    },
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
    const { name, value } = e.target
    let newValue = value

    // Auto-uppercase for PAN
    if (name === 'panNumber') {
      newValue = value.toUpperCase()
    }

    // Filter input based on field type
    if (name === 'mobile1' || name === 'mobile2' || name === 'mobile3') {
      newValue = value.replace(/\D/g, '').slice(0, 10)
    } else if (name === 'aadharNumber') {
      newValue = value.replace(/\D/g, '').slice(0, 12)
    } else if (name === 'panNumber') {
      newValue = value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10).toUpperCase()
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

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploadingPhoto(true)
    try {
      const response = await uploadFile('photo', file)
      if (response.success && response.data?.url) {
        setFormData((prev) => ({
          ...prev,
          photo: response.data.url
        }))
      } else {
        alert(response.message || 'Failed to upload photo')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload photo')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validateForm()) {
      return
    }
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      {/* Personal Details */}
      <div className="border-b border-gray-100 pb-4">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Personal Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              placeholder="Enter name"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Firm Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Firm Name</label>
            <input
              type="text"
              name="firmName"
              value={formData.firmName}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter firm name"
            />
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
              placeholder="Owner / Manager / Proprietor"
            />
          </div>

          {/* Photo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
            <div className="flex items-center gap-3">
              {formData.photo ? (
                <div className="relative">
                  <img
                    src={formData.photo}
                    alt="Contact"
                    className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, photo: '' }))}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                  {uploadingPhoto ? (
                    <Loader className="w-5 h-5 text-gray-400 animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5 text-gray-400" />
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                  />
                </label>
              )}
              <span className="text-xs text-gray-500">Upload photo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="border-b border-gray-100 pb-4">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Location</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Landmark */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Landmark</label>
            <input
              type="text"
              name="landmark"
              value={formData.landmark}
              onChange={handleChange}
              className="input-field"
              placeholder="Near Metro Station / Landmark"
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter city"
            />
          </div>
        </div>
      </div>

      {/* Contact Numbers */}
      <div className="border-b border-gray-100 pb-4">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Contact Numbers</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Mobile 1 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile 1</label>
            <input
              type="tel"
              name="mobile1"
              value={formData.mobile1}
              onChange={handleChange}
              className={`input-field ${errors.mobile1 ? 'border-red-500' : ''}`}
              placeholder="10-digit mobile number"
              maxLength={10}
            />
            {errors.mobile1 && <p className="text-xs text-red-500 mt-1">{errors.mobile1}</p>}
          </div>

          {/* Mobile 2 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile 2</label>
            <input
              type="tel"
              name="mobile2"
              value={formData.mobile2}
              onChange={handleChange}
              className={`input-field ${errors.mobile2 ? 'border-red-500' : ''}`}
              placeholder="10-digit mobile number"
              maxLength={10}
            />
            {errors.mobile2 && <p className="text-xs text-red-500 mt-1">{errors.mobile2}</p>}
          </div>

          {/* Mobile 3 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile 3</label>
            <input
              type="tel"
              name="mobile3"
              value={formData.mobile3}
              onChange={handleChange}
              className={`input-field ${errors.mobile3 ? 'border-red-500' : ''}`}
              placeholder="10-digit mobile number"
              maxLength={10}
            />
            {errors.mobile3 && <p className="text-xs text-red-500 mt-1">{errors.mobile3}</p>}
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="border-b border-gray-100 pb-4">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Documents</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Aadhar Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Aadhar Number</label>
            <input
              type="text"
              name="aadharNumber"
              value={formData.aadharNumber}
              onChange={handleChange}
              className={`input-field ${errors.aadharNumber ? 'border-red-500' : ''}`}
              placeholder="12-digit Aadhar number"
              maxLength={12}
            />
            {errors.aadharNumber && <p className="text-xs text-red-500 mt-1">{errors.aadharNumber}</p>}
          </div>

          {/* PAN Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
            <input
              type="text"
              name="panNumber"
              value={formData.panNumber}
              onChange={handleChange}
              className={`input-field uppercase ${errors.panNumber ? 'border-red-500' : ''}`}
              placeholder="10-character PAN"
              maxLength={10}
            />
            {errors.panNumber && <p className="text-xs text-red-500 mt-1">{errors.panNumber}</p>}
          </div>
        </div>
      </div>

      {/* Status & Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="input-field"
          >
            <option value="new">New</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
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
        {contact.photo ? (
          <img
            src={getFileUrl(contact.photo)}
            alt={contact.name}
            className="w-16 h-16 rounded-lg object-cover border border-gray-200"
          />
        ) : (
          <div className="w-16 h-16 bg-[#1F3A5F] rounded-lg flex items-center justify-center">
            <span className="text-white font-semibold text-xl">
              {contact.name?.charAt(0)?.toUpperCase() || 'C'}
            </span>
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-900">{contact.name}</h3>
          {contact.firmName && <p className="text-sm text-gray-600">{contact.firmName}</p>}
          {contact.designation && <p className="text-xs text-gray-400">{contact.designation}</p>}
          <div className="flex gap-2 mt-2">
            <StatusBadge status={contact.status} />
          </div>
        </div>
      </div>

      {/* Personal Details */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400" />
          <div>
            <span className="text-xs text-gray-500">Name</span>
            <p className="text-sm text-gray-900">{contact.name || '-'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-gray-400" />
          <div>
            <span className="text-xs text-gray-500">Firm</span>
            <p className="text-sm text-gray-900">{contact.firmName || '-'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          <div>
            <span className="text-xs text-gray-500">City</span>
            <p className="text-sm text-gray-900">{contact.city || '-'}</p>
          </div>
        </div>
        <div>
          <span className="text-xs text-gray-500">Landmark</span>
          <p className="text-sm text-gray-900">{contact.landmark || '-'}</p>
        </div>
      </div>

      {/* Contact Numbers */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Contact Numbers</h4>
        <div className="space-y-2">
          {contact.mobile1 && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-900">{contact.mobile1}</span>
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Primary</span>
            </div>
          )}
          {contact.mobile2 && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-900">{contact.mobile2}</span>
            </div>
          )}
          {contact.mobile3 && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-900">{contact.mobile3}</span>
            </div>
          )}
          {!contact.mobile1 && !contact.mobile2 && !contact.mobile3 && (
            <p className="text-sm text-gray-500">No contact numbers</p>
          )}
        </div>
      </div>

      {/* Documents */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Documents</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs text-gray-500">Aadhar Number</span>
            <p className="text-sm text-gray-900 font-mono">{contact.aadharNumber || '-'}</p>
          </div>
          <div>
            <span className="text-xs text-gray-500">PAN Number</span>
            <p className="text-sm text-gray-900 font-mono">{contact.panNumber || '-'}</p>
          </div>
        </div>
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
            total: response.pagination.total || 0,
            totalPages: response.pagination.totalPages || 1,
            limit: response.pagination.limit || 10,
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
      c.mobile1?.toLowerCase().includes(query) ||
      c.mobile2?.toLowerCase().includes(query) ||
      c.mobile3?.toLowerCase().includes(query) ||
      c.city?.toLowerCase().includes(query)
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
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Contact</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 hidden md:table-cell">Firm</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 hidden lg:table-cell">Mobile</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 hidden lg:table-cell">City</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 hidden sm:table-cell">Created</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No contacts found</p>
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => (
                  <tr key={contact._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {contact.photo ? (
                          <img
                            src={contact.photo}
                            alt={contact.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-[#1F3A5F] rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {contact.name?.charAt(0)?.toUpperCase() || 'C'}
                            </span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{contact.name}</p>
                          {contact.designation && (
                            <p className="text-xs text-gray-500 truncate">{contact.designation}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <p className="text-gray-600 truncate max-w-[150px]">{contact.firmName || '-'}</p>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <p className="text-gray-600">{contact.mobile1 || '-'}</p>
                      {contact.mobile2 && <p className="text-xs text-gray-400">{contact.mobile2}</p>}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <p className="text-gray-600">{contact.city || '-'}</p>
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