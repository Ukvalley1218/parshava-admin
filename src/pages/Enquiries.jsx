import { useState, useEffect, useRef } from 'react'
import {
  Search, Plus, X, Loader2, MessageSquare, Clock, CheckCircle,
  User, Building2, Phone, Mail, ChevronRight, Send, Eye, Trash
} from 'lucide-react'
import {
  getEnquiries, getEnquiryById, createEnquiry, updateEnquiry,
  deleteEnquiry, getEnquiryCounts, getAdminCustomers, getAdminCustomerById
} from '../services/adminApi'

const STATUS_CONFIG = {
  open: { label: 'Open', color: 'bg-blue-100 text-blue-700', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  quoted: { label: 'Quoted', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-600', icon: CheckCircle }
}

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'quoted', label: 'Quoted' },
  { key: 'closed', label: 'Closed' }
]

export default function Enquiries() {
  const [enquiries, setEnquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [counts, setCounts] = useState({ open: 0, inProgress: 0, quoted: 0, closed: 0 })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedEnquiry, setSelectedEnquiry] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Create form state
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [contactPerson, setContactPerson] = useState(null)
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(null)

  // Customer search state
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerResults, setCustomerResults] = useState([])
  const [searchingCustomers, setSearchingCustomers] = useState(false)
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const customerDropdownRef = useRef(null)

  useEffect(() => {
    fetchEnquiries()
    fetchCounts()
  }, [])

  useEffect(() => {
    fetchEnquiries()
  }, [activeTab])

  // Click outside to close customer dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target)) {
        setShowCustomerDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchEnquiries = async () => {
    setLoading(true)
    try {
      const params = {}
      if (activeTab !== 'all') params.status = activeTab
      const response = await getEnquiries(params)
      if (response.success || response.data) {
        setEnquiries(response.data || [])
      }
    } catch (err) {
      console.error('Error fetching enquiries:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchCounts = async () => {
    try {
      const response = await getEnquiryCounts()
      if (response.success || response.data) {
        setCounts(response.data || {})
      }
    } catch (err) {
      console.error('Error fetching counts:', err)
    }
  }

  const searchCustomers = async (query) => {
    if (!query || query.trim().length < 2) {
      setCustomerResults([])
      return
    }
    setSearchingCustomers(true)
    try {
      const response = await getAdminCustomers({ search: query.trim(), limit: 20 })
      if (response.data) {
        setCustomerResults(response.data.customers || response.data || [])
      }
    } catch (err) {
      console.error('Error searching customers:', err)
    } finally {
      setSearchingCustomers(false)
    }
  }

  const handleSelectCustomer = async (customer) => {
    // Fetch full customer details with populated contacts
    try {
      const response = await getAdminCustomerById(customer._id)
      const fullCustomer = response.data || response
      setSelectedCustomer(fullCustomer)

      // Auto-select primary contact person if available
      if (fullCustomer.contactPersons && fullCustomer.contactPersons.length > 0) {
        const primary = fullCustomer.contactPersons.find(c => c.isPrimary) || fullCustomer.contactPersons[0]
        setContactPerson({
          name: primary.name || '',
          designation: primary.designation || '',
          mobile: primary.mobile || fullCustomer.mobile || '',
          email: primary.email || fullCustomer.email || '',
          isPrimary: primary.isPrimary || false,
          isWhatsApp: primary.isWhatsApp || false
        })
      } else {
        setContactPerson({
          name: fullCustomer.name || fullCustomer.firmName || '',
          designation: '',
          mobile: fullCustomer.mobile || '',
          email: fullCustomer.email || '',
          isPrimary: true,
          isWhatsApp: false
        })
      }
    } catch (err) {
      // Fallback to the customer from search results
      setSelectedCustomer(customer)
      setContactPerson({
        name: customer.name || customer.firmName || '',
        designation: '',
        mobile: customer.mobile || '',
        email: customer.email || '',
        isPrimary: true,
        isWhatsApp: false
      })
    }
    setShowCustomerDropdown(false)
    setCustomerSearch('')
    setCustomerResults([])
  }

  const handleSelectContact = (contact) => {
    setContactPerson({
      name: contact.name || '',
      designation: contact.designation || '',
      mobile: contact.mobile || selectedCustomer.mobile || '',
      email: contact.email || selectedCustomer.email || '',
      isPrimary: contact.isPrimary || false,
      isWhatsApp: contact.isWhatsApp || false
    })
  }

  const handleCreateEnquiry = async () => {
    if (!selectedCustomer) {
      setError('Please select a customer')
      return
    }
    if (!description.trim()) {
      setError('Please enter a description')
      return
    }

    setCreating(true)
    setError(null)
    try {
      const response = await createEnquiry({
        customerId: selectedCustomer._id,
        contactPerson: contactPerson || undefined,
        description: description.trim()
      })
      if (response.success || response.data) {
        setShowCreateModal(false)
        resetCreateForm()
        fetchEnquiries()
        fetchCounts()
      } else {
        setError(response.message || 'Failed to create enquiry')
      }
    } catch (err) {
      setError(err.message || 'Failed to create enquiry')
    } finally {
      setCreating(false)
    }
  }

  const resetCreateForm = () => {
    setSelectedCustomer(null)
    setContactPerson(null)
    setDescription('')
    setError(null)
    setCustomerSearch('')
    setCustomerResults([])
  }

  const handleStatusChange = async (enquiryId, newStatus) => {
    try {
      const response = await updateEnquiry(enquiryId, { status: newStatus })
      if (response.success || response.data) {
        fetchEnquiries()
        fetchCounts()
        // Refresh detail view if open
        if (selectedEnquiry?._id === enquiryId) {
          const detail = await getEnquiryById(enquiryId)
          setSelectedEnquiry(detail.data || detail)
        }
      }
    } catch (err) {
      console.error('Error updating status:', err)
    }
  }

  const handleDelete = async (enquiryId) => {
    if (!window.confirm('Are you sure you want to delete this enquiry?')) return
    try {
      const response = await deleteEnquiry(enquiryId)
      if (response.success || response.data) {
        fetchEnquiries()
        fetchCounts()
        if (selectedEnquiry?._id === enquiryId) {
          setSelectedEnquiry(null)
        }
      }
    } catch (err) {
      console.error('Error deleting enquiry:', err)
    }
  }

  const openDetail = async (enquiry) => {
    setDetailLoading(true)
    try {
      const response = await getEnquiryById(enquiry._id)
      setSelectedEnquiry(response.data || response)
    } catch (err) {
      setSelectedEnquiry(enquiry)
    } finally {
      setDetailLoading(false)
    }
  }

  const filtered = search.trim()
    ? enquiries.filter(e =>
        (e.customerDetails?.firmName || '').toLowerCase().includes(search.toLowerCase()) ||
        (e.customerDetails?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (e.description || '').toLowerCase().includes(search.toLowerCase()) ||
        (e.enquiryId || '').toLowerCase().includes(search.toLowerCase())
      )
    : enquiries

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    })
  }

  // ─── Detail view ───
  if (selectedEnquiry) {
    const statusConfig = STATUS_CONFIG[selectedEnquiry.status] || STATUS_CONFIG.open
    const customer = selectedEnquiry.customerDetails || {}
    const cp = selectedEnquiry.contactPerson || {}
    const manager = selectedEnquiry.accountManager || selectedEnquiry.assignedTo || {}
    const quotation = selectedEnquiry.relatedQuotation

    return (
      <div className="p-6 max-w-3xl mx-auto">
        <button
          onClick={() => setSelectedEnquiry(null)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-5 transition"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          <span className="font-semibold text-sm">Back to Enquiries</span>
        </button>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-gray-900">
                {selectedEnquiry.enquiryId || 'Enquiry'}
              </h1>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>
            <p className="text-sm text-gray-500">{formatDate(selectedEnquiry.createdAt)}</p>
          </div>

          <div className="flex items-center gap-2">
            {!quotation && selectedEnquiry.status !== 'closed' && (
              <span className="flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm font-medium">
                <Send className="w-3.5 h-3.5" />
                Create Quotation
              </span>
            )}
            {selectedEnquiry.status !== 'closed' && (
              <select
                value={selectedEnquiry.status}
                onChange={(e) => handleStatusChange(selectedEnquiry._id, e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="quoted">Quoted</option>
                <option value="closed">Closed</option>
              </select>
            )}
            <button
              onClick={() => { handleDelete(selectedEnquiry._id); setSelectedEnquiry(null); }}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
              title="Delete"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Customer Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{customer.firmName || customer.name || 'Unknown'}</p>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                {customer.mobile && <span>{customer.mobile}</span>}
                {customer.city && <span>{customer.city}</span>}
                {customer.gstin && <span className="text-gray-400">GST: {customer.gstin}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Contact & Manager */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {cp.name && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-2">Contact Person</p>
              <p className="font-medium text-gray-900">{cp.name}</p>
              {cp.designation && <p className="text-xs text-gray-500">{cp.designation}</p>}
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                {cp.mobile && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{cp.mobile}</span>}
                {cp.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{cp.email}</span>}
              </div>
            </div>
          )}
          {(manager?.name || selectedEnquiry.assignedTo?.name) && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-2">Account Manager</p>
              <p className="font-medium text-gray-900">{manager.name || selectedEnquiry.assignedTo?.name}</p>
              {(manager.email || selectedEnquiry.assignedTo?.email) && (
                <p className="text-xs text-gray-500">{manager.email || selectedEnquiry.assignedTo?.email}</p>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" /> Description
          </p>
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{selectedEnquiry.description}</p>
        </div>

        {/* Linked Quotation */}
        {quotation && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
            <p className="text-xs text-green-700 font-semibold mb-1">Linked Quotation</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-green-900">{quotation.inquiryId || 'Quotation'}</p>
                <p className="text-xs text-green-700">
                  {quotation.items?.length || 0} items · ₹{((quotation.grandTotal || 0)).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {selectedEnquiry.notes && (
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Notes</p>
            <p className="text-sm text-gray-700">{selectedEnquiry.notes}</p>
          </div>
        )}
      </div>
    )
  }

  // ─── List view ───
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enquiries</h1>
          <p className="text-gray-500 text-sm mt-0.5">{filtered.length} enquiries</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-[#1F3A5F] text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-[#1F3A5F]/90 transition"
        >
          <Plus className="w-4 h-4" />
          New Enquiry
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search enquiries..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1F3A5F]/20 focus:border-[#1F3A5F]"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 mb-5 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-white text-[#1F3A5F] shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              activeTab === tab.key ? 'bg-[#1F3A5F] text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {tab.key === 'all' ? (counts.open + counts.inProgress + counts.quoted + counts.closed) :
               tab.key === 'open' ? counts.open :
               tab.key === 'in_progress' ? counts.inProgress :
               tab.key === 'quoted' ? counts.quoted : counts.closed}
            </span>
          </button>
        ))}
      </div>

      {/* Enquiry List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#1F3A5F] animate-spin mb-3" />
          <p className="text-sm text-gray-500">Loading enquiries...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
            <MessageSquare className="w-7 h-7 text-gray-400" />
          </div>
          <p className="font-semibold text-gray-700">No enquiries found</p>
          <p className="text-sm text-gray-400 mt-1">Create a new enquiry to get started</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">ID</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Customer</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3 hidden md:table-cell">Description</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3 hidden sm:table-cell">Manager</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3 hidden lg:table-cell">Date</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(enquiry => {
                const statusConfig = STATUS_CONFIG[enquiry.status] || STATUS_CONFIG.open
                const customer = enquiry.customerDetails || {}
                const manager = enquiry.accountManager || enquiry.assignedTo

                return (
                  <tr
                    key={enquiry._id}
                    className="hover:bg-gray-50 transition"
                  >
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-gray-500">{enquiry.enquiryId}</span>
                    </td>
                    <td className="px-4 py-3 cursor-pointer" onClick={() => openDetail(enquiry)}>
                      <p className="font-medium text-gray-900 text-sm hover:text-[#1F3A5F]">{customer.firmName || customer.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-400">{customer.city || customer.mobile || ''}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-sm text-gray-600 line-clamp-1 max-w-[200px]">{enquiry.description}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p className="text-sm text-gray-600">{manager?.name || '—'}</p>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <p className="text-xs text-gray-500">{formatDate(enquiry.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); openDetail(enquiry); }}
                          className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(enquiry._id); }}
                          className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Drop Enquiry"
                        >
                          <Trash className="w-3.5 h-3.5" />
                          Drop
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Enquiry Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-bold text-lg text-gray-900">New Enquiry</h2>
              <button
                onClick={() => { setShowCreateModal(false); resetCreateForm(); }}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <p className="text-sm text-red-700">{error}</p>
                  <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4 text-red-400" /></button>
                </div>
              )}

              {/* Customer Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account (Customer) *</label>
                {selectedCustomer ? (
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{selectedCustomer.firmName || selectedCustomer.name}</p>
                      <p className="text-xs text-gray-500">
                        {selectedCustomer.mobile && <span>{selectedCustomer.mobile}</span>}
                        {selectedCustomer.city && <span> · {selectedCustomer.city}</span>}
                      </p>
                    </div>
                    <button
                      onClick={() => { setSelectedCustomer(null); setContactPerson(null); }}
                      className="text-xs text-[#1F3A5F] hover:underline"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="relative" ref={customerDropdownRef}>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search customers by name, mobile, city..."
                        value={customerSearch}
                        onChange={(e) => {
                          setCustomerSearch(e.target.value)
                          searchCustomers(e.target.value)
                        }}
                        onFocus={() => {
                          if (customerResults.length > 0) setShowCustomerDropdown(true)
                        }}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1F3A5F]/20 focus:border-[#1F3A5F]"
                      />
                      {searchingCustomers && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                      )}
                    </div>
                    {showCustomerDropdown && customerResults.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {customerResults.map(customer => (
                          <button
                            key={customer._id}
                            onClick={() => handleSelectCustomer(customer)}
                            className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-0"
                          >
                            <p className="font-medium text-gray-900 text-sm">{customer.firmName || customer.name}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                              {customer.mobile && <span>{customer.mobile}</span>}
                              {customer.city && <span>{customer.city}</span>}
                              {customer.priceListCategory && <span className="text-[#1F3A5F]">{customer.priceListCategory}</span>}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Account Manager (auto-filled, read-only) */}
              {(selectedCustomer?.accountManager?.length > 0) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Manager</label>
                  <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{selectedCustomer.accountManager[0]?.name}</span>
                    {selectedCustomer.accountManager[0]?.email && (
                      <span className="text-xs text-gray-400">({selectedCustomer.accountManager[0].email})</span>
                    )}
                  </div>
                </div>
              )}

              {/* Contact Person Selection */}
              {selectedCustomer && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                  {selectedCustomer.contactPersons && selectedCustomer.contactPersons.length > 0 ? (
                    <div className="space-y-2">
                      <select
                        value={contactPerson ? `${contactPerson.name}|${contactPerson.mobile}` : ''}
                        onChange={(e) => {
                          const contacts = selectedCustomer.contactPersons
                          const selected = contacts.find(c => `${c.name}|${c.mobile}` === e.target.value)
                          if (selected) handleSelectContact(selected)
                        }}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1F3A5F]/20 focus:border-[#1F3A5F] bg-white"
                      >
                        <option value="">Select a contact person</option>
                        {selectedCustomer.contactPersons.map((contact, idx) => (
                          <option key={idx} value={`${contact.name}|${contact.mobile}`}>
                            {contact.name}{contact.designation ? ` (${contact.designation})` : ''}{contact.isPrimary ? ' ★' : ''} — {contact.mobile || 'No phone'}
                          </option>
                        ))}
                      </select>
                      {contactPerson && (
                        <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-[10px] text-gray-400 mb-0.5">Name</p>
                              <input
                                type="text"
                                value={contactPerson.name}
                                onChange={(e) => setContactPerson({ ...contactPerson, name: e.target.value })}
                                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#1F3A5F]/20 focus:border-[#1F3A5F]"
                              />
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-400 mb-0.5">Designation</p>
                              <input
                                type="text"
                                value={contactPerson.designation || ''}
                                onChange={(e) => setContactPerson({ ...contactPerson, designation: e.target.value })}
                                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#1F3A5F]/20 focus:border-[#1F3A5F]"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-[10px] text-gray-400 mb-0.5">Mobile</p>
                              <input
                                type="text"
                                value={contactPerson.mobile}
                                onChange={(e) => setContactPerson({ ...contactPerson, mobile: e.target.value })}
                                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#1F3A5F]/20 focus:border-[#1F3A5F]"
                              />
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-400 mb-0.5">Email</p>
                              <input
                                type="email"
                                value={contactPerson.email}
                                onChange={(e) => setContactPerson({ ...contactPerson, email: e.target.value })}
                                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#1F3A5F]/20 focus:border-[#1F3A5F]"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No contacts linked to this account</p>
                  )}
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the product(s) the customer is enquiring about..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1F3A5F]/20 focus:border-[#1F3A5F] resize-none"
                />
              </div>

              {/* Submit */}
              <button
                onClick={handleCreateEnquiry}
                disabled={creating || !selectedCustomer || !description.trim()}
                className="w-full py-3 bg-[#1F3A5F] text-white rounded-lg font-semibold hover:bg-[#1F3A5F]/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {creating ? 'Creating...' : 'Create Enquiry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}