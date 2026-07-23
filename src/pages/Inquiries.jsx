import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Search, Eye, Trash2, X, Loader, AlertCircle, FileText,
  ShoppingBag, User, Calendar, ChevronDown, MoreVertical, UserPlus, Trash
} from 'lucide-react'
import { getAdminInquiries, getAdminInquiryById, updateInquiryStatus, deleteAdminInquiry, convertInquiryToOrder } from '../services/adminApi'
import Pagination from '../components/Pagination'
import Modal from '../components/Modal'
import { useToast } from '../components/Toast'

// Inquiry Detail Modal
function InquiryDetailModal({ inquiry, onClose, onConvert, onStatusChange, loading }) {
  if (!inquiry) return null

  const items = inquiry.items || []
  const customer = inquiry.customerDetails || inquiry.customerId || {}

  const handleStatusUpdate = async (status) => {
    if (onStatusChange) {
      await onStatusChange(inquiry._id, status)
    }
  }

  const handleConvert = async () => {
    if (onConvert) {
      await onConvert(inquiry._id)
    }
  }

  return (
    <div className="p-4 md:p-6">
      {/* Customer Info */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Customer Details</h4>
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Name</p>
              <p className="font-medium text-gray-900">{customer.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Mobile</p>
              <p className="font-medium text-gray-900">{customer.mobile || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{customer.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">GSTIN</p>
              <p className="font-medium text-gray-900">{customer.gstin || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Assigned To */}
      {inquiry.assignedTo && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Assigned To</h4>
          <div className="bg-indigo-50 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{inquiry.assignedTo.name || 'Unknown'}</p>
              <p className="text-xs text-gray-500">{inquiry.assignedTo.email || ''} · {inquiry.assignedTo.role || ''}</p>
            </div>
          </div>
        </div>
      )}

      {/* Items */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Items ({items.length})</h4>
        <div className="border border-gray-100 rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[400px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Product</th>
                <th className="text-center px-4 py-2 text-xs font-medium text-gray-500">Qty</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">Price</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} className="border-t border-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{item.productName || item.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-center">{item.qty || item.quantity}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">₹{item.price?.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">₹{item.total?.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className="mb-6 bg-gray-50 rounded-xl p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-500">Subtotal</span>
          <span className="text-gray-900">₹{inquiry.subtotal?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
        </div>
        {inquiry.discountTotal > 0 && (
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">Discount</span>
            <span className="text-green-600">-₹{inquiry.discountTotal?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          </div>
        )}
        {inquiry.gstTotal > 0 && (
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">GST</span>
            <span className="text-gray-900">₹{inquiry.gstTotal?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-lg pt-2 border-t border-gray-200">
          <span>Grand Total</span>
          <span>₹{inquiry.grandTotal?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Status */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Status</h4>
        {inquiry.status === 'cancelled' ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-100 text-red-700 text-sm font-medium">
            <AlertCircle className="w-4 h-4" />
            Cancelled — status cannot be changed
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {['draft', 'converted', 'cancelled'].map((status) => (
              <button key={status} onClick={() => handleStatusUpdate(status)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  inquiry.status === status
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                disabled={loading}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={onClose} className="btn-secondary flex-1">Close</button>
        {inquiry.status === 'draft' && (
          <button onClick={handleConvert} className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={loading}>
            {loading && <Loader className="w-4 h-4 animate-spin" />}
            <ShoppingBag className="w-4 h-4" />
            Convert to Order
          </button>
        )}
      </div>
    </div>
  )
}

export default function Inquiries() {
  const toast = useToast()
  const [inquiries, setInquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedInquiry, setSelectedInquiry] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [openActionMenu, setOpenActionMenu] = useState(null)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 })
  const [actionMenuInquiry, setActionMenuInquiry] = useState(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    limit: 10,
  })

  const fetchInquiries = async (page = currentPage, limit = pagination.limit) => {
    setLoading(true)
    setError(null)
    try {
      const response = await getAdminInquiries({ page, limit, status: statusFilter || undefined })
      if (response.success !== false) {
        // Handle both paginated and non-paginated responses
        if (response.pagination) {
          const total = response.pagination.totalItems || response.pagination.total || 0
          const limit = response.pagination.itemsPerPage || response.pagination.limit || 10
          const computedTotalPages = Math.max(response.pagination.totalPages || 0, Math.ceil(total / limit))
          setInquiries(response.data || [])
          setPagination({ total, totalPages: computedTotalPages || 1, limit })
        } else {
          // Fallback for non-paginated API response
          setInquiries(response.data || response.inquiries || [])
          setPagination({
            total: (response.data || response.inquiries || []).length,
            totalPages: 1,
            limit: 9999,
          })
        }
      } else {
        setError(response.message || 'Failed to fetch quotations')
      }
    } catch (err) {
      setError('Failed to fetch quotations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInquiries(1)
  }, [statusFilter])

  // Close action menu on click outside or scroll/resize
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (openActionMenu) {
        const dropdownEl = document.getElementById('action-dropdown-menu')
        if (!dropdownEl || !dropdownEl.contains(e.target)) {
          setOpenActionMenu(null)
          setActionMenuInquiry(null)
        }
      }
    }
    const handleClose = () => {
      if (openActionMenu) {
        setOpenActionMenu(null)
        setActionMenuInquiry(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('scroll', handleClose, true)
    window.addEventListener('resize', handleClose)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleClose, true)
      window.removeEventListener('resize', handleClose)
    }
  }, [openActionMenu])

  const handlePageChange = (page) => {
    setCurrentPage(page)
    fetchInquiries(page)
  }

  // Client-side search filter
  const filteredInquiries = inquiries.filter((inq) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    const customerName = inq.customerDetails?.name || inq.customerId?.name || ''
    return (
      customerName.toLowerCase().includes(query) ||
      inq._id?.toLowerCase().includes(query) ||
      inq.inquiryId?.toLowerCase().includes(query)
    )
  })

  const handleViewInquiry = (inquiry) => {
    setSelectedInquiry(inquiry)
    setShowModal(true)
  }

  const handleStatusChange = async (id, status) => {
    setActionLoading(true)
    try {
      const response = await updateInquiryStatus(id, status)
      if (response.success) {
        setInquiries((prev) => prev.map((i) => i._id === id ? { ...i, status } : i))
        setSelectedInquiry((prev) => prev._id === id ? { ...prev, status } : prev)
        toast.success('Status updated successfully')
      } else {
        toast.error(response.message || 'Failed to update status')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status')
    } finally {
      setActionLoading(false)
    }
  }

  const handleConvert = async (id) => {
    setActionLoading(true)
    try {
      const response = await convertInquiryToOrder(id)
      if (response.success) {
        setInquiries((prev) => prev.map((i) => i._id === id ? { ...i, status: 'converted' } : i))
        setSelectedInquiry((prev) => prev._id === id ? { ...prev, status: 'converted' } : prev)
        toast.success('Quotation converted to order successfully!')
      } else {
        toast.error(response.message || 'Failed to convert quotation')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to convert quotation')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this quotation?')) return
    try {
      const response = await deleteAdminInquiry(id)
      if (response.success) {
        toast.success('Quotation deleted successfully')
        if (inquiries.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1)
          fetchInquiries(currentPage - 1)
        } else {
          fetchInquiries(currentPage)
        }
      }
    } catch (err) {
      toast.error('Failed to delete quotation')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-amber-100 text-amber-700'
      case 'converted': return 'bg-green-100 text-green-700'
      case 'cancelled': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  // Only show full error state if we have no inquiries at all
  if (error && inquiries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-gray-600 mb-4">{error}</p>
        <button onClick={() => fetchInquiries(1)} className="btn-primary">Retry</button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quotations</h1>
        <p className="text-gray-500 mt-1">Manage customer quotations</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Search quotations..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="converted">Converted</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">ID</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Customer</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 hidden sm:table-cell">Items</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Amount</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 hidden lg:table-cell">Assigned To</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 hidden md:table-cell">Date</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInquiries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No quotations found</p>
                  </td>
                </tr>
              ) : (
                filteredInquiries.map((inquiry) => (
                  <tr key={inquiry._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-6 py-4 text-sm text-gray-600">#{inquiry.inquiryId || inquiry._id?.slice(-8)}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{inquiry.customerDetails?.name || inquiry.customerId?.name || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 hidden sm:table-cell">{inquiry.items?.length || 0} items</td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      ₹{inquiry.grandTotal?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(inquiry.status)}`}>
                        {inquiry.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      {inquiry.assignedTo ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                          <UserPlus className="w-3 h-3" />
                          {inquiry.assignedTo.name || 'Assigned'}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell">
                      {new Date(inquiry.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleViewInquiry(inquiry)} className="p-2 hover:bg-gray-100 rounded-lg" title="View">
                          <Eye className="w-4 h-4 text-gray-500" />
                        </button>
                        <div>
                          <button
                            onClick={(e) => {
                              if (openActionMenu === inquiry._id) {
                                setOpenActionMenu(null)
                                setActionMenuInquiry(null)
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect()
                                const dropdownWidth = 170
                                const dropdownHeight = 180
                                let top = rect.bottom + 4
                                let left = rect.right - dropdownWidth
                                if (top + dropdownHeight > window.innerHeight) {
                                  top = rect.top - dropdownHeight - 4
                                }
                                if (left < 8) left = 8
                                setDropdownPos({ top, left })
                                setOpenActionMenu(inquiry._id)
                                setActionMenuInquiry(inquiry)
                              }
                            }}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                            title="More actions"
                          >
                            <MoreVertical className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
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

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setSelectedInquiry(null) }}
        title="Quotation Details" size="lg">
        <InquiryDetailModal inquiry={selectedInquiry} onClose={() => { setShowModal(false); setSelectedInquiry(null) }}
          onConvert={handleConvert} onStatusChange={handleStatusChange} loading={actionLoading} />
      </Modal>

      {/* Action Dropdown Portal — rendered outside table overflow containers */}
      {openActionMenu && actionMenuInquiry && createPortal(
        <div
          id="action-dropdown-menu"
          className="fixed bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[170px] z-[9999]"
          style={{ top: `${dropdownPos.top}px`, left: `${dropdownPos.left}px` }}
        >
          <button
            onClick={() => { setOpenActionMenu(null); setActionMenuInquiry(null); handleViewInquiry(actionMenuInquiry); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-4 h-4" />
            View Details
          </button>
          <div className="border-t border-gray-100 my-1" />
          <button
            onClick={() => { setOpenActionMenu(null); setActionMenuInquiry(null); handleDelete(actionMenuInquiry._id); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash className="w-4 h-4" />
            Drop Quotation
          </button>
        </div>,
        document.body
      )}
    </div>
  )
}