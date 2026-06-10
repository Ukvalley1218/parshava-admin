import { useState, useEffect } from 'react'
import {
  Plus, Search, Edit2, Trash2, X, Loader, AlertCircle, Eye,
  UserCircle, Mail, Phone, MapPin, Building, Globe, FileText, Tag, User, Upload
} from 'lucide-react'
import { getAdminCustomers, getAdminCustomerById, createAdminCustomer, updateAdminCustomer, deleteAdminCustomer, uploadFile, getBusinessCategories, getBrandCategoryList } from '../services/adminApi'
import Pagination from '../components/Pagination'

// Modal Component
function Modal({ isOpen, onClose, title, children, size = 'lg' }) {
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

// Firm Form Component
function CustomerForm({ customer, onSubmit, onCancel, loading, businessCategories, brandCategories }) {
  const [formData, setFormData] = useState({
    // Personal Details
    softwareId: customer?.softwareId || '',
    firmName: customer?.firmName || '',
    firmPhoto: customer?.firmPhoto || '',
    firmPhotoName: customer?.firmPhoto?.split('/').pop() || '',
    name: customer?.name || '',
    customerPhoto: customer?.customerPhoto || '',
    customerPhotoName: customer?.customerPhoto?.split('/').pop() || '',
    designation: customer?.designation || '',

    // Address
    address: customer?.address || '',
    googleLocation: customer?.googleLocation || '',
    landmark: customer?.landmark || '',
    city: customer?.city || '',
    state: customer?.state || '',
    pincode: customer?.pincode || '',
    country: customer?.country || 'India',

    // Contact - Mobile numbers
    mobile: customer?.mobile || '',
    isWhatsApp: customer?.isWhatsApp ?? true,
    mobile2: customer?.mobile2 || '',
    mobile2Whatsapp: customer?.mobile2Whatsapp || false,
    mobile3: customer?.mobile3 || '',
    mobile3Whatsapp: customer?.mobile3Whatsapp || false,
    email: customer?.email || '',

    // Business Details (Numbers)
    gstin: customer?.gstin || '',
    panNumber: customer?.panNumber || '',
    aadharNumber: customer?.aadharNumber || '',
    shopActNumber: customer?.shopActNumber || '',
    msmeNumber: customer?.msmeNumber || '',

    // Documents
    documents: customer?.documents || [],

    // Categories
    businessCategory: customer?.businessCategory || '',
    brandCategory: customer?.brandCategory || '',

    // Management
    priceListCategory: customer?.priceListCategory || 'T1',
    accountManager: customer?.accountManager || '',
    productManager: customer?.productManager || '',
    leadSource: customer?.leadSource || '',

    // Status
    customerType: customer?.customerType || 'customer',
    customerStatus: customer?.customerStatus || 'active',
    notes: customer?.notes || ''
  })

  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  // Document types for upload
  const documentTypes = [
    { key: 'panCard', label: 'PAN Card' },
    { key: 'aadharCard', label: 'Aadhar Card' },
    { key: 'shopAct', label: 'Shop Act' },
    { key: 'msme', label: 'MSME Certificate' },
    { key: 'gstCertificate', label: 'GST Certificate' },
    { key: 'other', label: 'Other Documents' }
  ]

  // Validation functions
  const validators = {
    // Mandatory fields
    firmName: {
      required: true,
      validate: (value) => {
        if (!value?.trim()) return 'Firm name is required'
        if (value.length > 150) return 'Firm name must be less than 150 characters'
        return null
      }
    },
    name: {
      required: true,
      validate: (value) => {
        if (!value?.trim()) return 'Contact name is required'
        if (value.length > 100) return 'Name must be less than 100 characters'
        return null
      }
    },
    mobile: {
      required: true,
      validate: (value) => {
        if (!value?.trim()) return 'Mobile number is required'
        if (!/^[6-9]\d{9}$/.test(value)) return 'Enter valid 10-digit mobile number'
        return null
      }
    },
    address: {
      required: true,
      validate: (value) => {
        if (!value?.trim()) return 'Address is required'
        if (value.length > 300) return 'Address must be less than 300 characters'
        return null
      }
    },
    city: {
      required: true,
      validate: (value) => {
        if (!value?.trim()) return 'City is required'
        if (value.length > 50) return 'City name too long'
        return null
      }
    },
    state: {
      required: true,
      validate: (value) => {
        if (!value?.trim()) return 'State is required'
        if (value.length > 50) return 'State name too long'
        return null
      }
    },
    pincode: {
      required: true,
      validate: (value) => {
        if (!value?.trim()) return 'Pincode is required'
        if (!/^\d{6}$/.test(value)) return 'Enter valid 6-digit pincode'
        return null
      }
    },
    email: {
      required: true,
      validate: (value) => {
        if (!value?.trim()) return 'Email is required'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter valid email address'
        return null
      }
    },
    country: {
      required: true,
      validate: (value) => {
        if (!value?.trim()) return 'Country is required'
        return null
      }
    },
    panNumber: {
      required: true,
      validate: (value) => {
        if (!value?.trim()) return 'PAN number is required'
        if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value.toUpperCase())) return 'Enter valid PAN (10 characters)'
        return null
      }
    },
    aadharNumber: {
      required: true,
      validate: (value) => {
        if (!value?.trim()) return 'Aadhar number is required'
        if (!/^\d{12}$/.test(value)) return 'Enter valid 12-digit Aadhar number'
        return null
      }
    },
    shopActNumber: {
      required: true,
      validate: (value) => {
        if (!value?.trim()) return 'Shop Act number is required'
        return null
      }
    },
    msmeNumber: {
      required: true,
      validate: (value) => {
        if (!value?.trim()) return 'MSME number is required'
        return null
      }
    },
    priceListCategory: {
      required: true,
      validate: (value) => {
        if (!value) return 'Price list is required'
        return null
      }
    },
    customerType: {
      required: true,
      validate: (value) => {
        if (!value) return 'Customer type is required'
        return null
      }
    },
    customerStatus: {
      required: true,
      validate: (value) => {
        if (!value) return 'Customer status is required'
        return null
      }
    },
    accountManager: {
      required: true,
      validate: (value) => {
        if (!value?.trim()) return 'Account manager is required'
        return null
      }
    },
    productManager: {
      required: true,
      validate: (value) => {
        if (!value?.trim()) return 'Product manager is required'
        return null
      }
    },
    leadSource: {
      required: true,
      validate: (value) => {
        if (!value?.trim()) return 'Lead source is required'
        return null
      }
    },
    // Optional fields
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
    gstin: {
      required: false,
      validate: (value) => {
        if (value && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(value.toUpperCase())) return 'Enter valid GSTIN (15 characters)'
        return null
      }
    }
  }

  // Validate single field
  const validateField = (name, value) => {
    const validator = validators[name]
    if (!validator) return null
    return validator.validate(value)
  }

  // Validate all fields
  const validateForm = () => {
    const newErrors = {}
    Object.keys(validators).forEach(field => {
      const error = validateField(field, formData[field])
      if (error) newErrors[field] = error
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle field change with input filtering
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    let newValue = type === 'checkbox' ? checked : value

    // Auto-uppercase for certain fields
    if (name === 'gstin' || name === 'panNumber') {
      newValue = value.toUpperCase()
    }

    // Filter input based on field type
    if (name === 'mobile' || name === 'mobile2' || name === 'mobile3') {
      // Only allow digits, max 10
      newValue = value.replace(/\D/g, '').slice(0, 10)
    } else if (name === 'pincode') {
      // Only allow digits, max 6
      newValue = value.replace(/\D/g, '').slice(0, 6)
    } else if (name === 'aadharNumber') {
      // Only allow digits, max 12
      newValue = value.replace(/\D/g, '').slice(0, 12)
    } else if (name === 'gstin') {
      // Alphanumeric, max 15
      newValue = value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 15).toUpperCase()
    } else if (name === 'panNumber') {
      // Alphanumeric, max 10
      newValue = value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10).toUpperCase()
    }
    // Name fields (firmName, name, etc.) - allow free input, validation handles errors on submit

    setFormData((prev) => ({
      ...prev,
      [name]: newValue
    }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null
      }))
    }
  }

  // Handle field blur for validation
  const handleBlur = (e) => {
    const { name, value } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))

    const error = validateField(name, value)
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }))
    }
  }

  const handleFileChange = async (e, field) => {
    const file = e.target.files[0]
    if (file) {
      try {
        const response = await uploadFile(field, file)
        if (response.success && response.data?.url) {
          setFormData((prev) => ({
            ...prev,
            [field]: response.data.url,
            [`${field}Name`]: file.name
          }))
        } else {
          alert(response.message || 'Failed to upload file')
        }
      } catch (error) {
        console.error('Upload error:', error)
        alert('Failed to upload file')
      }
    }
  }

  const handleDocumentChange = async (e, docKey) => {
    const file = e.target.files[0]
    if (file) {
      try {
        const response = await uploadFile(docKey, file)
        if (response.success && response.data?.url) {
          setFormData((prev) => {
            const docs = [...(prev.documents || [])]
            const existingIndex = docs.findIndex(d => d.type === docKey)
            const newDoc = { type: docKey, name: file.name, url: response.data.url }

            if (existingIndex >= 0) {
              docs[existingIndex] = newDoc
            } else {
              docs.push(newDoc)
            }

            return { ...prev, documents: docs }
          })
        } else {
          alert(response.message || 'Failed to upload document')
        }
      } catch (error) {
        console.error('Upload error:', error)
        alert('Failed to upload document')
      }
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Mark all fields as touched
    const allTouched = {}
    Object.keys(validators).forEach(field => {
      allTouched[field] = true
    })
    setTouched(allTouched)

    // Validate all fields
    if (!validateForm()) {
      return
    }

    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-6">
      {/* Personal Details Section */}
      <div className="border-b border-gray-100 pb-4">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Personal Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Software ID <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <input
              type="text"
              name="softwareId"
              value={formData.softwareId}
              onChange={handleChange}
              className="input-field"
              placeholder="BK-0001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Firm Name <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  name="firmName"
                  value={formData.firmName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`input-field flex-1 ${errors.firmName && touched.firmName ? 'border-red-500' : ''}`}
                  placeholder="Enter firm name"
                />
                {errors.firmName && touched.firmName && (
                  <p className="text-xs text-red-500 mt-1">{errors.firmName}</p>
                )}
              </div>
              <label className="flex items-center gap-1 px-3 py-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
                <Upload className="w-4 h-4 text-gray-500" />
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'firmPhoto')}
                />
              </label>
            </div>
            {formData.firmPhotoName && (
              <p className="text-xs text-green-600 mt-1 truncate" title={formData.firmPhotoName}>
                {formData.firmPhotoName.length > 25 ? formData.firmPhotoName.substring(0, 22) + '...' : formData.firmPhotoName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Name <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`input-field flex-1 ${errors.name && touched.name ? 'border-red-500' : ''}`}
                  placeholder="Enter contact name"
                />
                {errors.name && touched.name && (
                  <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                )}
              </div>
              <label className="flex items-center gap-1 px-3 py-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
                <Upload className="w-4 h-4 text-gray-500" />
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'customerPhoto')}
                />
              </label>
            </div>
            {formData.customerPhotoName && (
              <p className="text-xs text-green-600 mt-1 truncate" title={formData.customerPhotoName}>
                {formData.customerPhotoName.length > 25 ? formData.customerPhotoName.substring(0, 22) + '...' : formData.customerPhotoName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Designation <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <input
              type="text"
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              className="input-field"
              placeholder="Owner / Manager / Proprietor"
            />
          </div>
        </div>
      </div>

      {/* Address Section */}
      <div className="border-b border-gray-100 pb-4">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Address</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`input-field flex-1 ${errors.address && touched.address ? 'border-red-500' : ''}`}
                placeholder="Enter full address"
              />
              <label className="flex items-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors text-sm whitespace-nowrap">
                <Globe className="w-4 h-4" />
                <span>Map</span>
                <input
                  type="text"
                  className="hidden"
                  name="googleLocation"
                  value={formData.googleLocation}
                  onChange={handleChange}
                />
              </label>
            </div>
            {errors.address && touched.address && (
              <p className="text-xs text-red-500 mt-1">{errors.address}</p>
            )}
            <input
              type="text"
              name="googleLocation"
              value={formData.googleLocation}
              onChange={handleChange}
              className="input-field mt-2 w-full"
              placeholder="Paste Google Maps link here"
            />
          </div>

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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`input-field ${errors.city && touched.city ? 'border-red-500' : ''}`}
              placeholder="Enter city"
            />
            {errors.city && touched.city && (
              <p className="text-xs text-red-500 mt-1">{errors.city}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`input-field ${errors.state && touched.state ? 'border-red-500' : ''}`}
              placeholder="Enter state"
            />
            {errors.state && touched.state && (
              <p className="text-xs text-red-500 mt-1">{errors.state}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pin Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
              onBlur={handleBlur}
              onKeyDown={(e) => {
                if ([8, 46, 9, 27, 13].includes(e.keyCode) ||
                    (e.ctrlKey && [65, 67, 86, 88].includes(e.keyCode)) ||
                    (e.keyCode >= 35 && e.keyCode <= 39)) {
                  return
                }
                if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                  e.preventDefault()
                }
              }}
              onPaste={(e) => {
                const pastedText = (e.clipboardData || window.clipboardData).getData('text')
                if (!/^\d*$/.test(pastedText)) {
                  e.preventDefault()
                }
              }}
              maxLength={6}
              inputMode="numeric"
              className={`input-field ${errors.pincode && touched.pincode ? 'border-red-500' : ''}`}
              placeholder="Enter 6-digit pincode"
            />
            {errors.pincode && touched.pincode && (
              <p className="text-xs text-red-500 mt-1">{errors.pincode}</p>
            )}
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="border-b border-gray-100 pb-4">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Contact Numbers</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mobile 1 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              onBlur={handleBlur}
              onKeyDown={(e) => {
                // Allow: backspace, delete, tab, escape, enter, arrows
                if ([8, 46, 9, 27, 13].includes(e.keyCode) ||
                    // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                    (e.ctrlKey && [65, 67, 86, 88].includes(e.keyCode)) ||
                    // Allow: home, end, left, right
                    (e.keyCode >= 35 && e.keyCode <= 39)) {
                  return
                }
                // Block non-numeric keys
                if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                  e.preventDefault()
                }
              }}
              onPaste={(e) => {
                const pastedText = (e.clipboardData || window.clipboardData).getData('text')
                if (!/^\d*$/.test(pastedText)) {
                  e.preventDefault()
                }
              }}
              maxLength={10}
              inputMode="numeric"
              pattern="[6-9][0-9]{9}"
              className={`input-field ${errors.mobile && touched.mobile ? 'border-red-500' : ''}`}
              placeholder="10-digit mobile number"
            />
            {errors.mobile && touched.mobile && (
              <p className="text-xs text-red-500 mt-1">{errors.mobile}</p>
            )}
            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input
                type="checkbox"
                name="isWhatsApp"
                checked={formData.isWhatsApp}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-600">WhatsApp</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mobile 2 <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <input
              type="tel"
              name="mobile2"
              value={formData.mobile2}
              onChange={handleChange}
              onBlur={handleBlur}
              onKeyDown={(e) => {
                if ([8, 46, 9, 27, 13].includes(e.keyCode) ||
                    (e.ctrlKey && [65, 67, 86, 88].includes(e.keyCode)) ||
                    (e.keyCode >= 35 && e.keyCode <= 39)) {
                  return
                }
                if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                  e.preventDefault()
                }
              }}
              onPaste={(e) => {
                const pastedText = (e.clipboardData || window.clipboardData).getData('text')
                if (!/^\d*$/.test(pastedText)) {
                  e.preventDefault()
                }
              }}
              maxLength={10}
              inputMode="numeric"
              className={`input-field ${errors.mobile2 && touched.mobile2 ? 'border-red-500' : ''}`}
              placeholder="Alternate mobile (optional)"
            />
            {errors.mobile2 && touched.mobile2 && (
              <p className="text-xs text-red-500 mt-1">{errors.mobile2}</p>
            )}
            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input
                type="checkbox"
                name="mobile2Whatsapp"
                checked={formData.mobile2Whatsapp}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-600">WhatsApp</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mobile 3 <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <input
              type="tel"
              name="mobile3"
              value={formData.mobile3}
              onChange={handleChange}
              onBlur={handleBlur}
              onKeyDown={(e) => {
                if ([8, 46, 9, 27, 13].includes(e.keyCode) ||
                    (e.ctrlKey && [65, 67, 86, 88].includes(e.keyCode)) ||
                    (e.keyCode >= 35 && e.keyCode <= 39)) {
                  return
                }
                if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                  e.preventDefault()
                }
              }}
              onPaste={(e) => {
                const pastedText = (e.clipboardData || window.clipboardData).getData('text')
                if (!/^\d*$/.test(pastedText)) {
                  e.preventDefault()
                }
              }}
              maxLength={10}
              inputMode="numeric"
              className={`input-field ${errors.mobile3 && touched.mobile3 ? 'border-red-500' : ''}`}
              placeholder="Additional mobile (optional)"
            />
            {errors.mobile3 && touched.mobile3 && (
              <p className="text-xs text-red-500 mt-1">{errors.mobile3}</p>
            )}
            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input
                type="checkbox"
                name="mobile3Whatsapp"
                checked={formData.mobile3Whatsapp}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-600">WhatsApp</span>
            </label>
          </div>
        </div>
      </div>

      {/* Documents Section */}
      <div className="border-b border-gray-100 pb-4">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Documents (Upload)</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {documentTypes.map((doc) => {
            const fileName = formData.documents?.find(d => d.type === doc.key)?.name
            const truncatedName = fileName && fileName.length > 20
              ? fileName.substring(0, 17) + '...'
              : fileName
            return (
              <div key={doc.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{doc.label}</label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors overflow-hidden">
                    <Upload className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-600 truncate whitespace-nowrap overflow-hidden" title={fileName || 'Choose file'}>
                      {truncatedName || 'Choose file'}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleDocumentChange(e, doc.key)}
                    />
                  </label>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Business Details Section */}
      <div className="border-b border-gray-100 pb-4">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Business Details (Numbers)</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GSTIN <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <input
              type="text"
              name="gstin"
              value={formData.gstin}
              onChange={handleChange}
              onBlur={handleBlur}
              onKeyDown={(e) => {
                if ([8, 46, 9, 27, 13].includes(e.keyCode) ||
                    (e.ctrlKey && [65, 67, 86, 88].includes(e.keyCode)) ||
                    (e.keyCode >= 35 && e.keyCode <= 39)) {
                  return
                }
                // Block special characters but allow alphanumeric
                if (!/^[a-zA-Z0-9]$/.test(e.key) && e.key.length === 1) {
                  e.preventDefault()
                }
              }}
              onPaste={(e) => {
                const pastedText = (e.clipboardData || window.clipboardData).getData('text')
                if (!/^[a-zA-Z0-9]*$/.test(pastedText)) {
                  e.preventDefault()
                }
              }}
              maxLength={15}
              style={{ textTransform: 'uppercase' }}
              className={`input-field uppercase ${errors.gstin && touched.gstin ? 'border-red-500' : ''}`}
              placeholder="15-character GSTIN"
            />
            {errors.gstin && touched.gstin && (
              <p className="text-xs text-red-500 mt-1">{errors.gstin}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PAN Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="panNumber"
              value={formData.panNumber}
              onChange={handleChange}
              onBlur={handleBlur}
              onKeyDown={(e) => {
                if ([8, 46, 9, 27, 13].includes(e.keyCode) ||
                    (e.ctrlKey && [65, 67, 86, 88].includes(e.keyCode)) ||
                    (e.keyCode >= 35 && e.keyCode <= 39)) {
                  return
                }
                if (!/^[a-zA-Z0-9]$/.test(e.key) && e.key.length === 1) {
                  e.preventDefault()
                }
              }}
              onPaste={(e) => {
                const pastedText = (e.clipboardData || window.clipboardData).getData('text')
                if (!/^[a-zA-Z0-9]*$/.test(pastedText)) {
                  e.preventDefault()
                }
              }}
              maxLength={10}
              style={{ textTransform: 'uppercase' }}
              className={`input-field uppercase ${errors.panNumber && touched.panNumber ? 'border-red-500' : ''}`}
              placeholder="10-character PAN"
            />
            {errors.panNumber && touched.panNumber && (
              <p className="text-xs text-red-500 mt-1">{errors.panNumber}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Aadhar Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="aadharNumber"
              value={formData.aadharNumber}
              onChange={handleChange}
              onBlur={handleBlur}
              onKeyDown={(e) => {
                if ([8, 46, 9, 27, 13].includes(e.keyCode) ||
                    (e.ctrlKey && [65, 67, 86, 88].includes(e.keyCode)) ||
                    (e.keyCode >= 35 && e.keyCode <= 39)) {
                  return
                }
                if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                  e.preventDefault()
                }
              }}
              onPaste={(e) => {
                const pastedText = (e.clipboardData || window.clipboardData).getData('text')
                if (!/^\d*$/.test(pastedText)) {
                  e.preventDefault()
                }
              }}
              maxLength={12}
              inputMode="numeric"
              className={`input-field ${errors.aadharNumber && touched.aadharNumber ? 'border-red-500' : ''}`}
              placeholder="12-digit Aadhar number"
            />
            {errors.aadharNumber && touched.aadharNumber && (
              <p className="text-xs text-red-500 mt-1">{errors.aadharNumber}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shop Act Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="shopActNumber"
              value={formData.shopActNumber}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`input-field ${errors.shopActNumber && touched.shopActNumber ? 'border-red-500' : ''}`}
              placeholder="Enter Shop Act Number"
            />
            {errors.shopActNumber && touched.shopActNumber && (
              <p className="text-xs text-red-500 mt-1">{errors.shopActNumber}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              MSME Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="msmeNumber"
              value={formData.msmeNumber}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`input-field ${errors.msmeNumber && touched.msmeNumber ? 'border-red-500' : ''}`}
              placeholder="Enter MSME Number"
            />
            {errors.msmeNumber && touched.msmeNumber && (
              <p className="text-xs text-red-500 mt-1">{errors.msmeNumber}</p>
            )}
          </div>
        </div>
      </div>

      {/* Management Section */}
      <div className="border-b border-gray-100 pb-4">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Management</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Category <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <select
              name="businessCategory"
              value={formData.businessCategory}
              onChange={handleChange}
              className="input-field"
            >
              <option value="">Select Business Category</option>
              {businessCategories?.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand Category <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <select
              name="brandCategory"
              value={formData.brandCategory}
              onChange={handleChange}
              className="input-field"
            >
              <option value="">Select Brand Category</option>
              {brandCategories?.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price List <span className="text-red-500">*</span>
            </label>
            <select
              name="priceListCategory"
              value={formData.priceListCategory}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`input-field ${errors.priceListCategory && touched.priceListCategory ? 'border-red-500' : ''}`}
            >
              <option value="T1">T1</option>
              <option value="T2">T2</option>
              <option value="T3">T3</option>
              <option value="T4">T4</option>
            </select>
            {errors.priceListCategory && touched.priceListCategory && (
              <p className="text-xs text-red-500 mt-1">{errors.priceListCategory}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Type <span className="text-red-500">*</span>
            </label>
            <select
              name="customerType"
              value={formData.customerType}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`input-field ${errors.customerType && touched.customerType ? 'border-red-500' : ''}`}
            >
              <option value="customer">Customer</option>
              <option value="dealer">Dealer</option>
              <option value="distributor">Distributor</option>
              <option value="retailer">Retailer</option>
            </select>
            {errors.customerType && touched.customerType && (
              <p className="text-xs text-red-500 mt-1">{errors.customerType}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Status <span className="text-red-500">*</span>
            </label>
            <select
              name="customerStatus"
              value={formData.customerStatus}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`input-field ${errors.customerStatus && touched.customerStatus ? 'border-red-500' : ''}`}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="blocked">Blocked</option>
            </select>
            {errors.customerStatus && touched.customerStatus && (
              <p className="text-xs text-red-500 mt-1">{errors.customerStatus}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Manager <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="accountManager"
              value={formData.accountManager}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`input-field ${errors.accountManager && touched.accountManager ? 'border-red-500' : ''}`}
              placeholder="Manager name"
            />
            {errors.accountManager && touched.accountManager && (
              <p className="text-xs text-red-500 mt-1">{errors.accountManager}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Manager <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="productManager"
              value={formData.productManager}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`input-field ${errors.productManager && touched.productManager ? 'border-red-500' : ''}`}
              placeholder="Manager name"
            />
            {errors.productManager && touched.productManager && (
              <p className="text-xs text-red-500 mt-1">{errors.productManager}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lead Source <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="leadSource"
              value={formData.leadSource}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`input-field ${errors.leadSource && touched.leadSource ? 'border-red-500' : ''}`}
              placeholder="Website / Referral / etc."
            />
            {errors.leadSource && touched.leadSource && (
              <p className="text-xs text-red-500 mt-1">{errors.leadSource}</p>
            )}
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`input-field ${errors.email && touched.email ? 'border-red-500' : ''}`}
            placeholder="Enter email address"
          />
          {errors.email && touched.email && (
            <p className="text-xs text-red-500 mt-1">{errors.email}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Country <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="country"
            value={formData.country}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`input-field ${errors.country && touched.country ? 'border-red-500' : ''}`}
            placeholder="Enter country"
          />
          {errors.country && touched.country && (
            <p className="text-xs text-red-500 mt-1">{errors.country}</p>
          )}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="input-field"
            rows={2}
            placeholder="Additional notes"
          />
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1" disabled={loading}>
          Cancel
        </button>
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
      <h3 className="font-semibold text-gray-900 mb-2">Delete Firm</h3>
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

// Firm View Modal - Display all firm details
function CustomerViewModal({ customer, onClose }) {
  if (!customer) return null

  const documentTypes = [
    { key: 'panCard', label: 'PAN Card' },
    { key: 'aadharCard', label: 'Aadhar Card' },
    { key: 'shopAct', label: 'Shop Act' },
    { key: 'msme', label: 'MSME Certificate' },
    { key: 'gstCertificate', label: 'GST Certificate' },
    { key: 'other', label: 'Other Documents' }
  ]

  // Get full URL for uploads
  // In development: Vite proxy handles /uploads -> localhost:3000/uploads
  // In production: /uploads goes to the production server
  const getFileUrl = (url) => {
    if (!url) return null
    // If already a full URL, return as is
    if (url.startsWith('http')) return url
    // Ensure path starts with /uploads
    return url.startsWith('/') ? url : `/${url}`
  }

  const DetailSection = ({ title, children }) => (
    <div className="mb-4">
      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</h4>
      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
        {children}
      </div>
    </div>
  )

  const DetailRow = ({ label, value, icon: Icon }) => (
    <div className="flex items-start gap-2">
      {Icon && <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <span className="text-xs text-gray-500">{label}</span>
        <p className="text-sm text-gray-900 break-words">{value || '-'}</p>
      </div>
    </div>
  )

  const WhatsAppBadge = ({ isWhatsApp }) => isWhatsApp ? (
    <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full ml-2 whitespace-nowrap">
      WhatsApp
    </span>
  ) : null

  const StatusBadge = ({ status }) => {
    const statusColors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      blocked: 'bg-red-100 text-red-800'
    }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status || 'active'}
      </span>
    )
  }

  return (
    <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
      {/* Header with Photos */}
      <div className="flex items-start gap-4 pb-4 border-b border-gray-100">
        {/* Photos */}
        <div className="flex gap-2">
          {customer.firmPhoto ? (
            <div className="relative group">
              <img
                src={getFileUrl(customer.firmPhoto)}
                alt="Shop"
                className="w-16 h-16 rounded-lg object-cover border border-gray-200 cursor-pointer hover:border-blue-400"
                onClick={() => window.open(getFileUrl(customer.firmPhoto), '_blank')}
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center transition-opacity">
                <Eye className="w-5 h-5 text-white" />
              </div>
            </div>
          ) : (
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building className="w-8 h-8 text-blue-600" />
            </div>
          )}
          {customer.customerPhoto ? (
            <div className="relative group">
              <img
                src={getFileUrl(customer.customerPhoto)}
                alt="Contact"
                className="w-16 h-16 rounded-lg object-cover border border-gray-200 cursor-pointer hover:border-blue-400"
                onClick={() => window.open(getFileUrl(customer.customerPhoto), '_blank')}
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center transition-opacity">
                <Eye className="w-5 h-5 text-white" />
              </div>
            </div>
          ) : (
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
              <UserCircle className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Name & Status */}
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-900">{customer.firmName || customer.name}</h3>
          {customer.firmName && <p className="text-sm text-gray-500">{customer.name}</p>}
          {customer.designation && <p className="text-xs text-gray-400">{customer.designation}</p>}
          <div className="flex gap-2 mt-2">
            <StatusBadge status={customer.customerStatus} />
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {customer.customerType || 'customer'}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              {customer.priceListCategory || 'T1'}
            </span>
          </div>
        </div>
      </div>

      {/* Personal Details */}
      <DetailSection title="Personal Details">
        <div className="grid grid-cols-2 gap-4">
          <DetailRow label="Software ID" value={customer.softwareId} />
          <DetailRow label="Firm Name" value={customer.firmName} />
          <DetailRow label="Contact Name" value={customer.name} />
          <DetailRow label="Designation" value={customer.designation} />
        </div>
      </DetailSection>

      {/* Contact Numbers */}
      <DetailSection title="Contact Numbers">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              <div>
                <span className="text-xs text-gray-500">Mobile 1</span>
                <p className="text-sm text-gray-900">{customer.mobile || '-'}</p>
              </div>
            </div>
            <WhatsAppBadge isWhatsApp={customer.isWhatsApp} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              <div>
                <span className="text-xs text-gray-500">Mobile 2</span>
                <p className="text-sm text-gray-900">{customer.mobile2 || '-'}</p>
              </div>
            </div>
            <WhatsAppBadge isWhatsApp={customer.mobile2Whatsapp} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              <div>
                <span className="text-xs text-gray-500">Mobile 3</span>
                <p className="text-sm text-gray-900">{customer.mobile3 || '-'}</p>
              </div>
            </div>
            <WhatsAppBadge isWhatsApp={customer.mobile3Whatsapp} />
          </div>

          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-400" />
            <div>
              <span className="text-xs text-gray-500">Email</span>
              <p className="text-sm text-gray-900">{customer.email || '-'}</p>
            </div>
          </div>
        </div>
      </DetailSection>

      {/* Contact Persons */}
      {customer.contactPersons && customer.contactPersons.length > 0 && (
        <DetailSection title="Contact Persons">
          <div className="space-y-3">
            {customer.contactPersons.map((contact, index) => (
              <div key={contact._id || index} className={`p-3 rounded-lg ${contact.isPrimary ? 'bg-blue-50 border border-blue-200' : 'bg-white border border-gray-200'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{contact.name}</p>
                      {contact.isPrimary && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500 text-white">
                          Primary
                        </span>
                      )}
                    </div>
                    {contact.designation && (
                      <p className="text-xs text-gray-500">{contact.designation}</p>
                    )}
                    {contact.mobile && (
                      <div className="flex items-center gap-2 mt-1">
                        <Phone className="w-3 h-3 text-gray-400" />
                        <a href={`tel:${contact.mobile}`} className="text-sm text-gray-600 hover:text-blue-600">
                          {contact.mobile}
                        </a>
                        {contact.isWhatsApp && (
                          <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded">WhatsApp</span>
                        )}
                      </div>
                    )}
                    {contact.email && (
                      <p className="text-xs text-gray-500 mt-1">{contact.email}</p>
                    )}
                  </div>
                  {contact.mobile && (
                    <div className="flex gap-1">
                      <a
                        href={`https://wa.me/${contact.mobile.replace(/[\s+-]/g, '').replace(/^0+/, '91')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-green-500 hover:bg-green-600 transition-colors"
                        title="WhatsApp"
                      >
                        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.298-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.558 9.558 0 01-4.877-1.352l-.349-.21-3.615.947.964-3.52-.226-.357a9.57 9.57 0 01-1.467-5.109c0-5.281 4.303-9.572 9.594-9.572 2.577 0 5.001 1.006 6.821 2.836a9.556 9.556 0 012.806 6.821c-.002 5.281-4.306 9.572-9.594 9.572M21.884 6.5c-2.485-2.485-5.787-3.854-9.304-3.854-7.262 0-13.163 5.901-13.166 13.162 0 2.321.605 4.583 1.755 6.573L.268 24l3.502-.92a13.157 13.157 0 006.291 1.602h.005c7.26 0 13.162-5.901 13.165-13.163 0-3.515-1.37-6.831-3.855-9.318"/>
                        </svg>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DetailSection>
      )}

      {/* Address */}
      <DetailSection title="Address">
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-900">{customer.address || '-'}</p>
              {customer.landmark && <p className="text-xs text-gray-500">Landmark: {customer.landmark}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pl-6">
            <DetailRow label="City" value={customer.city} />
            <DetailRow label="State" value={customer.state} />
          </div>
          <div className="grid grid-cols-2 gap-4 pl-6">
            <DetailRow label="Pincode" value={customer.pincode} />
            <DetailRow label="Country" value={customer.country || 'India'} />
          </div>
          {customer.googleLocation && (
            <a href={customer.googleLocation} target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm mt-2">
              <Globe className="w-4 h-4" />
              View on Google Maps
            </a>
          )}
        </div>
      </DetailSection>

      {/* Documents */}
      <DetailSection title="Documents">
        {customer.documents && customer.documents.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {customer.documents.map((doc, index) => (
              <a
                key={index}
                href={getFileUrl(doc.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <FileText className="w-5 h-5 text-blue-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">{documentTypes.find(d => d.key === doc.type)?.label || doc.type}</p>
                  <p className="text-sm text-gray-900 truncate">{doc.name || 'View File'}</p>
                </div>
                <Eye className="w-4 h-4 text-gray-400" />
              </a>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No documents uploaded</p>
        )}
      </DetailSection>

      {/* Business Details */}
      <DetailSection title="Business Details">
        <div className="grid grid-cols-2 gap-4">
          <DetailRow label="GSTIN" value={customer.gstin} />
          <DetailRow label="PAN Number" value={customer.panNumber} />
          <DetailRow label="Aadhar Number" value={customer.aadharNumber} />
          <DetailRow label="Shop Act" value={customer.shopActNumber} />
          <DetailRow label="MSME Number" value={customer.msmeNumber} />
        </div>
      </DetailSection>

      {/* Management */}
      <DetailSection title="Management">
        <div className="grid grid-cols-2 gap-4">
          <DetailRow label="Account Manager" value={customer.accountManager} icon={User} />
          <DetailRow label="Product Manager" value={customer.productManager} icon={User} />
          <DetailRow label="Lead Source" value={customer.leadSource} />
          <DetailRow label="Notes" value={customer.notes} />
        </div>
      </DetailSection>

      {/* Sync Status */}
      {(customer.accountgstId || customer.syncStatus || customer.outstanding) && (
        <DetailSection title="System Info">
          <div className="grid grid-cols-2 gap-4">
            {customer.accountgstId && (
              <DetailRow label="AccountGST ID" value={customer.accountgstId} />
            )}
            {customer.outstanding !== undefined && (
              <DetailRow label="Outstanding" value={`₹${customer.outstanding?.toLocaleString() || 0}`} />
            )}
            {customer.syncStatus && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Sync Status:</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  customer.syncStatus === 'synced' ? 'bg-green-100 text-green-800' :
                  customer.syncStatus === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {customer.syncStatus}
                </span>
              </div>
            )}
            {customer.lastSyncedAt && (
              <DetailRow label="Last Synced" value={new Date(customer.lastSyncedAt).toLocaleString()} />
            )}
          </div>
        </DetailSection>
      )}

      {/* Timestamps */}
      <div className="pt-3 border-t border-gray-100 text-xs text-gray-400 flex justify-between">
        <span>Created: {new Date(customer.createdAt).toLocaleString()}</span>
        <span>Updated: {new Date(customer.updatedAt).toLocaleString()}</span>
      </div>

      {/* Close Button */}
      <div className="pt-3">
        <button onClick={onClose} className="btn-secondary w-full">Close</button>
      </div>
    </div>
  )
}

export default function Firms() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const [businessCategories, setBusinessCategories] = useState([])
  const [brandCategories, setBrandCategories] = useState([])

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
            total: response.pagination.totalItems || response.pagination.total || 0,
            totalPages: response.pagination.totalPages || 1,
            limit: response.pagination.itemsPerPage || response.pagination.limit || 10,
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

  const fetchCategories = async () => {
    try {
      const [businessRes, brandRes] = await Promise.all([
        getBusinessCategories({ limit: 100 }),
        getBrandCategoryList({ limit: 100 })
      ])
      if (businessRes.success !== false) {
        setBusinessCategories(businessRes.data || [])
      }
      if (brandRes.success !== false) {
        setBrandCategories(brandRes.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    }
  }

  useEffect(() => {
    fetchCustomers(1)
    fetchCategories()
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
          <h1 className="text-2xl font-bold text-gray-900">Firms</h1>
          <p className="text-gray-500 mt-1">Manage your firm database</p>
        </div>
        <button onClick={() => { setSelectedCustomer(null); setShowModal(true) }} className="btn-primary flex items-center gap-2 whitespace-nowrap">
          <Plus className="w-5 h-5" />
          Add Firm
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Search firms..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Firm</th>
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
                    <p className="text-gray-500">No firms found</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{customer.firmName || customer.name}</p>
                        {customer.firmName && <p className="text-sm text-gray-500">{customer.name}</p>}
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
                        <button onClick={() => { setSelectedCustomer(customer); setShowViewModal(true) }}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors" title="View Details">
                          <Eye className="w-4 h-4 text-blue-500" />
                        </button>
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
        title={selectedCustomer ? 'Edit Firm' : 'Add Firm'} size="xl">
        <CustomerForm customer={selectedCustomer} onSubmit={selectedCustomer ? handleUpdate : handleCreate}
          onCancel={() => { setShowModal(false); setSelectedCustomer(null) }} loading={formLoading}
          businessCategories={businessCategories} brandCategories={brandCategories} />
      </Modal>

      <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setSelectedCustomer(null) }} title="Delete Firm">
        <DeleteModal customer={selectedCustomer} onConfirm={handleDelete}
          onCancel={() => { setShowDeleteModal(false); setSelectedCustomer(null) }} loading={formLoading} />
      </Modal>

      <Modal isOpen={showViewModal} onClose={() => { setShowViewModal(false); setSelectedCustomer(null) }} title="Firm Details" size="xl">
        <CustomerViewModal customer={selectedCustomer} onClose={() => { setShowViewModal(false); setSelectedCustomer(null) }} />
      </Modal>
    </div>
  )
}