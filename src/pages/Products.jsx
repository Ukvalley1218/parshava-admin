import { useState, useEffect } from 'react'
import { Search, Plus, Edit2, Trash2, X, Loader, AlertCircle, Package, RefreshCw } from 'lucide-react'
import { getAdminProducts, createAdminProduct, updateAdminProduct, deleteAdminProduct, syncProducts } from '../services/adminApi'
import Pagination from '../components/Pagination'

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

// Product Form Component
function ProductForm({ product, onSubmit, onCancel, loading }) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    sku: product?.sku || product?.partNumber || '',
    category: product?.category || '',
    brand: product?.brand || '',
    mrp: product?.mrp || '',
    sellingPrice: product?.sellingPrice || '',
    stock: product?.stock || 0,
    gstRate: product?.gstRate || 18,
    description: product?.description || '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      mrp: parseFloat(formData.mrp) || 0,
      sellingPrice: parseFloat(formData.sellingPrice) || 0,
      stock: parseInt(formData.stock) || 0,
      gstRate: parseFloat(formData.gstRate) || 18,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required
            className="input-field" placeholder="Enter product name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SKU / Part Number</label>
          <input type="text" name="sku" value={formData.sku} onChange={handleChange}
            className="input-field" placeholder="Enter SKU" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
          <input type="text" name="brand" value={formData.brand} onChange={handleChange}
            className="input-field" placeholder="Enter brand" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <input type="text" name="category" value={formData.category} onChange={handleChange}
            className="input-field" placeholder="Enter category" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">GST Rate (%)</label>
          <select name="gstRate" value={formData.gstRate} onChange={handleChange} className="input-field">
            <option value="0">0%</option>
            <option value="5">5%</option>
            <option value="12">12%</option>
            <option value="18">18%</option>
            <option value="28">28%</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">MRP (₹) *</label>
          <input type="number" name="mrp" value={formData.mrp} onChange={handleChange} required min="0" step="0.01"
            className="input-field" placeholder="Enter MRP" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (₹)</label>
          <input type="number" name="sellingPrice" value={formData.sellingPrice} onChange={handleChange} min="0" step="0.01"
            className="input-field" placeholder="Enter selling price" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
          <input type="number" name="stock" value={formData.stock} onChange={handleChange} min="0"
            className="input-field" placeholder="Enter stock quantity" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea name="description" value={formData.description} onChange={handleChange} rows="3"
            className="input-field" placeholder="Enter product description" />
        </div>
      </div>
      <div className="flex gap-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1" disabled={loading}>Cancel</button>
        <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={loading}>
          {loading && <Loader className="w-4 h-4 animate-spin" />}
          {product ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  )
}

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [brandFilter, setBrandFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    limit: 10,
  })

  const fetchProducts = async (page = currentPage, limit = pagination.limit) => {
    setLoading(true)
    setError(null)
    try {
      const response = await getAdminProducts({ page, limit, brand: brandFilter, category: categoryFilter })
      if (response.success !== false) {
        // Handle both paginated and non-paginated responses
        if (response.pagination) {
          setProducts(response.data || [])
          setPagination({
            total: response.pagination.total || 0,
            totalPages: response.pagination.totalPages || 1,
            limit: response.pagination.limit || 10,
          })
        } else {
          // Fallback for non-paginated API response
          setProducts(response.data || response.products || [])
          setPagination({
            total: (response.data || response.products || []).length,
            totalPages: 1,
            limit: 9999,
          })
        }
      } else {
        setError(response.message || 'Failed to fetch products')
      }
    } catch (err) {
      setError('Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts(1)
  }, [brandFilter, categoryFilter])

  const handlePageChange = (page) => {
    setCurrentPage(page)
    fetchProducts(page)
  }

  // Client-side search filter (for immediate feedback)
  const filteredProducts = products.filter((p) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      p.name?.toLowerCase().includes(query) ||
      p.sku?.toLowerCase().includes(query) ||
      p.partNumber?.toLowerCase().includes(query) ||
      p.brand?.toLowerCase().includes(query) ||
      p.category?.toLowerCase().includes(query)
    )
  })

  const brands = [...new Set(products.map((p) => p.brand).filter(Boolean))]
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))]

  const handleSync = async () => {
    setSyncing(true)
    try {
      const response = await syncProducts()
      if (response.success) {
        alert('Products synced successfully!')
        fetchProducts(currentPage)
      } else {
        alert(response.message || 'Failed to sync products')
      }
    } catch (err) {
      alert('Failed to sync products')
    } finally {
      setSyncing(false)
    }
  }

  const handleCreate = async (data) => {
    setFormLoading(true)
    try {
      const response = await createAdminProduct(data)
      if (response.success) {
        fetchProducts(currentPage)
        setShowModal(false)
        setSelectedProduct(null)
      } else {
        alert(response.message || 'Failed to create product')
      }
    } catch (err) {
      alert('Failed to create product')
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdate = async (data) => {
    setFormLoading(true)
    try {
      const response = await updateAdminProduct(selectedProduct._id, data)
      if (response.success) {
        setProducts((prev) => prev.map((p) => p._id === selectedProduct._id ? response.data : p))
        setShowModal(false)
        setSelectedProduct(null)
      } else {
        alert(response.message || 'Failed to update product')
      }
    } catch (err) {
      alert('Failed to update product')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    try {
      const response = await deleteAdminProduct(id)
      if (response.success) {
        if (products.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1)
          fetchProducts(currentPage - 1)
        } else {
          fetchProducts(currentPage)
        }
      } else {
        alert(response.message || 'Failed to delete product')
      }
    } catch (err) {
      alert('Failed to delete product')
    }
  }

  if (loading && currentPage === 1) {
    return <div className="flex items-center justify-center h-64"><Loader className="w-8 h-8 animate-spin text-gray-400" /></div>
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-gray-600 mb-4">{error}</p>
        <button onClick={() => fetchProducts(1)} className="btn-primary">Retry</button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 mt-1">Manage your product catalog</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={handleSync} disabled={syncing}
            className="btn-secondary flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            Sync
          </button>
          <button onClick={() => { setSelectedProduct(null); setShowModal(true) }} className="btn-primary flex items-center gap-2 whitespace-nowrap">
            <Plus className="w-5 h-5" />
            Add Product
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Search products..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
          </div>
          <select value={brandFilter} onChange={(e) => { setBrandFilter(e.target.value); setCurrentPage(1) }}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
            <option value="">All Brands</option>
            {brands.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1) }}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Product</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 hidden md:table-cell">SKU</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 hidden lg:table-cell">Brand</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 hidden lg:table-cell">Category</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">MRP</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600 hidden sm:table-cell">Stock</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No products found</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{product.name}</p>
                      {product.description && <p className="text-sm text-gray-500 truncate max-w-xs">{product.description}</p>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 hidden md:table-cell">{product.sku || product.partNumber || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 hidden lg:table-cell">{product.brand || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 hidden lg:table-cell">{product.category || '-'}</td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                      ₹{(product.mrp || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-right hidden sm:table-cell">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.stock > 10 ? 'bg-green-100 text-green-700' :
                        product.stock > 0 ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {product.stock || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setSelectedProduct(product); setShowModal(true) }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4 text-gray-500" />
                        </button>
                        <button onClick={() => handleDelete(product._id)}
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

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setSelectedProduct(null) }}
        title={selectedProduct ? 'Edit Product' : 'Add Product'} size="lg">
        <ProductForm product={selectedProduct} onSubmit={selectedProduct ? handleUpdate : handleCreate}
          onCancel={() => { setShowModal(false); setSelectedProduct(null) }} loading={formLoading} />
      </Modal>
    </div>
  )
}