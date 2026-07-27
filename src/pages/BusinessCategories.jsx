import { useState, useEffect } from 'react'
import { Plus, Search, Edit2, Trash2, Loader, AlertCircle } from 'lucide-react'
import {
  getBusinessCategories,
  createBusinessCategory,
  updateBusinessCategory,
  deleteBusinessCategory
} from '../services/adminApi'
import Pagination from '../components/Pagination'
import Modal from '../components/Modal'
import { useToast } from '../components/Toast'

export default function BusinessCategories() {
  const toast = useToast()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
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

  const fetchCategories = async (page = currentPage, limit = pagination.limit) => {
    setLoading(true)
    setError(null)
    try {
      const params = { page, limit }
      if (debouncedSearch) params.search = debouncedSearch

      const response = await getBusinessCategories(params)
      if (response.success !== false) {
        setCategories(response.data || [])
        if (response.pagination) {
          setPagination({
            total: response.pagination.totalItems || response.pagination.total || 0,
            totalPages: response.pagination.totalPages || 1,
            limit: response.pagination.itemsPerPage || response.pagination.limit || 10,
          })
        }
      } else {
        setError(response.message || 'Failed to fetch business categories')
      }
    } catch (err) {
      setError('Failed to fetch business categories')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setCurrentPage(1)
    fetchCategories(1)
  }, [debouncedSearch])

  useEffect(() => {
    fetchCategories(1)
  }, [])

  const handlePageChange = (page) => {
    setCurrentPage(page)
    fetchCategories(page)
  }

  const handleCreate = async (data) => {
    setFormLoading(true)
    try {
      const response = await createBusinessCategory(data)
      if (response.success !== false) {
        fetchCategories(currentPage)
        setShowModal(false)
        setSelectedCategory(null)
        toast.success('Business category created successfully')
      } else {
        toast.error(response.message || 'Failed to create business category')
      }
    } catch (err) {
      const message = typeof err === 'object' && err !== null ? err.message : err
      toast.error(message || 'Failed to create business category')
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdate = async (data) => {
    setFormLoading(true)
    try {
      const response = await updateBusinessCategory(selectedCategory._id, data)
      if (response.success !== false) {
        setCategories(prev => prev.map(c => c._id === selectedCategory._id ? response.data : c))
        setShowModal(false)
        setSelectedCategory(null)
        toast.success('Business category updated successfully')
      } else {
        toast.error(response.message || 'Failed to update business category')
      }
    } catch (err) {
      const message = typeof err === 'object' && err !== null ? err.message : err
      toast.error(message || 'Failed to update business category')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    setFormLoading(true)
    try {
      const response = await deleteBusinessCategory(selectedCategory._id)
      if (response.success !== false) {
        setCategories(prev => prev.filter(c => c._id !== selectedCategory._id))
        setShowDeleteModal(false)
        setSelectedCategory(null)
        toast.success('Business category deleted successfully')
      } else {
        toast.error(response.message || 'Failed to delete business category')
      }
    } catch (err) {
      const message = typeof err === 'object' && err !== null ? err.message : err
      toast.error(message || 'Failed to delete business category')
    } finally {
      setFormLoading(false)
    }
  }

  // Form Component
  function CategoryForm({ category, onSubmit, onCancel, loading }) {
    const [formData, setFormData] = useState({
      name: category?.name || '',
      description: category?.description || '',
      active: category?.active ?? true
    })

    const handleSubmit = (e) => {
      e.preventDefault()
      onSubmit(formData)
    }

    return (
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="input-field"
            placeholder="Enter category name"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="input-field"
            rows="3"
            placeholder="Enter description (optional)"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="active"
            checked={formData.active}
            onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
            className="w-4 h-4"
          />
          <label htmlFor="active" className="text-sm text-gray-700">Active</label>
        </div>
        <div className="flex gap-3 pt-4">
          <button type="button" onClick={onCancel} className="btn-secondary flex-1" disabled={loading}>Cancel</button>
          <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={loading}>
            {loading && <Loader className="w-4 h-4 animate-spin" />}
            {category ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    )
  }

  // Only show full error state if we have no categories at all
  if (error && categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-gray-600 mb-4">{error}</p>
        <button onClick={() => fetchCategories(1)} className="btn-primary">Retry</button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Categories</h1>
          <p className="text-gray-500 mt-1">Manage business categories for accounts</p>
        </div>
        <button onClick={() => { setSelectedCategory(null); setShowModal(true) }} className="btn-primary flex items-center gap-2 whitespace-nowrap">
          <Plus className="w-5 h-5" />
          Add Category
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Name</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Description</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12">
                    <p className="text-gray-500">No business categories found</p>
                  </td>
                </tr>
              ) : (
                categories.map(category => (
                  <tr key={category._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{category.name}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {category.description || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${category.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {category.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setSelectedCategory(category); setShowModal(true) }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => { setSelectedCategory(category); setShowDeleteModal(true) }}
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
        onClose={() => { setShowModal(false); setSelectedCategory(null) }}
        title={selectedCategory ? 'Edit Business Category' : 'Add Business Category'}
      >
        <CategoryForm
          category={selectedCategory}
          onSubmit={selectedCategory ? handleUpdate : handleCreate}
          onCancel={() => { setShowModal(false); setSelectedCategory(null) }}
          loading={formLoading}
        />
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setSelectedCategory(null) }} title="Delete Business Category">
        <div className="p-6">
          <p className="text-gray-600 mb-4">Are you sure you want to delete "{selectedCategory?.name}"?</p>
          <div className="flex gap-3">
            <button onClick={() => { setShowDeleteModal(false); setSelectedCategory(null) }} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleDelete} className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={formLoading}>
              {formLoading && <Loader className="w-4 h-4 animate-spin" />}
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}