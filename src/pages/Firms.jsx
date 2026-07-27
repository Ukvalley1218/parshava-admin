


import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  Plus, Search, Edit2, Trash2, X, Loader, AlertCircle, Eye,
  UserCircle, Mail, Phone, MapPin, Building, Globe, FileText, Tag, User, Upload, Users, Camera
} from 'lucide-react'
import { getAdminCustomers, getAdminCustomerById, createAdminCustomer, updateAdminCustomer, deleteAdminCustomer, bulkUpdateCustomers, uploadFile, getBusinessCategories, getBrandCategoryList, getCustomerContacts, createContact, updateContact, deleteContact, getContactDesignations, uploadImage, getSalesUsers } from '../services/adminApi'
import Pagination from '../components/Pagination'
import { INDIAN_STATES, getCitiesForState } from '../data/indianStatesCities'
import Modal from '../components/Modal'
import { useToast } from '../components/Toast'

// Default designation options for contacts
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

// Contact Mini Form for adding/editing contacts within account form
function ContactMiniForm({ contact, onSave, onCancel, customerId, designations = [] }) {
  const toast = useToast()
  const [formData, setFormData] = useState({
    firstName: contact?.firstName || '',
    middleName: contact?.middleName || '',
    lastName: contact?.lastName || '',
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
    photo: contact?.photo || '',
    aadharCard: contact?.aadharCard || '',
    panCard: contact?.panCard || '',
    notes: contact?.notes || '',
    isPrimary: contact?.isPrimary || false,
    status: contact?.status || 'active'
  })
  const [showCustomDesignation, setShowCustomDesignation] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadingAadhar, setUploadingAadhar] = useState(false)
  const [uploadingPan, setUploadingPan] = useState(false)
  const fileInputRef = useRef(null)
  const aadharInputRef = useRef(null)
  const panInputRef = useRef(null)

  useEffect(() => {
    // Check if current designation is a custom one (not in default list)
    if (formData.designation && !DEFAULT_DESIGNATIONS.includes(formData.designation) && formData.designation !== 'Other') {
      setShowCustomDesignation(true)
    }
  }, [])

  // Reset form when contact prop changes (for editing)
  useEffect(() => {
    if (contact) {
      const isCustomDesignation = contact.designation && !DEFAULT_DESIGNATIONS.includes(contact.designation)
      setFormData({
        firstName: contact.firstName || '',
        middleName: contact.middleName || '',
        lastName: contact.lastName || '',
        designation: contact.designation || '',
        customDesignation: isCustomDesignation ? contact.designation : '',
        landmark: contact.landmark || '',
        city: contact.city || '',
        mobile1: contact.mobile1 || '',
        mobile1WhatsApp: contact.mobile1WhatsApp || false,
        mobile2: contact.mobile2 || '',
        mobile2WhatsApp: contact.mobile2WhatsApp || false,
        mobile3: contact.mobile3 || '',
        mobile3WhatsApp: contact.mobile3WhatsApp || false,
        email: contact.email || '',
        photo: contact.photo || '',
        aadharCard: contact.aadharCard || '',
        panCard: contact.panCard || '',
        notes: contact.notes || '',
        isPrimary: contact.isPrimary || false,
        status: contact.status || 'active'
      })
      setShowCustomDesignation(isCustomDesignation)
    }
  }, [contact])

  const allDesignations = [...new Set([...DEFAULT_DESIGNATIONS, ...designations])]

  // Photo upload handler
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB')
      return
    }

    setUploading(true)
    try {
      const response = await uploadImage(file, 'contactPhoto')
      if (response.success && response.data?.url) {
        setFormData(prev => ({ ...prev, photo: response.data.url }))
        toast.success('Photo uploaded successfully')
      } else {
        toast.error(response.message || 'Failed to upload photo')
      }
    } catch (err) {
      toast.error('Failed to upload photo')
    } finally {
      setUploading(false)
    }
  }

  // Aadhar upload handler
  const handleAadharUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('Please select an image or PDF file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size should be less than 5MB')
      return
    }

    setUploadingAadhar(true)
    try {
      const response = await uploadImage(file, 'contactAadharCard')
      if (response.success && response.data?.url) {
        setFormData(prev => ({ ...prev, aadharCard: response.data.url }))
        toast.success('Document uploaded successfully')
      } else {
        toast.error(response.message || 'Failed to upload Aadhar card')
      }
    } catch (err) {
      toast.error('Failed to upload Aadhar card')
    } finally {
      setUploadingAadhar(false)
    }
  }

  // PAN upload handler
  const handlePanUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('Please select an image or PDF file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size should be less than 5MB')
      return
    }

    setUploadingPan(true)
    try {
      const response = await uploadImage(file, 'contactPanCard')
      if (response.success && response.data?.url) {
        setFormData(prev => ({ ...prev, panCard: response.data.url }))
        toast.success('Document uploaded successfully')
      } else {
        toast.error(response.message || 'Failed to upload PAN card')
      }
    } catch (err) {
      toast.error('Failed to upload PAN card')
    } finally {
      setUploadingPan(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const fullName = [formData.firstName, formData.middleName, formData.lastName].filter(Boolean).join(' ')
    if (!formData.firstName && !fullName) {
      toast.error('First name is required')
      return
    }
    onSave({
      ...formData,
      name: fullName,
      customer: customerId,
      customers: [customerId] // Also set customers array for multi-firm support
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Photo Upload */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Photo</label>
        <div className="flex items-center gap-3">
          <div className="relative">
            {formData.photo ? (
              <img
                src={formData.photo}
                alt="Contact"
                className="w-14 h-14 rounded-lg object-cover border border-gray-200"
              />
            ) : (
              <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                <User className="w-6 h-6 text-gray-400" />
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-600 transition-colors"
              disabled={uploading}
            >
              <Camera className="w-3 h-3" />
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
              className="text-xs text-blue-600 hover:text-blue-700"
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload Photo'}
            </button>
            <p className="text-[10px] text-gray-400">Max 5MB, JPG/PNG</p>
          </div>
        </div>
      </div>

      {/* Name Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">First Name *</label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="First"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Middle</label>
          <input
            type="text"
            value={formData.middleName}
            onChange={(e) => setFormData(prev => ({ ...prev, middleName: e.target.value }))}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Middle"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Last</label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Last"
          />
        </div>
      </div>

      {/* Designation */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Designation</label>
        <select
          value={showCustomDesignation ? 'Other' : formData.designation}
          onChange={(e) => {
            const value = e.target.value
            if (value === 'Other') {
              setShowCustomDesignation(true)
              setFormData(prev => ({ ...prev, designation: '', customDesignation: '' }))
            } else {
              setShowCustomDesignation(false)
              setFormData(prev => ({ ...prev, designation: value, customDesignation: '' }))
            }
          }}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Select</option>
          {allDesignations.map(d => <option key={d} value={d}>{d}</option>)}
          <option value="Other">Other...</option>
        </select>
        {showCustomDesignation && (
          <input
            type="text"
            value={formData.customDesignation}
            onChange={(e) => {
              setFormData(prev => ({
                ...prev,
                customDesignation: e.target.value,
                designation: e.target.value
              }))
            }}
            className="w-full mt-1 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Enter designation"
          />
        )}
      </div>

      {/* Landmark & City */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Landmark</label>
          <input
            type="text"
            value={formData.landmark}
            onChange={(e) => setFormData(prev => ({ ...prev, landmark: e.target.value }))}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Landmark"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="City"
          />
        </div>
      </div>

      {/* Mobile Numbers */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-600">Mobile Numbers</label>
        {[1, 2, 3].map(num => (
          <div key={num} className="flex items-center gap-2">
            <div className="flex-1">
              <div className="flex">
                <span className="inline-flex items-center px-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-600 text-xs">
                  +91
                </span>
                <input
                  type="tel"
                  value={formData[`mobile${num}`]}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    [`mobile${num}`]: e.target.value.replace(/\D/g, '').slice(0, 10)
                  }))}
                  className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-r-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder={`Mobile ${num}`}
                  maxLength={10}
                />
              </div>
            </div>
            <label className="flex items-center gap-1 whitespace-nowrap">
              <input
                type="checkbox"
                checked={formData[`mobile${num}WhatsApp`]}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  [`mobile${num}WhatsApp`]: e.target.checked
                }))}
                className="w-3 h-3 text-green-600 rounded"
              />
              <span className="text-xs text-green-600">WA</span>
            </label>
          </div>
        ))}
      </div>

      {/* Email */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="email@example.com"
        />
      </div>

      {/* Aadhar & PAN Card Uploads */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Aadhar Card</label>
          <div className="flex items-center gap-2">
            {formData.aadharCard && (
              <a
                href={formData.aadharCard}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-blue-600 hover:underline flex items-center gap-1"
              >
                <FileText className="w-3 h-3" />
                View
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
              <span className={`text-[10px] px-2 py-1 rounded border ${uploadingAadhar ? 'text-gray-400 border-gray-300' : 'text-blue-600 border-blue-600 hover:bg-blue-50'}`}>
                {uploadingAadhar ? 'Uploading...' : formData.aadharCard ? 'Change' : 'Upload'}
              </span>
            </label>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">PAN Card</label>
          <div className="flex items-center gap-2">
            {formData.panCard && (
              <a
                href={formData.panCard}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-blue-600 hover:underline flex items-center gap-1"
              >
                <FileText className="w-3 h-3" />
                View
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
              <span className={`text-[10px] px-2 py-1 rounded border ${uploadingPan ? 'text-gray-400 border-gray-300' : 'text-blue-600 border-blue-600 hover:bg-blue-50'}`}>
                {uploadingPan ? 'Uploading...' : formData.panCard ? 'Change' : 'Upload'}
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Internal notes"
          rows={2}
        />
      </div>

      {/* Status & Primary Contact */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
            className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <label className="flex items-center gap-2 cursor-pointer self-end">
          <input
            type="checkbox"
            checked={formData.isPrimary}
            onChange={(e) => setFormData(prev => ({ ...prev, isPrimary: e.target.checked }))}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <span className="text-sm text-gray-700">Primary Contact</span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
          Cancel
        </button>
        <button type="submit" className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          {contact ? 'Update' : 'Add'} Contact
        </button>
      </div>
    </form>
  )
}

// Account Form Component
function CustomerForm({ customer, onSubmit, onCancel, loading, businessCategories, brandCategories }) {
  const toast = useToast()
  const [formData, setFormData] = useState({
    // Personal Details
    softwareId: customer?.softwareId || '',
    name: customer?.name || '',
    firmName: customer?.firmName || customer?.name || '',
    firmPhoto: customer?.firmPhoto || '',
    firmPhotoName: customer?.firmPhoto?.split('/').pop() || '',

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
    shopActNumber: customer?.shopActNumber || '',
    msmeNumber: customer?.msmeNumber || '',

    // Documents
    documents: customer?.documents || [],

    // Categories (multiple selection) - extract _id from populated objects
    businessCategory: customer?.businessCategory
      ? customer.businessCategory.map(cat => typeof cat === 'object' ? cat._id : cat)
      : [],
    brandCategory: customer?.brandCategory
      ? customer.brandCategory.map(cat => typeof cat === 'object' ? cat._id : cat)
      : [],

    // Management
    priceListCategory: customer?.priceListCategory || 'T1',
    accountManager: customer?.accountManager
      ? (Array.isArray(customer.accountManager)
        ? customer.accountManager.map(m => m._id || m)
        : [customer.accountManager._id || customer.accountManager])
      : [],

    // Status
    customerType: customer?.customerType || 'customer',
    accountType: customer?.accountType || 'in_house',
    customerStatus: customer?.customerStatus || 'active',
    notes: customer?.notes || ''
  })

  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  // Dropdown state for multi-select
  const [showBusinessDropdown, setShowBusinessDropdown] = useState(false)
  const [showBrandDropdown, setShowBrandDropdown] = useState(false)
  const [showManagerDropdown, setShowManagerDropdown] = useState(false)
  const [accountManagers, setAccountManagers] = useState([])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showBusinessDropdown && !event.target.closest('.business-dropdown-container')) {
        setShowBusinessDropdown(false)
      }
      if (showBrandDropdown && !event.target.closest('.brand-dropdown-container')) {
        setShowBrandDropdown(false)
      }
      if (showManagerDropdown && !event.target.closest('.manager-dropdown-container')) {
        setShowManagerDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showBusinessDropdown, showBrandDropdown, showManagerDropdown])

  // Contacts state
  const [contacts, setContacts] = useState([])
  const [designations, setDesignations] = useState([])
  const [showContactForm, setShowContactForm] = useState(false)
  const [editingContact, setEditingContact] = useState(null)
  const [loadingContacts, setLoadingContacts] = useState(false)

  // Load contacts when editing
  useEffect(() => {
    if (customer?._id) {
      loadContacts(customer._id)
    }
  }, [customer?._id])

  // Load designations
  useEffect(() => {
    loadDesignations()
  }, [])

  // Load account managers
  useEffect(() => {
    const fetchAccountManagers = async () => {
      try {
        const response = await getSalesUsers({ role: 'account_manager', limit: 100 })
        if (response?.data?.users) {
          setAccountManagers(response.data.users)
        } else if (Array.isArray(response?.data)) {
          setAccountManagers(response.data)
        }
      } catch (error) {
        console.error('Error loading account managers:', error)
      }
    }
    fetchAccountManagers()
  }, [])

  const loadContacts = async (customerId) => {
    try {
      setLoadingContacts(true)
      const response = await getCustomerContacts(customerId)
      if (response.success && response.data) {
        setContacts(response.data)
      }
    } catch (error) {
      console.error('Error loading contacts:', error)
    } finally {
      setLoadingContacts(false)
    }
  }

  const loadDesignations = async () => {
    try {
      const response = await getContactDesignations()
      if (response.success && response.data) {
        setDesignations(response.data)
      }
    } catch (error) {
      console.error('Error loading designations:', error)
    }
  }

  const handleAddContact = () => {
    setEditingContact(null)
    setShowContactForm(true)
  }

  const handleEditContact = (contact) => {
    setEditingContact(contact)
    setShowContactForm(true)
  }

  const handleDeleteContact = async (contactId) => {
    if (!confirm('Are you sure you want to delete this contact?')) return
    try {
      await deleteContact(contactId)
      setContacts(contacts.filter(c => c._id !== contactId))
      toast.success('Contact deleted successfully')
    } catch (error) {
      console.error('Error deleting contact:', error)
      toast.error('Failed to delete contact')
    }
  }

  const handleSaveContact = async (contactData) => {
    try {
      let response
      if (editingContact?._id) {
        response = await updateContact(editingContact._id, contactData)
      } else {
        // For new contacts, we need the customer ID
        if (customer?._id) {
          response = await createContact({
            ...contactData,
            customer: customer._id,
            customers: [customer._id]
          })
        } else {
          // For new accounts, store temporarily
          const tempId = 'temp_' + Date.now()
          setContacts(prev => [...prev, { ...contactData, _id: tempId, isNew: true }])
          setShowContactForm(false)
          setEditingContact(null)
          return
        }
      }

      if (response.success) {
        // Refresh contacts
        if (customer?._id) {
          await loadContacts(customer._id)
        }
        setShowContactForm(false)
        setEditingContact(null)
        toast.success('Contact saved successfully')
      } else {
        toast.error(response.message || 'Failed to save contact')
      }
    } catch (error) {
      console.error('Error saving contact:', error)
      toast.error('Failed to save contact')
    }
  }

  // Get contacts to submit with account
  const getContactsToSubmit = () => {
    return contacts.filter(c => c.isNew || c._id?.toString().startsWith('temp_'))
  }

  // Document types for upload
  const documentTypes = [
    { key: 'panCard', label: 'PAN Card' },
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
        if (!value?.trim()) return 'Account name is required'
        if (value.length > 150) return 'Account name must be less than 150 characters'
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
      required: false,
      validate: () => null
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
          toast.success('File uploaded successfully')
          setFormData((prev) => ({
            ...prev,
            [field]: response.data.url,
            [`${field}Name`]: file.name
          }))
        } else {
          toast.error(response.message || 'Failed to upload file')
        }
      } catch (error) {
        console.error('Upload error:', error)
        toast.error('Failed to upload file')
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
          toast.error(response.message || 'Failed to upload document')
        }
      } catch (error) {
        console.error('Upload error:', error)
        toast.error('Failed to upload document')
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

    // Pass formData and new contacts to parent
    onSubmit(formData, contacts.filter(c => c.isNew || c._id?.toString().startsWith('temp_')))
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
              Account Name <span className="text-red-500">*</span>
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
                  placeholder="Enter account name"
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
        </div>

        {/* Contact Persons Section */}
        <div className="mt-4 border border-gray-200 rounded-lg p-3 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Contact Persons</span>
            </div>
            <button
              type="button"
              onClick={handleAddContact}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-3 h-3" />
              Add Contact
            </button>
          </div>

          {/* Existing Contacts List */}
          {loadingContacts ? (
            <div className="flex items-center justify-center py-4">
              <Loader className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : contacts.length > 0 ? (
            <div className="space-y-2">
              {contacts.map((contact, index) => {
                const contactName = [contact.firstName, contact.middleName, contact.lastName].filter(Boolean).join(' ') || contact.name
                return (
                  <div key={contact._id || index} className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-start gap-2">
                      {/* Photo */}
                      <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden bg-[#1F3A5F] flex items-center justify-center">
                        {contact.photo ? (
                          <img src={contact.photo} alt={contactName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white font-medium text-xs">{contactName?.charAt(0)?.toUpperCase() || 'C'}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900 text-sm">{contactName}</span>
                          {contact.isPrimary && (
                            <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">Primary</span>
                          )}
                          {contact.status === 'inactive' && (
                            <span className="px-1.5 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">Inactive</span>
                          )}
                          {contact.designation && (
                            <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">{contact.designation}</span>
                          )}
                        </div>
                        <div className="mt-1 text-xs text-gray-500 space-y-0.5">
                          {contact.mobile1 && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              <span>+91 {contact.mobile1}</span>
                              {contact.mobile1WhatsApp && <span className="text-green-600">(WhatsApp)</span>}
                            </div>
                          )}
                          {contact.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              <span>{contact.email}</span>
                            </div>
                          )}
                          {(contact.city || contact.landmark) && (
                            <div className="text-gray-400">
                              {[contact.landmark, contact.city].filter(Boolean).join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleEditContact(contact)}
                          className="p-1 text-gray-400 hover:text-blue-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteContact(contact._id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {/* Show default contact from form mobile numbers if no contact persons */}
              {formData.mobile ? (
                <div className="rounded-lg p-3 border border-blue-200 bg-blue-50">
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden bg-[#1F3A5F] flex items-center justify-center">
                      <span className="text-white font-medium text-xs">{(formData.name || formData.firmName)?.charAt(0)?.toUpperCase() || 'C'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900 text-sm">{formData.name || formData.firmName || 'Primary Contact'}</span>
                        <span className="px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded">Primary</span>
                      </div>
                      <div className="mt-1 text-xs text-gray-500 space-y-0.5">
                        {formData.mobile && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>+91 {formData.mobile}</span>
                            {formData.isWhatsApp && <span className="text-green-600">(WhatsApp)</span>}
                          </div>
                        )}
                        {formData.mobile2 && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>+91 {formData.mobile2}</span>
                            {formData.mobile2Whatsapp && <span className="text-green-600">(WhatsApp)</span>}
                          </div>
                        )}
                        {formData.mobile3 && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>+91 {formData.mobile3}</span>
                            {formData.mobile3Whatsapp && <span className="text-green-600">(WhatsApp)</span>}
                          </div>
                        )}
                        {formData.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            <span>{formData.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No contacts added yet. Click "Add Contact" to add one.
                </div>
              )}
            </div>
          )}

          {/* Contact Form Modal - Rendered using Portal to escape parent modal */}
          {showContactForm && createPortal(
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => { setShowContactForm(false); setEditingContact(null); }}>
              <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b">
                  <h4 className="font-medium text-gray-900">
                    {editingContact ? 'Edit Contact' : 'Add Contact'}
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setShowContactForm(false)
                      setEditingContact(null)
                    }}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <div className="p-4">
                  <ContactMiniForm
                    contact={editingContact}
                    onSave={handleSaveContact}
                    onCancel={() => {
                      setShowContactForm(false)
                      setEditingContact(null)
                    }}
                    customerId={customer?._id}
                    designations={designations}
                  />
                </div>
              </div>
            </div>,
            document.body
          )}
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
              State <span className="text-red-500">*</span>
            </label>
            <select
              name="state"
              value={formData.state}
              onChange={(e) => {
                const value = e.target.value
                setFormData(prev => ({ ...prev, state: value, city: '' }))
                setTouched(prev => ({ ...prev, state: true }))
              }}
              onBlur={handleBlur}
              className={`input-field ${errors.state && touched.state ? 'border-red-500' : ''}`}
            >
              <option value="">Select State</option>
              {INDIAN_STATES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {errors.state && touched.state && (
              <p className="text-xs text-red-500 mt-1">{errors.state}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City <span className="text-red-500">*</span>
            </label>
            {formData.state && getCitiesForState(formData.state).length > 0 ? (
              <select
                name="city"
                value={formData.city}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, city: e.target.value }))
                  setTouched(prev => ({ ...prev, city: true }))
                }}
                onBlur={handleBlur}
                className={`input-field ${errors.city && touched.city ? 'border-red-500' : ''}`}
              >
                <option value="">Select City</option>
                {getCitiesForState(formData.state).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`input-field ${errors.city && touched.city ? 'border-red-500' : ''}`}
                placeholder={formData.state ? 'Enter city name' : 'Select state first'}
              />
            )}
            {errors.city && touched.city && (
              <p className="text-xs text-red-500 mt-1">{errors.city}</p>
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
            <div className="relative business-dropdown-container">
              <div
                className="input-field min-h-[38px] cursor-pointer flex flex-wrap gap-1 items-center"
                onClick={() => setShowBusinessDropdown(!showBusinessDropdown)}
              >
                {formData.businessCategory?.length > 0 ? (
                  formData.businessCategory.map(catId => {
                    const cat = businessCategories?.find(c => c._id === catId)
                    return (
                      <span
                        key={catId}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {cat?.name || catId}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setFormData(prev => ({
                              ...prev,
                              businessCategory: prev.businessCategory.filter(id => id !== catId)
                            }))
                          }}
                          className="hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )
                  })
                ) : (
                  <span className="text-gray-400">Select Business Categories</span>
                )}
              </div>
              {showBusinessDropdown && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {businessCategories?.map((cat) => (
                    <label
                      key={cat._id}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.businessCategory?.includes(cat._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              businessCategory: [...(prev.businessCategory || []), cat._id]
                            }))
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              businessCategory: prev.businessCategory.filter(id => id !== cat._id)
                            }))
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm">{cat.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand Category <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <div className="relative brand-dropdown-container">
              <div
                className="input-field min-h-[38px] cursor-pointer flex flex-wrap gap-1 items-center"
                onClick={() => setShowBrandDropdown(!showBrandDropdown)}
              >
                {formData.brandCategory?.length > 0 ? (
                  formData.brandCategory.map(catId => {
                    const cat = brandCategories?.find(c => c._id === catId)
                    return (
                      <span
                        key={catId}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {cat?.name || catId}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setFormData(prev => ({
                              ...prev,
                              brandCategory: prev.brandCategory.filter(id => id !== catId)
                            }))
                          }}
                          className="hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )
                  })
                ) : (
                  <span className="text-gray-400">Select Brand Categories</span>
                )}
              </div>
              {showBrandDropdown && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {brandCategories?.map((cat) => (
                    <label
                      key={cat._id}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.brandCategory?.includes(cat._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              brandCategory: [...(prev.brandCategory || []), cat._id]
                            }))
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              brandCategory: prev.brandCategory.filter(id => id !== cat._id)
                            }))
                          }
                        }}
                        className="w-4 h-4 text-green-600 rounded"
                      />
                      <span className="text-sm">{cat.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
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
              <option value="C1">C1</option>
              <option value="SI1">SI1</option>
              <option value="SI2">SI2</option>
              <option value="T1">T1</option>
              <option value="T2">T2</option>
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
              <option value="system integrator">System Integrator</option>
              <option value="reseller">Reseller</option>
            </select>
            {errors.customerType && touched.customerType && (
              <p className="text-xs text-red-500 mt-1">{errors.customerType}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Type
            </label>
            <select
              name="accountType"
              value={formData.accountType}
              onChange={handleChange}
              className="input-field"
            >
              <option value="in_house">In House</option>
              <option value="shop">Shop</option>
            </select>
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
              Account Manager
            </label>
            <div className="relative manager-dropdown-container">
              <div
                className="input-field min-h-[38px] cursor-pointer flex flex-wrap gap-1 items-center"
                onClick={() => setShowManagerDropdown(!showManagerDropdown)}
              >
                {formData.accountManager?.length > 0 ? (
                  formData.accountManager.map(managerId => {
                    const manager = accountManagers?.find(m => m._id === managerId)
                    return (
                      <span
                        key={managerId}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {manager?.name || managerId}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setFormData(prev => ({
                              ...prev,
                              accountManager: prev.accountManager.filter(id => id !== managerId)
                            }))
                          }}
                          className="hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )
                  })
                ) : (
                  <span className="text-gray-400">Select Account Managers</span>
                )}
              </div>
              {showManagerDropdown && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {accountManagers.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-400">No account managers found</div>
                  ) : (
                    accountManagers.map((manager) => (
                      <label
                        key={manager._id}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.accountManager?.includes(manager._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                accountManager: [...(prev.accountManager || []), manager._id]
                              }))
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                accountManager: prev.accountManager.filter(id => id !== manager._id)
                              }))
                            }
                          }}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <div>
                          <span className="text-sm font-medium">{manager.name}</span>
                          {manager.email && (
                            <span className="text-xs text-gray-400 ml-1">({manager.email})</span>
                          )}
                        </div>
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>
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
      <h3 className="font-semibold text-gray-900 mb-2">Delete Account</h3>
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

// Account View Modal - Display all account details
function CustomerViewModal({ customer, onClose }) {
  const [contacts, setContacts] = useState([])
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)
  const [editingContact, setEditingContact] = useState(null)
  const [designations, setDesignations] = useState([])

  // Fetch contacts when customer changes
  useEffect(() => {
    if (customer?._id) {
      fetchContacts(customer._id)
    }
  }, [customer?._id])

  // Load designations
  useEffect(() => {
    loadDesignations()
  }, [])

  const loadDesignations = async () => {
    try {
      const response = await getContactDesignations()
      if (response.success && response.data) {
        setDesignations(response.data)
      }
    } catch (error) {
      console.error('Error loading designations:', error)
    }
  }

  const fetchContacts = async (customerId) => {
    try {
      setLoadingContacts(true)
      const response = await getCustomerContacts(customerId)
      if (response.success && response.data) {
        setContacts(response.data)
      }
    } catch (error) {
      console.error('Error fetching contacts:', error)
    } finally {
      setLoadingContacts(false)
    }
  }

  const handleAddContact = () => {
    setEditingContact(null)
    setShowContactForm(true)
  }

  const handleEditContact = (contact) => {
    setEditingContact(contact)
    setShowContactForm(true)
  }

  const handleDeleteContact = async (contactId) => {
    if (!confirm('Are you sure you want to delete this contact?')) return
    try {
      await deleteContact(contactId)
      setContacts(contacts.filter(c => c._id !== contactId))
      toast.success('Contact deleted successfully')
    } catch (error) {
      console.error('Error deleting contact:', error)
      toast.error('Failed to delete contact')
    }
  }

  const handleSaveContact = async (contactData) => {
    try {
      let response
      if (editingContact?._id) {
        response = await updateContact(editingContact._id, contactData)
      } else {
        // For new contacts, set both customer and customers array
        response = await createContact({
          ...contactData,
          customer: customer._id,
          customers: [customer._id]
        })
      }

      if (response.success) {
        toast.success('Contact saved successfully')
        await fetchContacts(customer._id)
        setShowContactForm(false)
        setEditingContact(null)
      } else {
        toast.error(response.message || 'Failed to save contact')
      }
    } catch (error) {
      console.error('Error saving contact:', error)
      toast.error('Failed to save contact')
    }
  }

  if (!customer) return null

  const documentTypes = [
    { key: 'panCard', label: 'PAN Card' },
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
        </div>

        {/* Name & Status */}
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-900">{customer.firmName}</h3>
          <div className="flex gap-2 mt-2">
            <StatusBadge status={customer.customerStatus} />
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {(customer.customerType || 'customer').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${(customer.accountType || 'in_house') === 'in_house' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
              {(customer.accountType || 'in_house') === 'in_house' ? 'In House' : 'Shop'}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              {customer.priceListCategory || 'T1'}
            </span>
          </div>
        </div>
      </div>

      {/* Personal Details */}
      <DetailSection title="Personal Details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DetailRow label="Software ID" value={customer.softwareId} />
          <DetailRow label="Account Name" value={customer.firmName} />
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
      <DetailSection title="Contact Persons">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Contact Persons</span>
          <button
            type="button"
            onClick={handleAddContact}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
        </div>
        {loadingContacts ? (
          <div className="flex items-center justify-center py-4">
            <Loader className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : contacts.length > 0 ? (
          <div className="space-y-3">
            {contacts.map((contact, index) => {
              const contactName = [contact.firstName, contact.middleName, contact.lastName].filter(Boolean).join(' ') || contact.name
              return (
                <div key={contact._id || index} className={`p-3 rounded-lg ${contact.isPrimary ? 'bg-blue-50 border border-blue-200' : 'bg-white border border-gray-200'}`}>
                  <div className="flex items-start gap-3">
                    {/* Photo */}
                    <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden bg-[#1F3A5F] flex items-center justify-center">
                      {contact.photo ? (
                        <img src={contact.photo} alt={contactName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white font-semibold text-sm">{contactName?.charAt(0)?.toUpperCase() || 'C'}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900">{contactName}</p>
                        {contact.isPrimary && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500 text-white">
                            Primary
                          </span>
                        )}
                        {contact.status === 'inactive' && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                            Inactive
                          </span>
                        )}
                      </div>
                      {contact.designation && (
                        <p className="text-xs text-gray-500">{contact.designation}</p>
                      )}
                      {(contact.city || contact.landmark) && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {[contact.landmark, contact.city].filter(Boolean).join(', ')}
                        </p>
                      )}
                      <div className="mt-1 space-y-0.5">
                        {contact.mobile1 && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <a href={`tel:+91${contact.mobile1}`} className="text-sm text-gray-600 hover:text-blue-600">
                              +91 {contact.mobile1}
                            </a>
                            {contact.mobile1WhatsApp && (
                              <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded">WhatsApp</span>
                            )}
                          </div>
                        )}
                        {contact.mobile2 && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <a href={`tel:+91${contact.mobile2}`} className="text-sm text-gray-600 hover:text-blue-600">
                              +91 {contact.mobile2}
                            </a>
                            {contact.mobile2WhatsApp && (
                              <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded">WhatsApp</span>
                            )}
                          </div>
                        )}
                        {contact.mobile3 && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <a href={`tel:+91${contact.mobile3}`} className="text-sm text-gray-600 hover:text-blue-600">
                              +91 {contact.mobile3}
                            </a>
                            {contact.mobile3WhatsApp && (
                              <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded">WhatsApp</span>
                            )}
                          </div>
                        )}
                        {contact.email && (
                          <p className="text-xs text-gray-500">{contact.email}</p>
                        )}
                      </div>
                      {contact.notes && (
                        <p className="text-xs text-gray-400 mt-1 italic">"{contact.notes}"</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => handleEditContact(contact)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteContact(contact._id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {contact.mobile1 && (
                        <a
                          href={`https://wa.me/91${contact.mobile1}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-green-500 hover:text-green-600"
                          title="WhatsApp"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.298-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.558 9.558 0 01-4.877-1.352l-.349-.21-3.615.947.964-3.52-.226-.357a9.57 9.57 0 01-1.467-5.109c0-5.281 4.303-9.572 9.594-9.572 2.577 0 5.001 1.006 6.821 2.836a9.556 9.556 0 012.806 6.821c-.002 5.281-4.306 9.572-9.594 9.572M21.884 6.5c-2.485-2.485-5.787-3.854-9.304-3.854-7.262 0-13.163 5.901-13.166 13.162 0 2.321.605 4.583 1.755 6.573L.268 24l3.502-.92a13.157 13.157 0 006.291 1.602h.005c7.26 0 13.162-5.901 13.165-13.163 0-3.515-1.37-6.831-3.855-9.318"/>
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Show default contact from customer's mobile if no contact persons */}
            {customer.mobile ? (
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden bg-[#1F3A5F] flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">{customer.firmName?.charAt(0)?.toUpperCase() || 'C'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{customer.name || customer.firmName || 'Primary Contact'}</p>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500 text-white">
                        Primary
                      </span>
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {customer.mobile && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <a href={`tel:+91${customer.mobile}`} className="text-sm text-gray-600 hover:text-blue-600">
                            +91 {customer.mobile}
                          </a>
                          {customer.isWhatsApp && (
                            <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded">WhatsApp</span>
                          )}
                        </div>
                      )}
                      {customer.mobile2 && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <a href={`tel:+91${customer.mobile2}`} className="text-sm text-gray-600 hover:text-blue-600">
                            +91 {customer.mobile2}
                          </a>
                          {customer.mobile2Whatsapp && (
                            <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded">WhatsApp</span>
                          )}
                        </div>
                      )}
                      {customer.mobile3 && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <a href={`tel:+91${customer.mobile3}`} className="text-sm text-gray-600 hover:text-blue-600">
                            +91 {customer.mobile3}
                          </a>
                          {customer.mobile3Whatsapp && (
                            <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded">WhatsApp</span>
                          )}
                        </div>
                      )}
                      {customer.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <a href={`mailto:${customer.email}`} className="text-sm text-gray-600 hover:text-blue-600">
                            {customer.email}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  {customer.mobile && (
                    <a
                      href={`https://wa.me/91${customer.mobile}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-green-500 hover:text-green-600"
                      title="WhatsApp"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.298-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.558 9.558 0 01-4.877-1.352l-.349-.21-3.615.947.964-3.52-.226-.357a9.57 9.57 0 01-1.467-5.109c0-5.281 4.303-9.572 9.594-9.572 2.577 0 5.001 1.006 6.821 2.836a9.556 9.556 0 012.806 6.821c-.002 5.281-4.306 9.572-9.594 9.572M21.884 6.5c-2.485-2.485-5.787-3.854-9.304-3.854-7.262 0-13.163 5.901-13.166 13.162 0 2.321.605 4.583 1.755 6.573L.268 24l3.502-.92a13.157 13.157 0 006.291 1.602h.005c7.26 0 13.162-5.901 13.165-13.163 0-3.515-1.37-6.831-3.855-9.318"/>
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-2">No contact persons added</p>
            )}
          </div>
        )}
      </DetailSection>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-6">
            <DetailRow label="City" value={customer.city} />
            <DetailRow label="State" value={customer.state} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-6">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DetailRow label="GSTIN" value={customer.gstin} />
          <DetailRow label="PAN Number" value={customer.panNumber} />
          <DetailRow label="Shop Act" value={customer.shopActNumber} />
          <DetailRow label="MSME Number" value={customer.msmeNumber} />
        </div>
      </DetailSection>

      {/* Management */}
      <DetailSection title="Management">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Business Categories</p>
            <div className="flex flex-wrap gap-1">
              {customer.businessCategory?.length > 0 ? (
                customer.businessCategory.map((catId, index) => {
                  // If populated, catId will be an object with name, otherwise just an ID
                  const catName = typeof catId === 'object' ? catId.name : catId
                  return (
                    <span key={index} className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                      {catName}
                    </span>
                  )
                })
              ) : (
                <span className="text-sm text-gray-400">None</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Brand Categories</p>
            <div className="flex flex-wrap gap-1">
              {customer.brandCategory?.length > 0 ? (
                customer.brandCategory.map((catId, index) => {
                  const catName = typeof catId === 'object' ? catId.name : catId
                  return (
                    <span key={index} className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">
                      {catName}
                    </span>
                  )
                })
              ) : (
                <span className="text-sm text-gray-400">None</span>
              )}
            </div>
          </div>
          <DetailRow label="Account Manager" value={Array.isArray(customer.accountManager) ? customer.accountManager.map(m => m?.name || m).join(', ') || '-' : customer.accountManager?.name || customer.accountManager || '-'} icon={User} />
          <DetailRow label="Notes" value={customer.notes} />
        </div>
      </DetailSection>

      {/* Sync Status */}
      {(customer.accountgstId || customer.syncStatus || customer.outstanding) && (
        <DetailSection title="System Info">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      {/* Contact Form Modal */}
      {showContactForm && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => { setShowContactForm(false); setEditingContact(null); }}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h4 className="font-medium text-gray-900">
                {editingContact ? 'Edit Contact' : 'Add Contact'}
              </h4>
              <button
                type="button"
                onClick={() => {
                  setShowContactForm(false)
                  setEditingContact(null)
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4">
              <ContactMiniForm
                contact={editingContact}
                onSave={handleSaveContact}
                onCancel={() => {
                  setShowContactForm(false)
                  setEditingContact(null)
                }}
                customerId={customer?._id}
                designations={designations}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default function Firms() {
  const toast = useToast()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const [businessCategories, setBusinessCategories] = useState([])
  const [brandCategories, setBrandCategories] = useState([])
  const [accountManagers, setAccountManagers] = useState([])

  // Filter states
  const [filterCity, setFilterCity] = useState('')
  const [filterBusinessCategory, setFilterBusinessCategory] = useState('')
  const [filterPriceList, setFilterPriceList] = useState('')
  const [filterAccountManager, setFilterAccountManager] = useState('')
  const [filterBrandCategory, setFilterBrandCategory] = useState('')
  const [filterAccountType, setFilterAccountType] = useState('')

  // Bulk edit states
  const [showBulkEdit, setShowBulkEdit] = useState(false)
  const [bulkUpdating, setBulkUpdating] = useState(false)
  const [bulkValues, setBulkValues] = useState({
    businessCategory: '',
    brandCategory: '',
    priceListCategory: '',
    accountType: '',
    accountManager: []
  })
  const [savingFields, setSavingFields] = useState({})

  // Server-provided filter options (from API response)
  const [serverFilterOptions, setServerFilterOptions] = useState({
    cities: [],
    priceLists: [],
    managers: []
  })

  const hasActiveFilters = filterCity || filterBusinessCategory || filterPriceList || filterAccountManager || filterBrandCategory || filterAccountType

  const clearFilters = () => {
    setFilterCity('')
    setFilterBusinessCategory('')
    setFilterPriceList('')
    setFilterAccountManager('')
    setFilterBrandCategory('')
    setFilterAccountType('')
    setCurrentPage(1)
  }

  // Handle bulk update for a specific field — applies only to currently visible (filtered) customers
  const handleBulkUpdate = async (fieldKey) => {
    const value = bulkValues[fieldKey]
    if (!value || (Array.isArray(value) && value.length === 0)) {
      toast.error('Please select a value to apply')
      return
    }

    // Collect IDs of all currently visible (filtered) customers on this page
    const customerIds = customers.map(c => c._id)
    if (customerIds.length === 0) {
      toast.error('No accounts visible to update')
      return
    }

    const updates = {}

    if (fieldKey === 'businessCategory') {
      updates.businessCategory = Array.isArray(value) ? value : [value]
    } else if (fieldKey === 'brandCategory') {
      updates.brandCategory = Array.isArray(value) ? value : [value]
    } else if (fieldKey === 'priceListCategory') {
      updates.priceListCategory = value
    } else if (fieldKey === 'accountType') {
      updates.accountType = value
    } else if (fieldKey === 'accountManager') {
      updates.accountManager = Array.isArray(value) ? value : [value]
    }

    if (Object.keys(updates).length === 0) return

    setBulkUpdating(true)
    try {
      const response = await bulkUpdateCustomers(customerIds, updates)
      if (response.success !== false) {
        const modified = response.modified || 0
        const matched = response.matched || 0
        if (modified > 0) {
          toast.success(`${modified} account(s) updated successfully`)
        } else if (matched > 0) {
          toast.info(`${matched} account(s) matched but no changes were needed (values already set)`)
        } else {
          toast.info('No accounts were updated')
        }
        // Reset the bulk value for this field
        setBulkValues(prev => ({
          ...prev,
          [fieldKey]: fieldKey === 'accountManager' ? [] : ''
        }))
        // Refresh the list
        setRefreshKey(k => k + 1)
      } else {
        toast.error(response.message || 'Failed to update accounts')
      }
    } catch (err) {
      console.error('Bulk update error:', err)
      toast.error(err?.message || 'Failed to update accounts')
    } finally {
      setBulkUpdating(false)
    }
  }

  // Inline auto-save for individual field changes
  const handleInlineSave = async (customer, field, newValue) => {
    const fieldKey = `${customer._id}-${field}`
    if (savingFields[fieldKey]) return

    setSavingFields(prev => ({ ...prev, [fieldKey]: true }))

    try {
      const updateData = {}
      if (field === 'businessCategory') {
        updateData.businessCategory = Array.isArray(newValue) ? newValue : (newValue ? [newValue] : [])
      } else if (field === 'brandCategory') {
        updateData.brandCategory = Array.isArray(newValue) ? newValue : (newValue ? [newValue] : [])
      } else if (field === 'accountManager') {
        updateData.accountManager = Array.isArray(newValue) ? newValue : (newValue ? [newValue] : [])
      } else {
        updateData[field] = newValue
      }

      const response = await updateAdminCustomer(customer._id, updateData)
      if (response.success !== false && response.data) {
        // Replace the entire customer with the fully populated response data
        setCustomers(prev => prev.map(c => c._id === customer._id ? response.data : c))
        toast.success('Updated successfully')
      } else {
        toast.error(response.message || 'Failed to update')
        // Refetch to restore correct state
        setRefreshKey(k => k + 1)
      }
    } catch (err) {
      toast.error('Failed to update')
      // Refetch to restore correct state
      setRefreshKey(k => k + 1)
    } finally {
      setSavingFields(prev => {
        const next = { ...prev }
        delete next[fieldKey]
        return next
      })
    }
  }

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    limit: 50,
  })

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      // Reset to page 1 when search changes
      if (searchQuery !== debouncedSearch) {
        setCurrentPage(1)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchCustomers = async (page = 1, limit = pagination.limit, search = '', filters = {}) => {
    setLoading(true)
    setError(null)
    try {
      const params = { page, limit, search: search || undefined }
      // Add filter params
      if (filters.city) params.city = filters.city
      if (filters.businessCategory) params.businessCategory = filters.businessCategory
      if (filters.priceListCategory) params.priceListCategory = filters.priceListCategory
      if (filters.accountManager) params.accountManager = filters.accountManager
      if (filters.brandCategory) params.brandCategory = filters.brandCategory
      if (filters.accountType) params.accountType = filters.accountType

      const response = await getAdminCustomers(params)
      if (response.success !== false) {
        // Handle both paginated and non-paginated responses
        if (response.pagination) {
          setCustomers(response.data || [])
          setPagination({
            total: response.pagination.totalItems || response.pagination.total || 0,
            totalPages: response.pagination.totalPages || 1,
            limit: response.pagination.itemsPerPage || response.pagination.limit || 50,
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
        // Save server-provided filter options
        if (response.filterOptions) {
          setServerFilterOptions(response.filterOptions)
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

  const fetchAccountManagers = async () => {
    try {
      const response = await getSalesUsers({ role: 'account_manager', limit: 100 })
      if (response?.data?.users) {
        setAccountManagers(response.data.users)
      } else if (Array.isArray(response?.data)) {
        setAccountManagers(response.data)
      }
    } catch (error) {
      console.error('Error loading account managers:', error)
    }
  }

  useEffect(() => {
    fetchCategories()
    fetchAccountManagers()
  }, [])

  // Fetch customers when search, page, filters, or refresh change
  useEffect(() => {
    fetchCustomers(currentPage, pagination.limit, debouncedSearch, {
      city: filterCity,
      businessCategory: filterBusinessCategory,
      priceListCategory: filterPriceList,
      accountManager: filterAccountManager,
      brandCategory: filterBrandCategory,
      accountType: filterAccountType,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, currentPage, filterCity, filterBusinessCategory, filterPriceList, filterAccountManager, filterBrandCategory, filterAccountType, refreshKey])

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const handleCreate = async (data, newContacts = []) => {
    setFormLoading(true)
    try {
      const response = await createAdminCustomer(data)
      if (response.success) {
        const customerId = response.data?._id
        // Create contacts for the new customer
        if (customerId && newContacts.length > 0) {
          for (const contact of newContacts) {
            try {
              await createContact({
                ...contact,
                customer: customerId,
                name: [contact.firstName, contact.middleName, contact.lastName].filter(Boolean).join(' ')
              })
            } catch (err) {
              console.error('Failed to create contact:', err)
            }
          }
        }
        // Refresh the current page
        setRefreshKey(k => k + 1)
        setShowModal(false)
        setSelectedCustomer(null)
        toast.success('Customer created successfully')
      } else {
        toast.error(response.message || 'Failed to create customer')
      }
    } catch (err) {
      toast.error('Failed to create customer')
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdate = async (data, newContacts = []) => {
    setFormLoading(true)
    try {
      const response = await updateAdminCustomer(selectedCustomer._id, data)
      if (response.success) {
        // Create new contacts for the existing customer
        if (newContacts.length > 0) {
          for (const contact of newContacts) {
            try {
              await createContact({
                ...contact,
                customer: selectedCustomer._id,
                name: [contact.firstName, contact.middleName, contact.lastName].filter(Boolean).join(' ')
              })
            } catch (err) {
              console.error('Failed to create contact:', err)
            }
          }
        }
        setCustomers((prev) =>
          prev.map((c) => (c._id === selectedCustomer._id ? response.data : c))
        )
        setRefreshKey(k => k + 1)
        toast.success('Customer updated successfully')
        setShowModal(false)
        setSelectedCustomer(null)
      } else {
        toast.error(response.message || 'Failed to update customer')
      }
    } catch (err) {
      toast.error('Failed to update customer')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    setFormLoading(true)
    try {
      const response = await deleteAdminCustomer(selectedCustomer._id)
      if (response.success) {
        toast.success('Customer deleted successfully')
        // Refresh current page or go to previous if current page is empty
        if (customers.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1)
        }
        setRefreshKey(k => k + 1)
        setShowDeleteModal(false)
        setSelectedCustomer(null)
      } else {
        toast.error(response.message || 'Failed to delete customer')
      }
    } catch (err) {
      toast.error('Failed to delete customer')
    } finally {
      setFormLoading(false)
    }
  }

  // Only show full error state if we have no firms at all
  if (error && customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-gray-600 mb-4">{error}</p>
        <button onClick={() => fetchFirms(1)} className="btn-primary">Retry</button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
          <p className="text-gray-500 mt-1">Manage your account database</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setSelectedCustomer(null); setShowModal(true) }} className="btn-primary flex items-center gap-2 whitespace-nowrap">
            <Plus className="w-5 h-5" />
            Add Account
          </button>
          <button
            onClick={() => setShowBulkEdit(!showBulkEdit)}
            className={`flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
              showBulkEdit
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {showBulkEdit ? 'Hide Bulk Edit' : 'Bulk Edit'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Search accounts..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
        </div>

        {/* Filters - always visible */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* City filter */}
          <select
            value={filterCity}
            onChange={(e) => { setFilterCity(e.target.value); setCurrentPage(1) }}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[130px]"
          >
            <option value="">City</option>
            {serverFilterOptions.cities.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Business Category filter */}
          <select
            value={filterBusinessCategory}
            onChange={(e) => { setFilterBusinessCategory(e.target.value); setCurrentPage(1) }}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[170px]"
          >
            <option value="">Business Category</option>
            {businessCategories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>

          {/* Price List filter */}
          <select
            value={filterPriceList}
            onChange={(e) => { setFilterPriceList(e.target.value); setCurrentPage(1) }}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[120px]"
          >
            <option value="">Price List</option>
            <option value="T1">T1</option>
            <option value="T2">T2</option>
            <option value="SI1">SI1</option>
            <option value="SI2">SI2</option>
            <option value="C1">C1</option>
          </select>

          {/* Account Manager filter */}
          <select
            value={filterAccountManager}
            onChange={(e) => { setFilterAccountManager(e.target.value); setCurrentPage(1) }}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[160px]"
          >
            <option value="">Account Manager</option>
            {accountManagers.map(m => (
              <option key={m._id} value={m._id}>{m.name}</option>
            ))}
          </select>

          {/* Brand Category filter */}
          <select
            value={filterBrandCategory}
            onChange={(e) => { setFilterBrandCategory(e.target.value); setCurrentPage(1) }}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[150px]"
          >
            <option value="">Brand Category</option>
            {brandCategories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>

          {/* Account Type filter */}
          <select
            value={filterAccountType}
            onChange={(e) => { setFilterAccountType(e.target.value); setCurrentPage(1) }}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[120px]"
          >
            <option value="">Account Type</option>
            <option value="in_house">In House</option>
            <option value="shop">Shop</option>
          </select>

          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-medium whitespace-nowrap">
              Clear all
            </button>
          )}
        </div>

        {/* Bulk Edit Row */}
        {showBulkEdit && (
          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs text-gray-500 mb-2">
              Apply changes to the {customers.length} account(s) currently visible. Select a value and click Apply to update.
            </p>
            <div className="flex items-start gap-3 flex-wrap">
              {/* Business Category */}
              <div className="flex items-center gap-2">
                <select
                  value={bulkValues.businessCategory}
                  onChange={(e) => setBulkValues(prev => ({ ...prev, businessCategory: e.target.value }))}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[160px]"
                >
                  <option value="">Business Category</option>
                  {businessCategories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleBulkUpdate('businessCategory')}
                  disabled={!bulkValues.businessCategory || bulkUpdating}
                  className="px-3 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Apply
                </button>
              </div>

              {/* Brand Category */}
              <div className="flex items-center gap-2">
                <select
                  value={bulkValues.brandCategory}
                  onChange={(e) => setBulkValues(prev => ({ ...prev, brandCategory: e.target.value }))}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[160px]"
                >
                  <option value="">Brand Category</option>
                  {brandCategories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleBulkUpdate('brandCategory')}
                  disabled={!bulkValues.brandCategory || bulkUpdating}
                  className="px-3 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Apply
                </button>
              </div>

              {/* Price List */}
              <div className="flex items-center gap-2">
                <select
                  value={bulkValues.priceListCategory}
                  onChange={(e) => setBulkValues(prev => ({ ...prev, priceListCategory: e.target.value }))}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[120px]"
                >
                  <option value="">Price List</option>
                  <option value="T1">T1</option>
                  <option value="T2">T2</option>
                  <option value="SI1">SI1</option>
                  <option value="SI2">SI2</option>
                  <option value="C1">C1</option>
                </select>
                <button
                  onClick={() => handleBulkUpdate('priceListCategory')}
                  disabled={!bulkValues.priceListCategory || bulkUpdating}
                  className="px-3 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Apply
                </button>
              </div>

              {/* Account Type */}
              <div className="flex items-center gap-2">
                <select
                  value={bulkValues.accountType}
                  onChange={(e) => setBulkValues(prev => ({ ...prev, accountType: e.target.value }))}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[120px]"
                >
                  <option value="">Account Type</option>
                  <option value="in_house">In House</option>
                  <option value="shop">Shop</option>
                </select>
                <button
                  onClick={() => handleBulkUpdate('accountType')}
                  disabled={!bulkValues.accountType || bulkUpdating}
                  className="px-3 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Apply
                </button>
              </div>

              {/* Account Manager */}
              <div className="flex items-center gap-2">
                <select
                  value={bulkValues.accountManager.length > 0 ? bulkValues.accountManager[0] : ''}
                  onChange={(e) => setBulkValues(prev => ({ ...prev, accountManager: e.target.value ? [e.target.value] : [] }))}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[170px]"
                >
                  <option value="">Account Manager</option>
                  {accountManagers.map(manager => (
                    <option key={manager._id} value={manager._id}>{manager.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleBulkUpdate('accountManager')}
                  disabled={bulkValues.accountManager.length === 0 || bulkUpdating}
                  className="px-3 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Apply
                </button>
              </div>
            </div>
            {bulkUpdating && (
              <div className="flex items-center gap-2 mt-2">
                <Loader className="w-4 h-4 animate-spin text-indigo-600" />
                <span className="text-sm text-indigo-600">Updating accounts...</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className={`w-full ${showBulkEdit ? 'min-w-[900px]' : 'min-w-[1400px]'}`}>
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className={`text-left px-4 py-4 text-sm font-semibold text-gray-600 ${showBulkEdit ? 'w-[200px] max-w-[200px]' : ''}`}>Account</th>
                {!showBulkEdit && <th className="text-left px-4 py-4 text-sm font-semibold text-gray-600">Contact</th>}
                {!showBulkEdit && <th className="text-left px-4 py-4 text-sm font-semibold text-gray-600">Location</th>}
                {!showBulkEdit && <th className="text-left px-4 py-4 text-sm font-semibold text-gray-600">GSTIN</th>}
                {!showBulkEdit && <th className="text-left px-4 py-4 text-sm font-semibold text-gray-600">Created</th>}
                {showBulkEdit && (
                  <>
                    <th className="text-left px-3 py-4 text-sm font-semibold text-gray-600 w-[100px]">Price List</th>
                    <th className="text-left px-3 py-4 text-sm font-semibold text-gray-600 w-[140px]">Business Cat.</th>
                    <th className="text-left px-3 py-4 text-sm font-semibold text-gray-600 w-[140px]">Brand Cat.</th>
                    <th className="text-left px-3 py-4 text-sm font-semibold text-gray-600 w-[110px]">Account Type</th>
                    <th className="text-left px-3 py-4 text-sm font-semibold text-gray-600 w-[140px]">Manager</th>
                  </>
                )}
                {!showBulkEdit && <th className="text-center px-4 py-4 text-sm font-semibold text-gray-600">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <UserCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No accounts found</p>
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className={`px-4 py-4 ${showBulkEdit ? 'w-[200px] max-w-[200px]' : ''}`}>
                      <div>
                        <p className="font-medium text-gray-900">{customer.firmName || customer.name}</p>
                        {customer.firmName && <p className="text-sm text-gray-500">{customer.name}</p>}
                        {!showBulkEdit && (
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium mt-1 ${(customer.accountType || 'in_house') === 'in_house' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                            {(customer.accountType || 'in_house') === 'in_house' ? 'In House' : 'Shop'}
                          </span>
                        )}
                      </div>
                    </td>
                    {!showBulkEdit && (
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm text-gray-600 flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" />{customer.mobile || '-'}
                          </span>
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5" />{customer.email || '-'}
                          </span>
                        </div>
                      </td>
                    )}
                    {!showBulkEdit && (
                      <td className="px-4 py-4">
                        <span className="text-gray-600 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          {customer.city ? `${customer.city}, ${customer.state}` : customer.state || '-'}
                        </span>
                      </td>
                    )}
                    {!showBulkEdit && (
                      <td className="px-4 py-4 text-gray-600">{customer.gstin || '-'}</td>
                    )}
                    {!showBulkEdit && (
                      <td className="px-4 py-4 text-gray-500 text-sm">
                        {new Date(customer.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                    )}
                    {showBulkEdit && (
                      <>
                        {/* Price List */}
                        <td className="px-3 py-4 w-[100px]">
                          {(() => {
                            const fieldKey = `${customer._id}-priceListCategory`
                            const isSaving = savingFields[fieldKey]
                            return (
                              <select
                                value={customer.priceListCategory || 'T1'}
                                onChange={(e) => handleInlineSave(customer, 'priceListCategory', e.target.value)}
                                disabled={isSaving}
                                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white disabled:bg-gray-50 disabled:cursor-wait"
                              >
                                <option value="T1">T1</option>
                                <option value="T2">T2</option>
                                <option value="SI1">SI1</option>
                                <option value="SI2">SI2</option>
                                <option value="C1">C1</option>
                              </select>
                            )
                          })()}
                        </td>
                        {/* Business Category */}
                        <td className="px-3 py-4 w-[140px]">
                          {(() => {
                            const fieldKey = `${customer._id}-businessCategory`
                            const isSaving = savingFields[fieldKey]
                            const currentCatIds = Array.isArray(customer.businessCategory)
                              ? customer.businessCategory.map(c => typeof c === 'object' ? c._id : c)
                              : []
                            const displayValue = currentCatIds.length > 0 ? currentCatIds[0] : ''
                            return (
                              <select
                                value={displayValue}
                                onChange={(e) => handleInlineSave(customer, 'businessCategory', e.target.value ? [e.target.value] : [])}
                                disabled={isSaving}
                                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white disabled:bg-gray-50 disabled:cursor-wait"
                              >
                                <option value="">-</option>
                                {businessCategories.map(cat => (
                                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                                ))}
                              </select>
                            )
                          })()}
                        </td>
                        {/* Brand Category */}
                        <td className="px-3 py-4 w-[140px]">
                          {(() => {
                            const fieldKey = `${customer._id}-brandCategory`
                            const isSaving = savingFields[fieldKey]
                            const currentBrandIds = Array.isArray(customer.brandCategory)
                              ? customer.brandCategory.map(c => typeof c === 'object' ? c._id : c)
                              : []
                            const displayValue = currentBrandIds.length > 0 ? currentBrandIds[0] : ''
                            return (
                              <select
                                value={displayValue}
                                onChange={(e) => handleInlineSave(customer, 'brandCategory', e.target.value ? [e.target.value] : [])}
                                disabled={isSaving}
                                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white disabled:bg-gray-50 disabled:cursor-wait"
                              >
                                <option value="">-</option>
                                {brandCategories.map(cat => (
                                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                                ))}
                              </select>
                            )
                          })()}
                        </td>
                        {/* Account Type */}
                        <td className="px-3 py-4 w-[110px]">
                          {(() => {
                            const fieldKey = `${customer._id}-accountType`
                            const isSaving = savingFields[fieldKey]
                            return (
                              <select
                                value={customer.accountType || 'in_house'}
                                onChange={(e) => handleInlineSave(customer, 'accountType', e.target.value)}
                                disabled={isSaving}
                                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white disabled:bg-gray-50 disabled:cursor-wait"
                              >
                                <option value="in_house">In House</option>
                                <option value="shop">Shop</option>
                              </select>
                            )
                          })()}
                        </td>
                        {/* Account Manager */}
                        <td className="px-3 py-4 w-[140px]">
                          {(() => {
                            const fieldKey = `${customer._id}-accountManager`
                            const isSaving = savingFields[fieldKey]
                            const currentManagerIds = Array.isArray(customer.accountManager)
                              ? customer.accountManager.map(m => typeof m === 'object' ? m._id : m)
                              : (customer.accountManager ? [typeof customer.accountManager === 'object' ? customer.accountManager._id : customer.accountManager] : [])
                            const displayValue = currentManagerIds.length > 0 ? currentManagerIds[0] : ''
                            return (
                              <select
                                value={displayValue}
                                onChange={(e) => handleInlineSave(customer, 'accountManager', e.target.value ? [e.target.value] : [])}
                                disabled={isSaving}
                                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white disabled:bg-gray-50 disabled:cursor-wait"
                              >
                                <option value="">-</option>
                                {accountManagers.map(m => (
                                  <option key={m._id} value={m._id}>{m.name}</option>
                                ))}
                              </select>
                            )
                          })()}
                        </td>
                      </>
                    )}
                    {!showBulkEdit && (
                    <td className="px-4 py-4">
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
                    )}
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
        title={selectedCustomer ? `Edit Account - ${selectedCustomer.firmName || selectedCustomer.name || ''}` : 'Add Account'} size="xl">
        <CustomerForm customer={selectedCustomer} onSubmit={selectedCustomer ? handleUpdate : handleCreate}
          onCancel={() => { setShowModal(false); setSelectedCustomer(null) }} loading={formLoading}
          businessCategories={businessCategories} brandCategories={brandCategories} />
      </Modal>

      <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setSelectedCustomer(null) }} title="Delete Account">
        <DeleteModal customer={selectedCustomer} onConfirm={handleDelete}
          onCancel={() => { setShowDeleteModal(false); setSelectedCustomer(null) }} loading={formLoading} />
      </Modal>

      <Modal isOpen={showViewModal} onClose={() => { setShowViewModal(false); setSelectedCustomer(null) }} title="Account Details" size="xl">
        <CustomerViewModal customer={selectedCustomer} onClose={() => { setShowViewModal(false); setSelectedCustomer(null) }} />
      </Modal>
    </div>
  )
}