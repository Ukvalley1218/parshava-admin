import { useState, useEffect } from 'react'
import { Search, Eye, Trash2, X, Loader, AlertCircle, ShoppingBag, Calendar, ChevronDown, Phone } from 'lucide-react'
import { getAdminOrders, getAdminOrderById, updateOrderStatus, deleteAdminOrder } from '../services/adminApi'
import Pagination from '../components/Pagination'

// WhatsApp SVG icon (since react-icons is not installed in admin panel)
const WhatsAppIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

// Generate WhatsApp share URL
const generateWhatsAppUrl = (phone, message) => {
  let cleanPhone = phone?.replace(/[\s-]/g, '') || ''
  if (cleanPhone && !cleanPhone.startsWith('+')) {
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '91' + cleanPhone.slice(1)
    } else if (!cleanPhone.startsWith('91')) {
      cleanPhone = '91' + cleanPhone
    }
  } else if (cleanPhone.startsWith('+')) {
    cleanPhone = cleanPhone.slice(1)
  }
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`
}

// Generate order message for WhatsApp
const generateOrderMessage = (order, withModelNo = true) => {
  const items = order.items || []
  let message = ''

  if (items.length > 0) {
    items.forEach((item, index) => {
      const brand = item.brand || item.product?.brand || ''
      const category = item.category || item.product?.category || ''
      const subcategory = item.subcategory || item.product?.subcategory || item.productType || item.product?.productType || ''
      const partNumber = item.partNumber || item.product?.partNumber || item.product?.sku || ''
      const opPrice = item.price || item.sellingPrice || item.opPrice || 0
      const discount = item.discount || 0
      const gstRate = item.gstRate || 18
      const qty = item.quantity || item.qty || 1

      if (withModelNo) {
        const brandCatSub = [brand, category, subcategory].filter(Boolean).join(' ')
        if (brandCatSub) message += `${brandCatSub}\n`
        if (partNumber) message += `${partNumber}\n`
      } else {
        const brandCatSub = [brand, category].filter(Boolean).join(' ')
        if (brandCatSub) message += `${brandCatSub}\n`
      }

      message += `₹${opPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}\n (Tax Paid) - ${discount}% DIS`

      if (index < items.length - 1) {
        message += `\n`
      }
    })
  }

  return message
}

// Modal Component
function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null
  const sizeClasses = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`bg-white rounded-2xl w-full ${sizeClasses[size]} shadow-xl animate-fadeIn max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}>
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

