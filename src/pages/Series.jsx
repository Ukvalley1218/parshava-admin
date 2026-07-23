import { useState, useEffect } from 'react'
import { Search, Plus, Edit2, Trash2, Loader, AlertCircle, Layers, ChevronDown, ChevronUp, LayersIcon } from 'lucide-react'
import { getSeries, createSeries, updateSeries, deleteSeries, getCategories, addSubSeries, updateSubSeries, deleteSubSeries } from '../services/adminApi'
import Pagination from '../components/Pagination'
import Modal from '../components/Modal'
import { useToast } from '../components/Toast'

// Series Form Component
function SeriesForm({ series, categories, onSubmit, onCancel, loading }) {
  const [formData, setFormData] = useState({
    name: series?.name || '',
    category: series?.category?._id || series?.category || '',
    active: series?.active ?? true
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
      setError('Series name is required')
      return
    }
    if (!formData.category) {
      setError('Please select a category')
      return
    }
    if (formData.name.trim().length < 2) {
      setError('Series name must be at least 2 characters')
      return
    }
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
        <div className="relative">
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={`input-field appearance-none pr-10 ${error && !formData.category ? 'border-red-500' : ''}`}
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>
        {error && !formData.category && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Series Name *</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          maxLength={100}
          className={`input-field ${error && !formData.name.trim() && formData.category ? 'border-red-500' : ''}`}
          placeholder="Enter series name"
        />
        {error && formData.category && <p className="text-xs text-red-500 mt-1">{error}</p>}
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
          {series ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  )
}

// Sub-Series Form Component
function SubSeriesForm({ onSubmit, onCancel, loading, nextCode }) {
  const [formData, setFormData] = useState({ name: '' })
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setError('Sub-series name is required')
      return
    }
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Sub-Series Name *</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setError('') }}
          required
          maxLength={50}
          className="input-field"
          placeholder="e.g., Standard, Premium, Basic"
        />
      </div>
      <div className="bg-blue-50 p-3 rounded-lg">
        <p className="text-sm text-blue-700">
          <span className="font-medium">Auto-generated Code:</span>{' '}
          <span className="bg-blue-100 px-2 py-0.5 rounded font-mono">{nextCode || 'S1'}</span>
        </p>
        <p className="text-xs text-blue-500 mt-1">Code is assigned automatically based on sequence</p>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1" disabled={loading}>Cancel</button>
        <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={loading}>
          {loading && <Loader className="w-4 h-4 animate-spin" />}
          Add Sub-Series
        </button>
      </div>
    </form>
  )
}

