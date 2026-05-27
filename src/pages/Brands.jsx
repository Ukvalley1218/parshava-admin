import { useState, useEffect } from 'react'
import { Search, Plus, Edit2, Trash2, X, Loader, AlertCircle, Tag, FolderTree, ChevronDown, ChevronRight, Download, RefreshCw } from 'lucide-react'
import {
  getBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  getDistinctBrandsFromProducts,
  importBrandsFromProducts,
  addCategoryToBrand,
  updateCategory,
  deleteCategory,
  addSubcategoryToCategory,
  updateSubcategory,
  deleteSubcategory
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
  })
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    // Just set the value - validation happens on submit
    setFormData({ ...formData, [name]: value })
    setError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validation
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

// Category Form Component
function CategoryForm({ onSubmit, onCancel, loading }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const value = e.target.value
    // Just set the value - validation happens on submit
    setName(value)
    setError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('Category name is required')
      return
    }
    if (name.trim().length < 2) {
      setError('Category name must be at least 2 characters')
      return
    }

    onSubmit({ name })
    setName('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-end">
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
        <input
          type="text"
          value={name}
          onChange={handleChange}
          required
          maxLength={100}
          className={`input-field ${error ? 'border-red-500' : ''}`}
          placeholder="Enter category name"
        />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
      <button type="submit" className="btn-primary px-4 py-2" disabled={loading}>
        {loading ? <Loader className="w-4 h-4 animate-spin" /> : 'Add'}
      </button>
    </form>
  )
}

// Subcategory Form Component
function SubcategoryForm({ onSubmit, onCancel, loading }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const value = e.target.value
    // Just set the value - validation happens on submit
    setName(value)
    setError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('Subcategory name is required')
      return
    }
    if (name.trim().length < 2) {
      setError('Subcategory name must be at least 2 characters')
      return
    }

    onSubmit({ name })
    setName('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-end mt-2">
      <div className="flex-1">
        <input
          type="text"
          value={name}
          onChange={handleChange}
          required
          maxLength={100}
          className={`input-field text-sm ${error ? 'border-red-500' : ''}`}
          placeholder="Enter subcategory name"
        />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
      <button type="submit" className="btn-secondary px-3 py-1.5 text-sm" disabled={loading}>
        {loading ? <Loader className="w-4 h-4 animate-spin" /> : 'Add'}
      </button>
    </form>
  )
}

