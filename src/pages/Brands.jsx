import { useState, useEffect } from 'react'
import { Search, Plus, Edit2, Trash2, X, Loader, AlertCircle, Tag } from 'lucide-react'
import {
  getBrands,
  createBrand,
  updateBrand,
  deleteBrand
} from '../services/adminApi'
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

// Brand Form Component
function BrandForm({ brand, onSubmit, onCancel, loading }) {
  const [formData, setFormData] = useState({
    name: brand?.name || '',
    active: brand?.active ?? true
  })
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value })
    setError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      setError('Brand name is required')
      return
    }
    if (formData.name.trim().length < 2) {
      setError('Brand name must be at least 2 characters')
      return
    }
    if (formData.name.trim().length > 100) {
      setError('Brand name must be less than 100 characters')
      return
    }

    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name *</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          maxLength={100}
          className={`input-field ${error ? 'border-red-500' : ''}`}
          placeholder="Enter brand name"
        />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="active"
          id="active"
          checked={formData.active}
          onChange={handleChange}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="active" className="text-sm text-gray-700">Active</label>
      </div>
      <div className="flex gap-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1" disabled={loading}>Cancel</button>
        <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={loading}>
          {loading && <Loader className="w-4 h-4 animate-spin" />}
          {brand ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  )
}

export default function Brands() {
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState(null)
  const [formLoading, setFormLoading] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    limit: 10,
  })

  // Debounce search - trigger API after 300ms of no typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchBrands = async (page = currentPage, limit = pagination.limit) => {
    setLoading(true)
    setError(null)
    try {
      const response = await getBrands({ page, limit, search: debouncedSearch || undefined })
      if (response.success !== false) {
        setBrands(response.data || [])
        setPagination({
          total: response.pagination?.totalItems || 0,
          totalPages: response.pagination?.totalPages || 1,
          limit: response.pagination?.limit || 10,
        })
      } else {
        setError(response.message || 'Failed to fetch brands')
      }
    } catch (err) {
      setError('Failed to fetch brands')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setCurrentPage(1)
    fetchBrands(1)
  }, [debouncedSearch])

  useEffect(() => {
    fetchBrands(1)
  }, [])

  const handlePageChange = (page) => {
    setCurrentPage(page)
    fetchBrands(page)
  }

  const handleCreate = async (data) => {
    setFormLoading(true)
    try {
      const response = await createBrand(data)
      if (response.success !== false) {
        fetchBrands(currentPage)
        setShowModal(false)
        setSelectedBrand(null)
      } else {
        alert(response.message || 'Failed to create brand')
      }
    } catch (err) {
      alert('Failed to create brand')
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdate = async (data) => {
    setFormLoading(true)
    try {
      const response = await updateBrand(selectedBrand._id, data)
      if (response.success !== false) {
        setBrands(prev => prev.map(b => b._id === selectedBrand._id ? response.data : b))
        setShowModal(false)
        setSelectedBrand(null)
      } else {
        alert(response.message || 'Failed to update brand')
      }
    } catch (err) {
      alert('Failed to update brand')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this brand?')) return
    try {
      const response = await deleteBrand(id)
      if (response.success !== false) {
        fetchBrands(currentPage)
      } else {
        alert(response.message || 'Failed to delete brand')
      }
    } catch (err) {
      alert('Failed to delete brand')
    }
  }

  // Only show full error state if we have no brands at all
  if (error && brands.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-gray-600 mb-4">{error}</p>
        <button onClick={() => fetchBrands(1)} className="btn-primary">Retry</button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Brands</h1>
          <p className="text-gray-500 mt-1">Manage product brands</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => { setSelectedBrand(null); setShowModal(true) }}
            className="btn-primary flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            Add Brand
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search brands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {brands.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-2">No brands found</p>
          <p className="text-sm text-gray-400">Create your first brand to get started</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Name</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Created</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {brands.map((brand) => (
                    <tr key={brand._id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900">{brand.name}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${brand.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {brand.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {new Date(brand.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setSelectedBrand(brand); setShowModal(true) }}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4 text-gray-500" />
                          </button>
                          <button
                            onClick={() => handleDelete(brand._id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            onPageChange={handlePageChange}
          />
        </>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setSelectedBrand(null) }}
        title={selectedBrand ? 'Edit Brand' : 'Add Brand'}
      >
        <BrandForm
          brand={selectedBrand}
          onSubmit={selectedBrand ? handleUpdate : handleCreate}
          onCancel={() => { setShowModal(false); setSelectedBrand(null) }}
          loading={formLoading}
        />
      </Modal>
    </div>
  )
}