// Sub-Series List Component
function SubSeriesList({ series, onRefresh, onLoadingChange }) {
  const toast = useToast()
  const [expanded, setExpanded] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(false)

  // Calculate next code (S1, S2, S3...)
  const nextCode = `S${(series.subSeries?.length || 0) + 1}`

  const handleAddSubSeries = async (data) => {
    setLoading(true)
    onLoadingChange?.(true)
    try {
      const response = await addSubSeries(series._id, data)
      if (response.success !== false) {
        toast.success('Sub-Series added successfully')
        onRefresh()
        setShowAddModal(false)
      } else {
        toast.error(response.message || 'Failed to add sub-series')
      }
    } catch (err) {
      toast.error('Failed to add sub-series')
    } finally {
      setLoading(false)
      onLoadingChange?.(false)
    }
  }

  const handleToggleActive = async (subSeries) => {
    setLoading(true)
    onLoadingChange?.(true)
    try {
      const response = await updateSubSeries(series._id, subSeries._id, { active: !subSeries.active })
      if (response.success !== false) {
        toast.success('Sub-Series updated successfully')
        onRefresh()
      } else {
        toast.error(response.message || 'Failed to update sub-series')
      }
    } catch (err) {
      toast.error('Failed to update sub-series')
    } finally {
      setLoading(false)
      onLoadingChange?.(false)
    }
  }

  const handleDeleteSubSeries = async (subSeries) => {
    if (!confirm(`Delete sub-series "${subSeries.code} - ${subSeries.name}"?`)) return
    setLoading(true)
    onLoadingChange?.(true)
    try {
      const response = await deleteSubSeries(series._id, subSeries._id)
      if (response.success !== false) {
        toast.success('Sub-Series deleted successfully')
        onRefresh()
      } else {
        toast.error(response.message || 'Failed to delete sub-series')
      }
    } catch (err) {
      toast.error('Failed to delete sub-series')
    } finally {
      setLoading(false)
      onLoadingChange?.(false)
    }
  }

  const subSeriesCount = series.subSeries?.length || 0

  return (
    <div className="mt-2">
      {/* Expand/Collapse Button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
      >
        {expanded ? (
          <>
            <ChevronUp className="w-4 h-4" />
            <span>Hide Sub-Series ({subSeriesCount})</span>
          </>
        ) : (
          <>
            <ChevronDown className="w-4 h-4" />
            <span>Show Sub-Series ({subSeriesCount})</span>
          </>
        )}
      </button>

      {/* Sub-Series List */}
      {expanded && (
        <div className="mt-2 pl-4 border-l-2 border-gray-200">
          <div className="flex flex-wrap gap-2 mb-2">
            {series.subSeries?.map((sub) => (
              <div
                key={sub._id}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                  sub.active ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-gray-100 text-gray-500 border border-gray-200'
                }`}
              >
                <span className="bg-white px-1.5 py-0.5 rounded font-mono font-bold">{sub.code}</span>
                <span>{sub.name}</span>
                <button
                  onClick={() => handleToggleActive(sub)}
                  className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    sub.active ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-400 text-white hover:bg-gray-500'
                  }`}
                  title={sub.active ? 'Deactivate' : 'Activate'}
                >
                  {sub.active ? 'ON' : 'OFF'}
                </button>
                <button
                  onClick={() => handleDeleteSubSeries(sub)}
                  className="p-0.5 hover:bg-red-100 rounded text-red-500"
                  title="Delete"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {(!series.subSeries || series.subSeries.length === 0) && (
              <span className="text-xs text-gray-400 italic">No sub-series added yet</span>
            )}
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
          >
            <Plus className="w-3 h-3" />
            Add Sub-Series
          </button>

          {/* Add Sub-Series Modal */}
          <Modal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            title="Add Sub-Series"
          >
            <SubSeriesForm
              onSubmit={handleAddSubSeries}
              onCancel={() => setShowAddModal(false)}
              loading={loading}
              nextCode={nextCode}
            />
          </Modal>
        </div>
      )}
    </div>
  )
}

export default function Series() {
  const toast = useToast()
  const [seriesList, setSeriesList] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedSeries, setSelectedSeries] = useState(null)
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

  const fetchCategories = async () => {
    try {
      const response = await getCategories({ limit: 100 })
      if (response.success !== false) {
        setCategories(response.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    }
  }

  const fetchSeries = async (page = currentPage, limit = pagination.limit) => {
    setLoading(true)
    setError(null)
    try {
      const params = { page, limit, search: debouncedSearch || undefined }
      if (selectedCategory) {
        params.category = selectedCategory
      }
      const response = await getSeries(params)
      if (response.success !== false) {
        setSeriesList(response.data || [])
        setPagination({
          total: response.pagination?.totalItems || 0,
          totalPages: response.pagination?.totalPages || 1,
          limit: response.pagination?.limit || 10,
        })
      } else {
        setError(response.message || 'Failed to fetch series')
      }
    } catch (err) {
      setError('Failed to fetch series')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
    fetchSeries(1)
  }, [])

  useEffect(() => {
    setCurrentPage(1)
    fetchSeries(1)
  }, [selectedCategory, debouncedSearch])

  const handlePageChange = (page) => {
    setCurrentPage(page)
    fetchSeries(page)
  }

  const handleCreate = async (data) => {
    setFormLoading(true)
    try {
      const response = await createSeries(data)
      if (response.success !== false) {
        toast.success('Series created successfully')
        fetchSeries(currentPage)
        setShowModal(false)
        setSelectedSeries(null)
      } else {
        toast.error(response.message || 'Failed to create series')
      }
    } catch (err) {
      toast.error('Failed to create series')
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdate = async (data) => {
    setFormLoading(true)
    try {
      const response = await updateSeries(selectedSeries._id, data)
      if (response.success !== false) {
        toast.success('Series updated successfully')
        setSeriesList(prev => prev.map(s => s._id === selectedSeries._id ? response.data : s))
        setShowModal(false)
        setSelectedSeries(null)
      } else {
        toast.error(response.message || 'Failed to update series')
      }
    } catch (err) {
      toast.error('Failed to update series')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this series?')) return
    try {
      const response = await deleteSeries(id)
      if (response.success !== false) {
        toast.success('Series deleted successfully')
        fetchSeries(currentPage)
      } else {
        toast.error(response.message || 'Failed to delete series')
      }
    } catch (err) {
      toast.error('Failed to delete series')
    }
  }

  // Only show full error state if we have no series at all
  if (error && seriesList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-gray-600 mb-4">{error}</p>
        <button onClick={() => fetchSeries(1)} className="btn-primary">Retry</button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Series</h1>
          <p className="text-gray-500 mt-1">Manage series and sub-series linked to categories</p>
        </div>
        <button
          onClick={() => { setSelectedSeries(null); setShowModal(true) }}
          className="btn-primary flex items-center gap-2 whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          Add Series
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search series..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <div className="relative sm:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field appearance-none pr-10 w-full"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {seriesList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-2">No series found</p>
          <p className="text-sm text-gray-400">Create your first series to get started</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Name</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Category</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Sub-Series</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Created</th>
                    <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {seriesList.map((series) => (
                    <tr key={series._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">{series.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-600">{series.category?.name || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <SubSeriesList
                          series={series}
                          onRefresh={() => fetchSeries(currentPage)}
                          onLoadingChange={setFormLoading}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${series.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {series.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(series.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setSelectedSeries(series); setShowModal(true) }}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4 text-gray-500" />
                          </button>
                          <button
                            onClick={() => handleDelete(series._id)}
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
        onClose={() => { setShowModal(false); setSelectedSeries(null) }}
        title={selectedSeries ? 'Edit Series' : 'Add Series'}
      >
        <SeriesForm
          series={selectedSeries}
          categories={categories}
          onSubmit={selectedSeries ? handleUpdate : handleCreate}
          onCancel={() => { setShowModal(false); setSelectedSeries(null) }}
          loading={formLoading}
        />
      </Modal>
    </div>
  )
}