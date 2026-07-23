import { useState, useEffect } from 'react'
import { Search, Plus, Edit2, Trash2, Loader, AlertCircle, FolderTree, ChevronDown, ChevronUp, Tag } from 'lucide-react'
import { getCategories, createCategory, updateCategory, deleteCategory, getBrands } from '../services/adminApi'
import Pagination from '../components/Pagination'
import Modal from '../components/Modal'
import { useToast } from '../components/Toast'

// Category Form Component
function CategoryForm({ category, onSubmit, onCancel, loading, brands }) {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    active: category?.active ?? true,
    brands: category?.brands?.map(b => b._id || b) || []
  })
  const [error, setError] = useState('')
  const [showBrandsDropdown, setShowBrandsDropdown] = useState(false)

  // Get selected brand names for display
  const selectedBrands = brands?.filter(b => formData.brands.includes(b._id)) || []

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value })
    setError('')
  }

  const toggleBrand = (brandId) => {
    setFormData(prev => ({
      ...prev,
      brands: prev.brands.includes(brandId)
        ? prev.brands.filter(id => id !== brandId)
        : [...prev.brands, brandId]
    }))
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

      {/* Brands Multi-Select */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Linked Brands</label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowBrandsDropdown(!showBrandsDropdown)}
            className="w-full input-field text-left flex items-center justify-between"
          >
            <span className={selectedBrands.length > 0 ? 'text-gray-900' : 'text-gray-400'}>
              {selectedBrands.length > 0
                ? `${selectedBrands.length} brand${selectedBrands.length > 1 ? 's' : ''} selected`
                : 'Select brands'}
            </span>
            {showBrandsDropdown ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {showBrandsDropdown && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {brands && brands.length > 0 ? (
                <div className="py-1">
                  {brands.map((brand) => (
                    <label
                      key={brand._id}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.brands.includes(brand._id)}
                        onChange={() => toggleBrand(brand._id)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{brand.name}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500">No brands available</div>
              )}
            </div>
          )}
        </div>

        {/* Selected Brands Display */}
        {selectedBrands.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {selectedBrands.map((brand) => (
              <span
                key={brand._id}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
              >
                {brand.name}
                <button
                  type="button"
                  onClick={() => toggleBrand(brand._id)}
                  className="hover:text-blue-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
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
  const toast = useToast()
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
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

  // Fetch brands on mount
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await getBrands({ limit: 999 })
        if (response.success !== false) {
          setBrands(response.data || [])
        }
      } catch (err) {
        console.error('Failed to fetch brands:', err)
      }
    }
    fetchBrands()
  }, [])

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
        toast.success('Category created successfully')
      } else {
        toast.error(response.message || 'Failed to create category')
      }
    } catch (err) {
      toast.error('Failed to create category')
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
        toast.success('Category updated successfully')
      } else {
        toast.error(response.message || 'Failed to update category')
      }
    } catch (err) {
      toast.error('Failed to update category')
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
        toast.success('Category deleted successfully')
      } else {
        toast.error(response.message || 'Failed to delete category')
      }
    } catch (err) {
      toast.error('Failed to delete category')
    }
  }

  // Helper to get brand names from category
  const getCategoryBrands = (category) => {
    if (!category.brands || category.brands.length === 0) return []
    return category.brands.map(b => typeof b === 'object' ? b.name : b)
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
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-500 mt-1">Manage product categories and link brands</p>
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
              <table className="w-full min-w-[600px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Linked Brands</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Created</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {categories.map((category) => {
                    const categoryBrands = getCategoryBrands(category)
                    return (
                      <tr key={category._id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-medium text-gray-900">{category.name}</span>
                        </td>
                        <td className="py-3 px-4">
                          {categoryBrands.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {categoryBrands.slice(0, 3).map((brandName, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full"
                                >
                                  <Tag className="w-3 h-3" />
                                  {brandName}
                                </span>
                              ))}
                              {categoryBrands.length > 3 && (
                                <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                  +{categoryBrands.length - 3} more
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">No brands linked</span>
                          )}
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
                    )
                  })}
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
        size="lg"
      >
        <CategoryForm
          category={selectedCategory}
          onSubmit={selectedCategory ? handleUpdate : handleCreate}
          onCancel={() => { setShowModal(false); setSelectedCategory(null) }}
          loading={formLoading}
          brands={brands}
        />
      </Modal>
    </div>
  )
}