// Order Detail Modal
function OrderDetailModal({ order, onClose, onStatusChange, loading }) {
  if (!order) return null

  const items = order.items || []
  // Get customer from customerDetails (new orders) or populated customerId (old orders)
  const customer = order.customerDetails ||
    (order.customerId && typeof order.customerId === 'object' ? order.customerId : {}) || {}
  const shippingAddress = order.shippingAddress || {}

  // WhatsApp phone: contact person mobile, then customer mobile
  const customerPhone = order.contactPerson?.mobile || customer.mobile || ''

  const handleWhatsAppShare = (withModelNo) => {
    if (!customerPhone) {
      alert('Customer phone number not available')
      return
    }
    const message = generateOrderMessage(order, withModelNo)
    const url = generateWhatsAppUrl(customerPhone, message)
    window.open(url, '_blank')
  }

  return (
    <div className="p-4 md:p-6">
      {/* WhatsApp Share */}
      {customerPhone && (
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => handleWhatsAppShare(true)}
            className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
          >
            <WhatsAppIcon className="w-4 h-4" />
            WhatsApp (with Model No)
          </button>
          <button
            onClick={() => handleWhatsAppShare(false)}
            className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
          >
            <WhatsAppIcon className="w-4 h-4" />
            WhatsApp (No Model)
          </button>
        </div>
      )}

      {/* Contact Person */}
      {order.contactPerson?.name && (
        <div className="bg-blue-50 rounded-xl p-4 mb-6">
          <p className="text-xs text-gray-500 mb-1">Contact Person</p>
          <p className="font-medium text-gray-900">{order.contactPerson.name}</p>
          {order.contactPerson.designation && <p className="text-xs text-gray-500">{order.contactPerson.designation}</p>}
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            {order.contactPerson.mobile && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{order.contactPerson.mobile}</span>}
            {order.contactPerson.email && <span>{order.contactPerson.email}</span>}
          </div>
        </div>
      )}

      {/* Order Info */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Order ID</p>
          <p className="font-semibold text-gray-900">#{order.orderId || order._id?.slice(-8).toUpperCase()}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Created</p>
          <p className="font-semibold text-gray-900">
            {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Customer Info */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Customer Details</h4>
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Name</p>
              <p className="font-medium text-gray-900">{customer.firmName || customer.name || 'N/A'}</p>
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

      {/* Shipping Address */}
      {shippingAddress.city && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Shipping Address</h4>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-gray-900">{shippingAddress.address}</p>
            <p className="text-gray-600">{shippingAddress.city}, {shippingAddress.state} - {shippingAddress.pincode}</p>
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
                <th className="text-center px-4 py-2 text-xs font-medium text-gray-500">Product</th>
                <th className="text-center px-4 py-2 text-xs font-medium text-gray-500">Qty</th>
                <th className="text-center px-4 py-2 text-xs font-medium text-gray-500">Price</th>
                <th className="text-center px-4 py-2 text-xs font-medium text-gray-500">Total</th>
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
          <span className="text-gray-900">₹{order.subtotal?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
        </div>
        {order.discountTotal > 0 && (
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">Discount</span>
            <span className="text-green-600">-₹{order.discountTotal?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          </div>
        )}
        {order.gstTotal > 0 && (
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">GST</span>
            <span className="text-gray-900">₹{order.gstTotal?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-lg pt-2 border-t border-gray-200">
          <span>Grand Total</span>
          <span>₹{order.grandTotal?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Status Update */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Update Status</h4>
        <div className="flex flex-wrap gap-2">
          {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
            <button key={status} onClick={() => onStatusChange(order._id, status)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                order.status === status
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              disabled={loading}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onClose} className="btn-secondary flex-1">Close</button>
      </div>
    </div>
  )
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    limit: 10,
  })

  const fetchOrders = async (page = currentPage, limit = pagination.limit) => {
    setLoading(true)
    setError(null)
    try {
      const response = await getAdminOrders({ page, limit, status: statusFilter || undefined })
      if (response.success !== false) {
        // Handle both paginated and non-paginated responses
        if (response.pagination) {
          setOrders(response.data || [])
          setPagination({
            total: response.pagination.totalItems || response.pagination.total || 0,
            totalPages: response.pagination.totalPages || 1,
            limit: response.pagination.itemsPerPage || response.pagination.limit || 10,
          })
        } else {
          // Fallback for non-paginated API response
          setOrders(response.data || response.orders || [])
          setPagination({
            total: (response.data || response.orders || []).length,
            totalPages: 1,
            limit: 9999,
          })
        }
      } else {
        setError(response.message || 'Failed to fetch orders')
      }
    } catch (err) {
      setError('Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders(1)
  }, [statusFilter])

  const handlePageChange = (page) => {
    setCurrentPage(page)
    fetchOrders(page)
  }

  // Client-side search filter
  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    const customerName = order.customerDetails?.name || order.customerId?.name || ''
    return (
      customerName.toLowerCase().includes(query) ||
      order._id?.toLowerCase().includes(query) ||
      order.orderId?.toLowerCase().includes(query)
    )
  })

  const handleViewOrder = (order) => {
    setSelectedOrder(order)
    setShowModal(true)
  }

  const handleStatusChange = async (id, status) => {
    setActionLoading(true)
    try {
      const response = await updateOrderStatus(id, status)
      if (response.success) {
        setOrders((prev) => prev.map((o) => o._id === id ? { ...o, status } : o))
        setSelectedOrder((prev) => prev._id === id ? { ...prev, status } : prev)
      }
    } catch (err) {
      alert('Failed to update status')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this order?')) return
    try {
      const response = await deleteAdminOrder(id)
      if (response.success) {
        if (orders.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1)
          fetchOrders(currentPage - 1)
        } else {
          fetchOrders(currentPage)
        }
      }
    } catch (err) {
      alert('Failed to delete order')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700'
      case 'confirmed': return 'bg-blue-100 text-blue-700'
      case 'processing': return 'bg-purple-100 text-purple-700'
      case 'shipped': return 'bg-cyan-100 text-cyan-700'
      case 'delivered': return 'bg-green-100 text-green-700'
      case 'cancelled': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  // Only show full error state if we have no orders at all
  if (error && orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-gray-600 mb-4">{error}</p>
        <button onClick={() => fetchOrders(1)} className="btn-primary">Retry</button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-500 mt-1">Manage and track customer orders</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Search orders..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">Order ID</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">Customer</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600 hidden sm:table-cell">Items</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">Amount</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600 hidden md:table-cell">Date</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No orders found</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  // Get customer from customerDetails (new) or populated customerId (old)
                  const customer = order.customerDetails ||
                    (order.customerId && typeof order.customerId === 'object' ? order.customerId : {}) || {}
                  const customerName = customer.firmName || customer.name || 'N/A'

                  return (
                  <tr key={order._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-6 py-4 text-sm text-gray-600">#{order.orderId || order._id?.slice(-8).toUpperCase()}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{customerName}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 hidden sm:table-cell">{order.items?.length || 0} items</td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      ₹{order.grandTotal?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleViewOrder(order)} className="p-2 hover:bg-gray-100 rounded-lg" title="View">
                          <Eye className="w-4 h-4 text-gray-500" />
                        </button>
                        <button onClick={() => handleDelete(order._id)} className="p-2 hover:bg-red-50 rounded-lg" title="Delete">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )})
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

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setSelectedOrder(null) }}
        title="Order Details" size="lg">
        <OrderDetailModal order={selectedOrder} onClose={() => { setShowModal(false); setSelectedOrder(null) }}
          onStatusChange={handleStatusChange} loading={actionLoading} />
      </Modal>
    </div>
  )
}