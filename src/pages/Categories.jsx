import { useState, useEffect } from 'react'
import { Search, Plus, Edit2, Trash2, X, Loader, AlertCircle, FolderTree } from 'lucide-react'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/adminApi'
import Pagination from '../components/Pagination'

// Modal Component
function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl animate-fadeIn max-h-[90vh] overflow-y-auto"
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

// Category Form Component
function CategoryForm({ category, onSubmit, onCancel, loading }) {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    active: category?.active ?? true
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
      setError('Category name is required')
      return
    }
    if (formData.name.trim().length < 2) {
      setError('Category name must be at least 2 characters')
      return
    }
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          maxLength={100}
          className={`input-field ${error ? 'border-red-500' : ''}`}
          placeholder="Enter category name"
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
          {category ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  )
}

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
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
      const response = await getCategories({ page, limit, search: debouncedSearch || undefined })
      if (response.success !== false) {
        setCategories(response.data || [])
        setPagination({
          total: response.pagination?.totalItems || 0,
          totalPages: response.pagination?.totalPages || 1,
          limit: response.pagination?.limit || 10,
        })
      } else {
        setError(response.message || 'Failed to fetch categories')
      }
    } catch (err) {
      setError('Failed to fetch categories')
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
      const response = await createCategory(data)
      if (response.success !== false) {
        fetchCategories(currentPage)
        setShowModal(false)
        setSelectedCategory(null)
      } else {
        alert(response.message || 'Failed to create category')
      }
    } catch (err) {
      alert('Failed to create category')
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdate = async (data) => {
    setFormLoading(true)
    try {
      const response = await updateCategory(selectedCategory._id, data)
      if (response.success !== false) {
        setCategories(prev => prev.map(c => c._id === selectedCategory._id ? response.data : c))
        setShowModal(false)
        setSelectedCategory(null)
      } else {
        alert(response.message || 'Failed to update category')
      }
    } catch (err) {
      alert('Failed to update category')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this category? This will also delete all subcategories and series linked to it.')) return
    try {
      const response = await deleteCategory(id)
      if (response.success !== false) {
        fetchCategories(currentPage)
      } else {
        alert(response.message || 'Failed to delete category')
      }
    } catch (err) {
      alert('Failed to delete category')
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
        <button onClick={() => fetchCategories(1)} className="btn-primary">Retry</button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-500 mt-1">Manage product categories independently</p>
        </div>
        <button
          onClick={() => { setSelectedCategory(null); setShowModal(true) }}
          className="btn-primary flex items-center gap-2 whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          Add Category
        </button>
      </div>

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

      {categories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <FolderTree className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-2">No categories found</p>
          <p className="text-sm text-gray-400">Create your first category to get started</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Created</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {categories.map((category) => (
                    <tr key={category._id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900">{category.name}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${category.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {category.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {new Date(category.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setSelectedCategory(category); setShowModal(true) }}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4 text-gray-500" />
                          </button>
                          <button
                            onClick={() => handleDelete(category._id)}
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
        onClose={() => { setShowModal(false); setSelectedCategory(null) }}
        title={selectedCategory ? 'Edit Category' : 'Add Category'}
      >
        <CategoryForm
          category={selectedCategory}
          onSubmit={selectedCategory ? handleUpdate : handleCreate}
          onCancel={() => { setShowModal(false); setSelectedCategory(null) }}
          loading={formLoading}
        />
      </Modal>
    </div>
  )
}