// Import Modal Component
function ImportModal({ isOpen, onClose, onImport, loading }) {
  const [productBrands, setProductBrands] = useState([])
  const [productCategories, setProductCategories] = useState([])
  const [selectedBrands, setSelectedBrands] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const [loadingData, setLoadingData] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setLoadingData(true)
      getDistinctBrandsFromProducts()
        .then(res => {
          if (res.success !== false) {
            setProductBrands(res.data?.brands || [])
            setProductCategories(res.data?.categories || [])
          }
        })
        .catch(() => { })
        .finally(() => setLoadingData(false))
    }
  }, [isOpen])

  const toggleBrand = (brand) => {
    setSelectedBrands(prev =>
      prev.includes(brand)
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    )
  }

  const toggleAllBrands = () => {
    if (selectAll) {
      setSelectedBrands([])
    } else {
      setSelectedBrands([...productBrands])
    }
    setSelectAll(!selectAll)
  }

  const handleImport = () => {
    onImport(selectedBrands.length > 0 ? selectedBrands : null)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Brands from Products" size="lg">
      <div className="p-4">
        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-4">
              Select brands from existing products to import. Categories will be automatically included.
            </p>

            {productBrands.length === 0 ? (
              <div className="text-center py-8">
                <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No brands found in products. Sync products from AccountGST first.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500">{productBrands.length} brands found</span>
                  <button
                    onClick={toggleAllBrands}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {selectAll ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
                  {productBrands.map(brand => (
                    <label
                      key={brand}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedBrands.includes(brand)}
                        onChange={() => toggleBrand(brand)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">{brand}</span>
                    </label>
                  ))}
                </div>

                <div className="flex gap-3 mt-4">
                  <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                  <button
                    onClick={handleImport}
                    disabled={loading}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    {loading && <Loader className="w-4 h-4 animate-spin" />}
                    <Download className="w-4 h-4" />
                    Import {selectedBrands.length > 0 ? `(${selectedBrands.length})` : 'All'}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}

// Brand Card Component with Categories and Subcategories
function BrandCard({ brand, onEdit, onDelete, onAddCategory, onEditCategory, onDeleteCategory, onAddSubcategory, onEditSubcategory, onDeleteSubcategory }) {
  const [expanded, setExpanded] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [showSubcategoryForm, setShowSubcategoryForm] = useState({})
  const [editingCategory, setEditingCategory] = useState(null)
  const [editingSubcategory, setEditingSubcategory] = useState({})
  const [loading, setLoading] = useState(false)

  const handleAddCategory = async (data) => {
    setLoading(true)
    await onAddCategory(brand._id, data)
    setShowCategoryForm(false)
    setLoading(false)
  }

  const handleAddSubcategory = async (categoryId, data) => {
    setLoading(true)
    await onAddSubcategory(brand._id, categoryId, data)
    setShowSubcategoryForm({})
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            {expanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
          </button>
          <div>
            <h3 className="font-semibold text-gray-900">{brand.name}</h3>
            <p className="text-sm text-gray-500">{brand.categories?.length || 0} categories</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs rounded-full ${brand.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
            {brand.active ? 'Active' : 'Inactive'}
          </span>
          <button onClick={() => onEdit(brand)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Edit Brand">
            <Edit2 className="w-4 h-4 text-gray-500" />
          </button>
          <button onClick={() => onDelete(brand._id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Delete Brand">
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <FolderTree className="w-4 h-4" />
              Categories & Subcategories
            </h4>
            <button
              onClick={() => setShowCategoryForm(!showCategoryForm)}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add Category
            </button>
          </div>

          {showCategoryForm && (
            <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
              <CategoryForm onSubmit={handleAddCategory} onCancel={() => setShowCategoryForm(false)} loading={loading} />
            </div>
          )}

          {brand.categories?.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No categories added yet</p>
          ) : (
            <div className="space-y-2">
              {brand.categories.map((category, idx) => (
                <div key={category._id || idx} className="bg-white rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{category.name}</span>
                      <span className={`px-2 py-0.5 text-xs rounded ${category.active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                        {category.subcategories?.length || 0} subcategories
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setShowSubcategoryForm({ [category._id || idx]: !showSubcategoryForm[category._id || idx] })}
                        className="p-1.5 hover:bg-blue-50 rounded text-blue-600"
                        title="Add Subcategory"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onEditCategory(brand._id, category._id || idx, { active: !category.active })}
                        className={`p-1.5 hover:bg-gray-100 rounded ${category.active ? 'text-green-600' : 'text-gray-400'}`}
                        title={category.active ? 'Deactivate' : 'Activate'}
                      >
                        <Tag className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteCategory(brand._id, category._id || idx)}
                        className="p-1.5 hover:bg-red-50 rounded text-red-500"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {showSubcategoryForm[category._id || idx] && (
                    <div className="mb-2 pl-4">
                      <SubcategoryForm
                        onSubmit={(data) => handleAddSubcategory(category._id || idx, data)}
                        onCancel={() => setShowSubcategoryForm({})}
                        loading={loading}
                      />
                    </div>
                  )}

                  {category.subcategories?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2 pl-4">
                      {category.subcategories.map((sub, subIdx) => (
                        <div
                          key={sub._id || subIdx}
                          className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm group"
                        >
                          <span className={sub.active ? 'text-gray-700' : 'text-gray-400'}>{sub.name}</span>
                          <button
                            onClick={() => onDeleteSubcategory(brand._id, category._id || idx, sub._id || subIdx)}
                            className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Brands() {
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState(null)
  const [formLoading, setFormLoading] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    limit: 10,
  })

  const fetchBrands = async (page = currentPage, limit = pagination.limit) => {
    setLoading(true)
    setError(null)
    try {
      const response = await getBrands({ page, limit, search: searchQuery || undefined })
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
    fetchBrands(1)
  }, [])

  const handlePageChange = (page) => {
    setCurrentPage(page)
    fetchBrands(page)
  }

  const handleSearch = () => {
    setCurrentPage(1)
    fetchBrands(1)
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

  const handleImport = async (selectedBrands) => {
    setFormLoading(true)
    try {
      const response = await importBrandsFromProducts(selectedBrands)
      if (response.success !== false) {
        alert(response.message || 'Brands imported successfully')
        setShowImportModal(false)
        fetchBrands(1)
      } else {
        alert(response.message || 'Failed to import brands')
      }
    } catch (err) {
      alert('Failed to import brands')
    } finally {
      setFormLoading(false)
    }
  }

  const handleAddCategory = async (brandId, data) => {
    try {
      const response = await addCategoryToBrand(brandId, data)
      if (response.success !== false) {
        setBrands(prev => prev.map(b => b._id === brandId ? response.data : b))
      } else {
        alert(response.message || 'Failed to add category')
      }
    } catch (err) {
      alert('Failed to add category')
    }
  }

  const handleEditCategory = async (brandId, categoryId, data) => {
    try {
      const response = await updateCategory(brandId, categoryId, data)
      if (response.success !== false) {
        setBrands(prev => prev.map(b => b._id === brandId ? response.data : b))
      }
    } catch (err) {
      alert('Failed to update category')
    }
  }

  const handleDeleteCategory = async (brandId, categoryId) => {
    if (!confirm('Delete this category and all its subcategories?')) return
    try {
      const response = await deleteCategory(brandId, categoryId)
      if (response.success !== false) {
        setBrands(prev => prev.map(b => b._id === brandId ? response.data : b))
      }
    } catch (err) {
      alert('Failed to delete category')
    }
  }

  const handleAddSubcategory = async (brandId, categoryId, data) => {
    try {
      const response = await addSubcategoryToCategory(brandId, categoryId, data)
      if (response.success !== false) {
        setBrands(prev => prev.map(b => b._id === brandId ? response.data : b))
      } else {
        alert(response.message || 'Failed to add subcategory')
      }
    } catch (err) {
      alert('Failed to add subcategory')
    }
  }

  const handleDeleteSubcategory = async (brandId, categoryId, subcategoryId) => {
    try {
      const response = await deleteSubcategory(brandId, categoryId, subcategoryId)
      if (response.success !== false) {
        setBrands(prev => prev.map(b => b._id === brandId ? response.data : b))
      }
    } catch (err) {
      alert('Failed to delete subcategory')
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
        <button onClick={() => fetchBrands(1)} className="btn-primary">Retry</button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Brands & Categories</h1>
          <p className="text-gray-500 mt-1">Manage brands, categories, and subcategories for products</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setShowImportModal(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Import from Products
          </button>
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
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search brands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <button onClick={handleSearch} className="btn-secondary">Search</button>
        </div>
      </div>

      {brands.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-2">No brands found</p>
          <p className="text-sm text-gray-400">Import from existing products or add a new brand</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {brands.map(brand => (
              <BrandCard
                key={brand._id}
                brand={brand}
                onEdit={(b) => { setSelectedBrand(b); setShowModal(true) }}
                onDelete={handleDelete}
                onAddCategory={handleAddCategory}
                onEditCategory={handleEditCategory}
                onDeleteCategory={handleDeleteCategory}
                onAddSubcategory={handleAddSubcategory}
                onEditSubcategory={() => { }}
                onDeleteSubcategory={handleDeleteSubcategory}
              />
            ))}
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

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImport}
        loading={formLoading}
      />
    </div>
  )
}