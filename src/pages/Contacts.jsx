import { useState, useEffect, useRef } from 'react'
import {
  Plus, Search, Edit2, Trash2, X, Loader, AlertCircle, Eye,
  User, Building, Phone, Camera
} from 'lucide-react'
import { getContacts, getContactById, createContact, updateContact, deleteContact, getAdminCustomers, getContactDesignations, uploadImage } from '../services/adminApi'
import Pagination from '../components/Pagination'

// Default designation options
const DEFAULT_DESIGNATIONS = [
  'Owner',
  'Proprietor',
  'Partner',
  'Director',
  'Manager',
  'Purchase Manager',
  'Sales Manager',
  'Accountant',
  'Staff'
]

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
function ContactForm({ contact, onSubmit, onCancel, loading, customers, designations: propDesignations }) {
  const [formData, setFormData] = useState({
    firstName: contact?.firstName || '',
    middleName: contact?.middleName || '',
    lastName: contact?.lastName || '',
    customer: contact?.customer?._id || contact?.customer || '',
    firmName: contact?.firmName || '',
    designation: contact?.designation || '',
    customDesignation: '',
    landmark: contact?.landmark || '',
    city: contact?.city || '',
    mobile1: contact?.mobile1 || '',
    mobile1WhatsApp: contact?.mobile1WhatsApp || false,
    mobile2: contact?.mobile2 || '',
    mobile2WhatsApp: contact?.mobile2WhatsApp || false,
    mobile3: contact?.mobile3 || '',
    mobile3WhatsApp: contact?.mobile3WhatsApp || false,
    email: contact?.email || '',
    aadharCard: contact?.aadharCard || '',
    panCard: contact?.panCard || '',
    photo: contact?.photo || '',
    notes: contact?.notes || '',
    isPrimary: contact?.isPrimary || false,
    status: contact?.status || 'active'
  })

  const [errors, setErrors] = useState({})
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadingAadhar, setUploadingAadhar] = useState(false)
  const [uploadingPan, setUploadingPan] = useState(false)
  const [showCustomDesignation, setShowCustomDesignation] = useState(false)
  const dropdownRef = useRef(null)
  const fileInputRef = useRef(null)
  const aadharInputRef = useRef(null)
  const panInputRef = useRef(null)

  // Combine default designations with custom ones from API
  const allDesignations = [...new Set([...DEFAULT_DESIGNATIONS, ...(propDesignations || [])])]

  // Check if current designation is a custom one (not in default list)
  useEffect(() => {
    if (formData.designation && !DEFAULT_DESIGNATIONS.includes(formData.designation) && formData.designation !== 'Other') {
      setShowCustomDesignation(true)
    }
  }, [])

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
    firstName: {
      required: true,
      validate: (value) => {
        if (!value?.trim()) return 'First name is required'
        if (value.length > 50) return 'First name must be less than 50 characters'
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
    if (name === 'mobile1' || name === 'mobile2' || name === 'mobile3') {
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

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB')
      return
    }

    setUploading(true)
    try {
      const response = await uploadImage(file, 'contactPhoto')
      if (response.success && response.data?.url) {
        setFormData((prev) => ({
          ...prev,
          photo: response.data.url
        }))
      } else {
        alert(response.message || 'Failed to upload photo')
      }
    } catch (err) {
      alert('Failed to upload photo')
    } finally {
      setUploading(false)
    }
  }

  const handleAadharUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type (image or PDF)
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      alert('Please select an image or PDF file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB')
      return
    }

    setUploadingAadhar(true)
    try {
      const response = await uploadImage(file, 'contactAadharCard')
      if (response.success && response.data?.url) {
        setFormData((prev) => ({
          ...prev,
          aadharCard: response.data.url
        }))
      } else {
        alert(response.message || 'Failed to upload Aadhar card')
      }
    } catch (err) {
      alert('Failed to upload Aadhar card')
    } finally {
      setUploadingAadhar(false)
    }
  }

  const handlePanUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type (image or PDF)
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      alert('Please select an image or PDF file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB')
      return
    }

    setUploadingPan(true)
    try {
      const response = await uploadImage(file, 'contactPanCard')
      if (response.success && response.data?.url) {
        setFormData((prev) => ({
          ...prev,
          panCard: response.data.url
        }))
      } else {
        alert(response.message || 'Failed to upload PAN card')
      }
    } catch (err) {
      alert('Failed to upload PAN card')
    } finally {
      setUploadingPan(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validateForm()) {
      return
    }
    // Compute full name from parts
    const name = [formData.firstName, formData.middleName, formData.lastName].filter(Boolean).join(' ')
    onSubmit({ ...formData, name })
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
      {/* Photo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
        <div className="flex items-center gap-4">
          <div className="relative">
            {formData.photo ? (
              <img
                src={formData.photo}
                alt="Contact"
                className="w-20 h-20 rounded-lg object-cover border border-gray-200"
              />
            ) : (
              <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                <User className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-600 transition-colors"
              disabled={uploading}
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
          <div className="flex-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm text-blue-600 hover:text-blue-700"
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload Photo'}
            </button>
            <p className="text-xs text-gray-400 mt-1">Max 5MB, JPG/PNG</p>
          </div>
        </div>
      </div>

      {/* Name Fields */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className={`input-field ${errors.firstName ? 'border-red-500' : ''}`}
            placeholder="First"
          />
          {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
          <input
            type="text"
            name="middleName"
            value={formData.middleName}
            onChange={handleChange}
            className="input-field"
            placeholder="Middle"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className="input-field"
            placeholder="Last"
          />
        </div>
      </div>

      {/* Link to Client/Firm */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Firm Name</label>
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
              placeholder="Type to search firms..."
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

            {showCustomerDropdown && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {customers.length === 0 ? (
                  <div className="p-3 text-sm text-gray-500 text-center">
                    No firms available
                  </div>
                ) : filteredCustomers.length === 0 ? (
                  <div className="p-3 text-sm text-gray-500 text-center">
                    No firms found matching "{customerSearch}"
                  </div>
                ) : (
                  <>
                    {customerSearch === '' && (
                      <div className="px-4 py-2 text-xs text-gray-400 bg-gray-50 border-b border-gray-100">
                        Select a firm or type to search
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
                        +{filteredCustomers.length - 20} more firms...
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Designation */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
        <select
          name="designation"
          value={showCustomDesignation ? 'Other' : formData.designation}
          onChange={(e) => {
            const value = e.target.value
            if (value === 'Other') {
              setShowCustomDesignation(true)
              setFormData((prev) => ({
                ...prev,
                designation: '',
                customDesignation: ''
              }))
            } else {
              setShowCustomDesignation(false)
              setFormData((prev) => ({
                ...prev,
                designation: value,
                customDesignation: ''
              }))
            }
          }}
          className="input-field"
        >
          <option value="">Select Designation</option>
          {allDesignations.map((designation) => (
            <option key={designation} value={designation}>{designation}</option>
          ))}
          <option value="Other">Other...</option>
        </select>
        {showCustomDesignation && (
          <input
            type="text"
            name="customDesignation"
            value={formData.customDesignation}
            onChange={(e) => {
              setFormData((prev) => ({
                ...prev,
                customDesignation: e.target.value,
                designation: e.target.value
              }))
            }}
            className="input-field mt-2"
            placeholder="Enter designation"
          />
        )}
      </div>

      {/* Landmark & City */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Landmark</label>
          <input
            type="text"
            name="landmark"
            value={formData.landmark}
            onChange={handleChange}
            className="input-field"
            placeholder="Landmark"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            className="input-field"
            placeholder="City"
          />
        </div>
      </div>

      {/* Mobile Numbers */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">Mobile Numbers</label>

        {/* Mobile 1 */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex">
              <span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-600 text-sm">
                +91
              </span>
              <input
                type="tel"
                name="mobile1"
                value={formData.mobile1}
                onChange={handleChange}
                className={`flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${errors.mobile1 ? 'border-red-500' : ''}`}
                placeholder="98765 43210"
                maxLength={10}
              />
            </div>
            {errors.mobile1 && <p className="text-xs text-red-500 mt-1">{errors.mobile1}</p>}
          </div>
          <label className="flex items-center gap-1.5 whitespace-nowrap">
            <input
              type="checkbox"
              name="mobile1WhatsApp"
              checked={formData.mobile1WhatsApp}
              onChange={handleChange}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <span className="text-sm text-green-600">WhatsApp</span>
          </label>
        </div>

        {/* Mobile 2 */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex">
              <span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-600 text-sm">
                +91
              </span>
              <input
                type="tel"
                name="mobile2"
                value={formData.mobile2}
                onChange={handleChange}
                className={`flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${errors.mobile2 ? 'border-red-500' : ''}`}
                placeholder="98765 43210"
                maxLength={10}
              />
            </div>
            {errors.mobile2 && <p className="text-xs text-red-500 mt-1">{errors.mobile2}</p>}
          </div>
          <label className="flex items-center gap-1.5 whitespace-nowrap">
            <input
              type="checkbox"
              name="mobile2WhatsApp"
              checked={formData.mobile2WhatsApp}
              onChange={handleChange}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <span className="text-sm text-green-600">WhatsApp</span>
          </label>
        </div>

        {/* Mobile 3 */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex">
              <span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-600 text-sm">
                +91
              </span>
              <input
                type="tel"
                name="mobile3"
                value={formData.mobile3}
                onChange={handleChange}
                className={`flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${errors.mobile3 ? 'border-red-500' : ''}`}
                placeholder="98765 43210"
                maxLength={10}
              />
            </div>
            {errors.mobile3 && <p className="text-xs text-red-500 mt-1">{errors.mobile3}</p>}
          </div>
          <label className="flex items-center gap-1.5 whitespace-nowrap">
            <input
              type="checkbox"
              name="mobile3WhatsApp"
              checked={formData.mobile3WhatsApp}
              onChange={handleChange}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <span className="text-sm text-green-600">WhatsApp</span>
          </label>
        </div>
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

      {/* Aadhar & PAN Card Uploads */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Aadhar Card</label>
          <div className="flex items-center gap-2">
            {formData.aadharCard && (
              <a
                href={formData.aadharCard}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View File
              </a>
            )}
            <label className="cursor-pointer">
              <input
                type="file"
                ref={aadharInputRef}
                accept="image/*,.pdf"
                onChange={handleAadharUpload}
                className="hidden"
              />
              <span className={`text-xs px-3 py-1.5 rounded border ${uploadingAadhar ? 'text-gray-400 border-gray-300' : 'text-blue-600 border-blue-600 hover:bg-blue-50'}`}>
                {uploadingAadhar ? 'Uploading...' : formData.aadharCard ? 'Change' : 'Upload Aadhar'}
              </span>
            </label>
          </div>
          <p className="text-xs text-gray-400 mt-1">Image or PDF, max 5MB</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">PAN Card</label>
          <div className="flex items-center gap-2">
            {formData.panCard && (
              <a
                href={formData.panCard}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View File
              </a>
            )}
            <label className="cursor-pointer">
              <input
                type="file"
                ref={panInputRef}
                accept="image/*,.pdf"
                onChange={handlePanUpload}
                className="hidden"
              />
              <span className={`text-xs px-3 py-1.5 rounded border ${uploadingPan ? 'text-gray-400 border-gray-300' : 'text-blue-600 border-blue-600 hover:bg-blue-50'}`}>
                {uploadingPan ? 'Uploading...' : formData.panCard ? 'Change' : 'Upload PAN'}
              </span>
            </label>
          </div>
          <p className="text-xs text-gray-400 mt-1">Image or PDF, max 5MB</p>
        </div>
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

      {/* Primary Contact Checkbox */}
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
        Are you sure you want to delete contact <strong>{contact?.name || `${contact?.firstName} ${contact?.lastName}`}</strong>? This action cannot be undone.
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
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-gray-100 text-gray-700'
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-700'}`}>
        {status === 'active' ? 'Active' : 'Inactive'}
      </span>
    )
  }

  const getFileUrl = (url) => {
    if (!url) return null
    if (url.startsWith('http')) return url
    return url.startsWith('/') ? url : `/${url}`
  }

  const fullName = [contact.firstName, contact.middleName, contact.lastName].filter(Boolean).join(' ') || contact.name

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start gap-4 pb-4 border-b border-gray-100">
        <div className="w-16 h-16 bg-[#1F3A5F] rounded-lg flex items-center justify-center overflow-hidden">
          {contact.photo ? (
            <img src={getFileUrl(contact.photo)} alt={fullName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-white font-semibold text-xl">
              {fullName?.charAt(0)?.toUpperCase() || 'C'}
            </span>
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-900">{fullName}</h3>
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

      {/* Linked Firm */}
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

      {/* Location */}
      {(contact.city || contact.landmark) && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Location</h4>
          <div className="space-y-1">
            {contact.landmark && <p className="text-sm text-gray-900">{contact.landmark}</p>}
            {contact.city && <p className="text-sm text-gray-600">{contact.city}</p>}
          </div>
        </div>
      )}

      {/* Contact Details */}
      <div className="space-y-3">
        {/* Mobile Numbers */}
        {contact.mobile1 && (
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-gray-400" />
            <div className="flex-1">
              <span className="text-sm text-gray-900">{contact.mobile1}</span>
              {contact.mobile1WhatsApp && (
                <span className="ml-2 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">WhatsApp</span>
              )}
            </div>
          </div>
        )}
        {contact.mobile2 && (
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-gray-400" />
            <div className="flex-1">
              <span className="text-sm text-gray-900">{contact.mobile2}</span>
              {contact.mobile2WhatsApp && (
                <span className="ml-2 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">WhatsApp</span>
              )}
            </div>
          </div>
        )}
        {contact.mobile3 && (
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-gray-400" />
            <div className="flex-1">
              <span className="text-sm text-gray-900">{contact.mobile3}</span>
              {contact.mobile3WhatsApp && (
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

        {/* Aadhar Card */}
        {contact.aadharCard && (
          <div className="flex items-start gap-3">
            <div className="w-4 h-4 flex items-center justify-center text-gray-400 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 9h.01M15 9h.01M9 15h6"/></svg>
            </div>
            <div className="flex-1">
              <span className="text-xs text-gray-400 block">Aadhar Card</span>
              <a
                href={contact.aadharCard}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View Document
              </a>
            </div>
          </div>
        )}

        {/* PAN Card */}
        {contact.panCard && (
          <div className="flex items-start gap-3">
            <div className="w-4 h-4 flex items-center justify-center text-gray-400 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 7h10M7 12h10M7 17h10"/></svg>
            </div>
            <div className="flex-1">
              <span className="text-xs text-gray-400 block">PAN Card</span>
              <a
                href={contact.panCard}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View Document
              </a>
            </div>
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
  const [designations, setDesignations] = useState([])
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

  // Fetch unique designations
  const fetchDesignations = async () => {
    try {
      const response = await getContactDesignations()
      if (response.success && response.data) {
        setDesignations(response.data)
      }
    } catch (err) {
      console.error('Failed to fetch designations:', err)
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
    fetchDesignations()
  }, [statusFilter])

  const handlePageChange = (page) => {
    setCurrentPage(page)
    fetchContacts(page)
  }

  // Client-side search filter
  const filteredContacts = contacts.filter((c) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    const fullName = [c.firstName, c.middleName, c.lastName].filter(Boolean).join(' ') || c.name
    return (
      fullName.toLowerCase().includes(query) ||
      c.firmName?.toLowerCase().includes(query) ||
      c.customer?.firmName?.toLowerCase().includes(query) ||
      c.customer?.name?.toLowerCase().includes(query) ||
      c.mobile1?.toLowerCase().includes(query) ||
      c.mobile2?.toLowerCase().includes(query) ||
      c.mobile3?.toLowerCase().includes(query) ||
      c.email?.toLowerCase().includes(query) ||
      c.designation?.toLowerCase().includes(query) ||
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
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-gray-100 text-gray-700'
    }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-700'}`}>
        {status === 'active' ? 'Active' : 'Inactive'}
      </span>
    )
  }

  // Only show full error state if we have no contacts at all
  if (error && contacts.length === 0) {
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
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
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
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <Loader className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No contacts found</p>
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => {
                  const fullName = [contact.firstName, contact.middleName, contact.lastName].filter(Boolean).join(' ') || contact.name
                  return (
                    <tr key={contact._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#1F3A5F] rounded-full flex items-center justify-center overflow-hidden">
                            {contact.photo ? (
                              <img src={contact.photo} alt={fullName} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white font-medium text-sm">
                                {fullName?.charAt(0)?.toUpperCase() || 'C'}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900 truncate">{fullName}</p>
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
                          {(contact.mobile1WhatsApp || contact.mobile2WhatsApp || contact.mobile3WhatsApp) && contact.mobile1 && (
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
                  )
                })
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
          designations={designations}
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