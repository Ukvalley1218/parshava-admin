import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Search, Plus, Edit2, Trash2, X, Loader, AlertCircle, Package, RefreshCw, Eye, Save, XCircle, ChevronLeft, ChevronRight, Columns, Check } from 'lucide-react'
import {
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  syncProducts,
  bulkUpdateProducts,
  getBrands,
  uploadFile,
  getCategories,
  getSubcategories,
  getSeries,
  getSeriesById,
  createBrand,
  createCategory,
  createSubcategory,
  createSeries
} from '../services/adminApi'
import Pagination from '../components/Pagination'
import { getImageUrl } from '../utils/imageUtils'

// Modal Component
function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-5xl',
    full: 'max-w-[95vw]'
  }
  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center overflow-y-auto z-[9999]" onClick={onClose}>
      <div className={`bg-white rounded-2xl w-full ${sizeClasses[size]} shadow-xl animate-fadeIn mt-2 sm:mt-4 mb-4 mx-2 sm:mx-4`}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
          <h3 className="font-semibold text-base sm:text-lg text-gray-900 truncate pr-2">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="max-h-[85vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}

// Column Visibility Popup Component
function ColumnVisibilityPopup({ visibleColumns, onToggle, onClose }) {
  const allColumns = [
    // { key: 'status', label: 'Status', group: 'Basic' },
    { key: 'stock', label: 'Stock', group: 'Basic' },
    { key: 'mrp', label: 'MRP', group: 'Prices' },
    { key: 'mop', label: 'MOP', group: 'Prices' },
    { key: 'base', label: 'Base Type', group: 'Prices' },
    { key: 'd1', label: 'D1', group: 'Discounts' },
    { key: 'd2', label: 'D2', group: 'Discounts' },
    { key: 'd3', label: 'D3', group: 'Discounts' },
    { key: 'd4', label: 'D4', group: 'Discounts' },
    { key: 'd5', label: 'D5', group: 'Discounts' },
    { key: 'nlc', label: 'NLC', group: 'Results' },
    // { key: 'profit', label: 'Profit', group: 'Results' },
    { key: 'purchase', label: 'Purchase', group: 'Cost' },
    { key: 'marketSI', label: 'Mkt(SI)', group: 'Price List' },
    { key: 'si1', label: 'SI1', group: 'Price List' },
    { key: 'si2', label: 'SI2', group: 'Price List' },
    { key: 'c1', label: 'C1', group: 'Price List' },
    { key: 'marketReseller', label: 'Mkt(Reseller)', group: 'Price List' },
    { key: 't1', label: 'T1', group: 'Price List' },
    { key: 't2', label: 'T2', group: 'Price List' },
  ]

  const groups = [...new Set(allColumns.map(c => c.group))]

  return (
    <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 w-64 max-h-[70vh] overflow-y-auto">
      <div className="p-3 border-b border-gray-100 flex items-center justify-between">
        <span className="font-medium text-sm text-gray-800">Show/Hide Columns</span>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>
      <div className="p-2">
        {groups.map(group => (
          <div key={group} className="mb-2">
            <div className="text-[10px] font-semibold text-gray-400 uppercase px-2 mb-1">{group}</div>
            {allColumns.filter(c => c.group === group).map(column => (
              <label
                key={column.key}
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer"
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${visibleColumns.includes(column.key) ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                  {visibleColumns.includes(column.key) && <Check className="w-3 h-3 text-white" />}
                </div>
                <input
                  type="checkbox"
                  checked={visibleColumns.includes(column.key)}
                  onChange={() => onToggle(column.key)}
                  className="hidden"
                />
                <span className="text-xs text-gray-700">{column.label}</span>
              </label>
            ))}
          </div>
        ))}
      </div>
      <div className="p-2 border-t border-gray-100 flex gap-2">
        <button
          onClick={() => onToggle('all')}
          className="flex-1 text-xs py-1.5 px-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
        >
          Show All
        </button>
        <button
          onClick={() => onToggle('none')}
          className="flex-1 text-xs py-1.5 px-2 bg-gray-50 text-gray-600 rounded hover:bg-gray-100"
        >
          Hide All
        </button>
      </div>
    </div>
  )
}

// Product View Modal
function ProductViewModal({ product, onClose }) {
  if (!product) return null

  const formatPrice = (price) => price ? `₹${Number(price).toLocaleString('en-IN')}` : '-'
  const formatDiscount = (value, type) => {
    if (!value) return '-'
    return type === 'percent' ? `${value}%` : `₹${Number(value).toLocaleString('en-IN')}`
  }

  // Calculate GST amount for base price
  const gstRate = parseFloat(product.gstRate) || 0
  const getBasePriceWithGst = () => {
    let basePriceWithoutGst = 0
    if (product.basePriceType === 'mop') {
      basePriceWithoutGst = parseFloat(product.mop) || 0
    } else if (product.basePriceType === 'purchase') {
      basePriceWithoutGst = parseFloat(product.purchasePrice) || 0
    } else {
      basePriceWithoutGst = parseFloat(product.marketPrice) || 0
    }
    return basePriceWithoutGst * (1 + gstRate / 100)
  }

  const basePriceWithGst = getBasePriceWithGst()

  return (
    <div className="p-3 sm:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Basic Info */}
        <div className="space-y-3 sm:space-y-4">
          <h4 className="font-semibold text-gray-800 border-b pb-2 text-sm sm:text-base">Basic Information</h4>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
            <div><span className="text-gray-500">Name:</span><p className="font-medium truncate">{product.name}</p></div>
            <div><span className="text-gray-500">Part Number:</span><p className="font-medium">{product.partNumber || '-'}</p></div>
            <div><span className="text-gray-500">Brand:</span><p className="font-medium">{product.brand || '-'}</p></div>
            <div><span className="text-gray-500">Category:</span><p className="font-medium">{product.category || '-'}</p></div>
            <div><span className="text-gray-500">Subcategory:</span><p className="font-medium">{product.subcategory || '-'}</p></div>
            <div><span className="text-gray-500">Series:</span><p className="font-medium">{product.series || '-'}</p></div>
            <div><span className="text-gray-500">Unit:</span><p className="font-medium">{product.unit || '-'}</p></div>
            <div><span className="text-gray-500">HSN Code:</span><p className="font-medium">{product.hsn || '-'}</p></div>
            <div><span className="text-gray-500">GST Rate:</span><p className="font-medium text-blue-600">{product.gstRate || 0}%</p></div>
            <div><span className="text-gray-500">Density:</span><p className="font-medium">{product.density || 'Regular'}</p></div>
            <div><span className="text-gray-500">Stock:</span><p className="font-medium">{product.stock || 0}</p></div>
            <div><span className="text-gray-500">Box Size:</span><p className="font-medium">{product.boxSize || '-'}</p></div>
            <div><span className="text-gray-500">Procurement:</span><p className="font-medium">{product.procurement || '-'}</p></div>
          </div>
          {product.shortDescription && (
            <div className="text-xs sm:text-sm">
              <span className="text-gray-500">Short Description:</span>
              <p className="font-medium">{product.shortDescription}</p>
            </div>
          )}
          {product.description && (
            <div className="text-xs sm:text-sm">
              <span className="text-gray-500">Description:</span>
              <p className="mt-1">{product.description}</p>
            </div>
          )}
        </div>

        {/* Pricing Calculator */}
        <div className="space-y-3 sm:space-y-4">
          <h4 className="font-semibold text-gray-800 border-b pb-2 text-sm sm:text-base">Pricing Calculator</h4>

          {/* Base Price */}
          <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
            <h5 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Base Price (excl. GST)</h5>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm">
              <div><span className="text-gray-500">Type:</span><p className="font-medium">{product.basePriceType === 'mop' ? 'MOP' : product.basePriceType === 'purchase' ? 'Purchase' : 'Market'}</p></div>
              <div><span className="text-gray-500">MRP:</span><p className="font-medium">{formatPrice(product.mrp)}</p></div>
              <div><span className="text-gray-500">MOP:</span><p className="font-medium">{formatPrice(product.mop)}</p></div>
              <div><span className="text-gray-500">Purchase:</span><p className="font-medium">{formatPrice(product.purchasePrice)}</p></div>
              <div><span className="text-gray-500">Market:</span><p className="font-medium">{formatPrice(product.marketPrice)}</p></div>
            </div>
            {gstRate > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-green-600">
                <span className="font-medium">Base with GST:</span> {formatPrice(basePriceWithGst.toFixed(2))} ({formatPrice(product.basePriceType === 'mop' ? product.mop : product.basePriceType === 'purchase' ? product.purchasePrice : product.marketPrice)} + {gstRate}% GST)
              </div>
            )}
          </div>

          {/* Discounts */}
          <div className="bg-gray-50 p-2 sm:p-3 rounded-lg overflow-x-auto">
            <h5 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Discounts (Applied on GST-inclusive price)</h5>
            <div className="flex gap-2 sm:gap-3 text-xs sm:text-sm min-w-max">
              <div className="min-w-[50px]"><span className="text-gray-500 text-[10px] sm:text-xs">D1:</span><p className="font-medium">{formatDiscount(product.dis1, product.dis1Type)}</p></div>
              <div className="min-w-[50px]"><span className="text-gray-500 text-[10px] sm:text-xs">D2:</span><p className="font-medium">{formatDiscount(product.dis2, product.dis2Type)}</p></div>
              <div className="min-w-[50px]"><span className="text-gray-500 text-[10px] sm:text-xs">D3:</span><p className="font-medium">{formatDiscount(product.dis3, product.dis3Type)}</p></div>
              <div className="min-w-[50px]"><span className="text-gray-500 text-[10px] sm:text-xs">D4:</span><p className="font-medium">{formatDiscount(product.dis4, product.dis4Type)}</p></div>
              <div className="min-w-[50px]"><span className="text-gray-500 text-[10px] sm:text-xs">D5:</span><p className="font-medium">{formatDiscount(product.dis5, product.dis5Type)}</p></div>
            </div>
          </div>

          {/* NLC & Profit */}
          <div className="bg-blue-50 p-2 sm:p-3 rounded-lg">
            <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
              <div>
                <span className="text-gray-500">NLC (After GST & Discounts):</span>
                <p className="font-bold text-blue-700 text-sm sm:text-lg">{formatPrice(product.nlc)}</p>
                {gstRate > 0 && product.nlc > 0 && (
                  <span className="text-[10px] text-blue-500">incl. GST: ₹{(product.nlc / (1 + gstRate / 100)).toFixed(2)} excl.</span>
                )}
              </div>
              <div>
                <span className="text-gray-500">Profit:</span>
                <p className="font-medium">{formatDiscount(product.profit, product.profitType)}</p>
              </div>
            </div>
          </div>

          {/* Price List (C1, SI1, SI2, T1, T2) */}
          <div className="bg-green-50 p-2 sm:p-3 rounded-lg overflow-x-auto">
            <h5 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Price List</h5>
            {(product.marketPriceSI > 0 || product.marketPriceReseller > 0) && (
              <div className="flex gap-2 sm:gap-3 text-xs sm:text-sm min-w-max mb-2">
                {product.marketPriceSI > 0 && (
                  <div className="min-w-[80px]">
                    <span className="text-gray-500 text-[10px] sm:text-xs">Mkt (SI):</span>
                    <p className="font-medium text-blue-600">{formatPrice(product.marketPriceSI)}</p>
                    {gstRate > 0 && (
                      <p className="text-[10px] text-blue-500">+GST: ₹{(product.marketPriceSI * (1 + gstRate / 100)).toFixed(2)}</p>
                    )}
                  </div>
                )}
                {product.marketPriceReseller > 0 && (
                  <div className="min-w-[80px]">
                    <span className="text-gray-500 text-[10px] sm:text-xs">Mkt (Reseller):</span>
                    <p className="font-medium text-blue-600">{formatPrice(product.marketPriceReseller)}</p>
                    {gstRate > 0 && (
                      <p className="text-[10px] text-blue-500">+GST: ₹{(product.marketPriceReseller * (1 + gstRate / 100)).toFixed(2)}</p>
                    )}
                  </div>
                )}
              </div>
            )}
            <div className="flex gap-2 sm:gap-3 text-xs sm:text-sm min-w-max">
              <div className="min-w-[60px]">
                <span className="text-gray-500 text-[10px] sm:text-xs">C1:</span>
                <p className="font-medium text-green-700">{formatPrice(product.opC1 || product.c1 || product.t1)}</p>
                {gstRate > 0 && (product.opC1 || product.c1 || product.t1) > 0 && (
                  <p className="text-[10px] text-green-600">+GST: ₹{((product.opC1 || product.c1 || product.t1) * (1 + gstRate / 100)).toFixed(2)}</p>
                )}
              </div>
              <div className="min-w-[60px]">
                <span className="text-gray-500 text-[10px] sm:text-xs">SI1:</span>
                <p className="font-medium text-green-700">{formatPrice(product.opSi1 || product.si1)}</p>
                {gstRate > 0 && (product.opSi1 || product.si1) > 0 && (
                  <p className="text-[10px] text-green-600">+GST: ₹{((product.opSi1 || product.si1) * (1 + gstRate / 100)).toFixed(2)}</p>
                )}
              </div>
              <div className="min-w-[60px]">
                <span className="text-gray-500 text-[10px] sm:text-xs">SI2:</span>
                <p className="font-medium text-green-700">{formatPrice(product.opSi2 || product.si2)}</p>
                {gstRate > 0 && (product.opSi2 || product.si2) > 0 && (
                  <p className="text-[10px] text-green-600">+GST: ₹{((product.opSi2 || product.si2) * (1 + gstRate / 100)).toFixed(2)}</p>
                )}
              </div>
              <div className="min-w-[60px]">
                <span className="text-gray-500 text-[10px] sm:text-xs">T1:</span>
                <p className="font-medium text-green-700">{formatPrice(product.opT1 || product.t1)}</p>
                {gstRate > 0 && (product.opT1 || product.t1) > 0 && (
                  <p className="text-[10px] text-green-600">+GST: ₹{((product.opT1 || product.t1) * (1 + gstRate / 100)).toFixed(2)}</p>
                )}
              </div>
              <div className="min-w-[60px]">
                <span className="text-gray-500 text-[10px] sm:text-xs">T2:</span>
                <p className="font-medium text-green-700">{formatPrice(product.opT2 || product.t2)}</p>
                {gstRate > 0 && (product.opT2 || product.t2) > 0 && (
                  <p className="text-[10px] text-green-600">+GST: ₹{((product.opT2 || product.t2) * (1 + gstRate / 100)).toFixed(2)}</p>
                )}
              </div>
            </div>
          </div>

          {/* Legacy Pricing */}
          {(product.cnlc || product.mnlc || product.opPrice) && (
            <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
              <h5 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Legacy Pricing</h5>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm">
                <div><span className="text-gray-500">CNLC:</span><p className="font-medium">{formatPrice(product.cnlc)}</p></div>
                <div><span className="text-gray-500">MNLC:</span><p className="font-medium">{formatPrice(product.mnlc)}</p></div>
                <div><span className="text-gray-500">OP Price:</span><p className="font-medium">{formatPrice(product.opPrice)}</p></div>
                <div><span className="text-gray-500">Bottom:</span><p className="font-medium">{formatPrice(product.bottomPrice)}</p></div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end mt-4 sm:mt-6">
        <button onClick={onClose} className="btn-secondary">Close</button>
      </div>
    </div>
  )
}

// Quick Add Modal for Brands, Categories, Subcategories, Series
function QuickAddModal({ isOpen, onClose, title, fields, onSubmit, loading }) {
  const [formData, setFormData] = useState({})
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      // Initialize form data with field default values
      const initialData = {}
      fields.forEach(field => {
        initialData[field.name] = field.defaultValue || ''
      })
      setFormData(initialData)
      setError('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]) // Only re-initialize when modal opens, not when fields change

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation() // Prevent event from propagating to parent modal
    // Validate required fields
    for (const field of fields) {
      if (field.required && !formData[field.name]?.trim()) {
        setError(`${field.label} is required`)
        return
      }
    }
    try {
      await onSubmit(formData)
      onClose()
    } catch (err) {
      console.error('QuickAddModal error:', err)
      setError(err.message || 'Failed to create')
    }
  }

  if (!isOpen) return null

  // Use portal to render outside parent modal's DOM hierarchy
  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-md shadow-xl animate-fadeIn" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button type="button" onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {fields.map(field => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              {field.type === 'select' ? (
                <select
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="input-field"
                  required={field.required}
                >
                  <option value="">Select {field.label}</option>
                  {field.options?.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type || 'text'}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  className="input-field"
                  required={field.required}
                />
              )}
            </div>
          ))}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={loading}>Cancel</button>
            <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={loading}>
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              Create
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

// Form GST Price Input - Editable input showing GST-inclusive price
// When edited, reverse-calculates the base price and updates formData
function FormGstInput({ formData, setFormData, baseField, gstRate, isBase = false }) {
  const rate = parseFloat(gstRate) || 0
  const [localValue, setLocalValue] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    const newGstValue = (parseFloat(formData[baseField]) || 0) * (1 + rate / 100)
    setLocalValue(newGstValue ? newGstValue.toFixed(2) : '')
  }, [formData[baseField], gstRate])

  const handleBlur = () => {
    const newGstPrice = parseFloat(localValue) || 0
    if (newGstPrice > 0 && rate > 0) {
      const basePrice = Math.round((newGstPrice / (1 + rate / 100)) * 100) / 100
      setFormData(prev => ({ ...prev, [baseField]: basePrice.toString() }))
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === '-') {
      e.preventDefault()
      return
    }
    if (e.key === 'Enter' || e.key === 'Tab') {
      handleBlur()
    }
  }

  if (rate <= 0) return null

  return (
    <div className="mt-1">
      <input
        ref={inputRef}
        type="number"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`w-full px-2 py-1 text-xs text-right border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${isBase ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-300'}`}
        min="0"
        step="any"
        placeholder="+GST"
      />
      <div className="text-[9px] text-gray-500 text-center">+ {gstRate}% GST</div>
      {isBase && <div className="text-[9px] text-blue-600 font-medium text-center">Base</div>}
    </div>
  )
}

// Product Form Component
function ProductForm({ product, onSubmit, onCancel, loading, brands, categories: propCategories, subcategories: propSubcategories, series: propSeries, onRefreshBrands, onRefreshCategories }) {
  const [categories, setCategories] = useState(propCategories || [])
  const [allCategories, setAllCategories] = useState(propCategories || []) // Cache all categories
  const [subcategories, setSubcategories] = useState(propSubcategories || [])
  const [series, setSeries] = useState(propSeries || [])
  const [initialized, setInitialized] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [loadingCategories, setLoadingCategories] = useState(false)

  // Quick Add Modal States
  const [showQuickAddBrand, setShowQuickAddBrand] = useState(false)
  const [showQuickAddCategory, setShowQuickAddCategory] = useState(false)
  const [showQuickAddSubcategory, setShowQuickAddSubcategory] = useState(false)
  const [showQuickAddSeries, setShowQuickAddSeries] = useState(false)
  const [quickAddLoading, setQuickAddLoading] = useState(false)

  const getInitialState = (productData = null) => {
    const p = productData || product
    const state = {
      name: p?.name || '',
      imageUrl: p?.imageUrl || '',
      partNumber: p?.partNumber || '',
      description: p?.description || '',
      shortDescription: p?.shortDescription || '',
      brand: p?.brand || '',
      brandId: p?.brandId || '',
      category: p?.category || '',
      categoryId: p?.categoryId || '',
      subcategory: p?.subcategory || '',
      subcategoryId: p?.subcategoryId || '',
      series: p?.series || '',
      seriesId: p?.seriesId || '',
      unit: p?.unit || '',
      hsn: p?.hsn || '',
      gstRate: p?.gstRate || 18,
      mrp: p?.mrp || '',
      mop: p?.mop || '',
      purchasePrice: p?.purchasePrice || '',
      marketPrice: p?.marketPrice || '',
      marketPriceSI: p?.marketPriceSI || '',
      marketPriceReseller: p?.marketPriceReseller || '',
      // Pricing calculator fields
      basePriceType: p?.basePriceType || 'mop', // 'mop', 'purchase', or 'market'
      dis1: p?.dis1 ?? '',
      dis1Type: p?.dis1Type || 'percent', // 'percent' or 'flat'
      dis2: p?.dis2 ?? '',
      dis2Type: p?.dis2Type || 'percent',
      dis3: p?.dis3 ?? '',
      dis3Type: p?.dis3Type || 'percent',
      dis4: p?.dis4 ?? '',
      dis4Type: p?.dis4Type || 'percent',
      dis5: p?.dis5 ?? '',
      dis5Type: p?.dis5Type || 'percent',
      nlc: p?.nlc || '',
      profit: p?.profit ?? '',
      profitType: p?.profitType || 'percent',
      // New Price List fields
      // System Integrator: SI1 is input, SI2 and C1 are auto-calculated
      opSi1: p?.opSi1 ?? '',
      opSi1Type: p?.opSi1Type || 'percent',
      // opSi2 is auto-calculated (SI1 + 1%)
      // opC1 is auto-calculated (SI1 + 20%)
      // Reseller: T1 is input, T2 is auto-calculated
      opT1: p?.opT1 ?? '',
      opT1Type: p?.opT1Type || 'percent',
      // opT2 is auto-calculated (T1 + 0.5%)
      // Legacy OP fields (kept for backward compatibility)
      op1: p?.op1 ?? '',
      op1Type: p?.op1Type || 'percent',
      op2: p?.op2 ?? '',
      op2Type: p?.op2Type || 'percent',
      op3: p?.op3 ?? '',
      op3Type: p?.op3Type || 'percent',
      op4: p?.op4 ?? '',
      op4Type: p?.op4Type || 'percent',
      // Legacy fields for backward compatibility
      cnlc: p?.cnlc || '',
      mnlc: p?.mnlc || '',
      opPrice: p?.opPrice || '',
      c1: p?.c1 || p?.t1 || '',
      si1: p?.si1 || '',
      si2: p?.si2 || '',
      t1: p?.t1 || '',
      t2: p?.t2 || '',
      t3: p?.t3 || '',
      t4: p?.t4 || '',
      bottomPrice: p?.bottomPrice || '',
      density: p?.density || 'Regular',
      boxSize: p?.boxSize || '',
      procurement: p?.procurement || '',
      stock: p?.stock || 0,
    }
    return state
  }

  const [formData, setFormData] = useState(getInitialState)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  // Validation functions
  const validators = {
    name: {
      required: true,
      validate: (value) => {
        if (!value?.trim()) return 'Product name is required'
        if (value.length > 200) return 'Product name must be less than 200 characters'
        return null
      }
    },
    stock: {
      required: false,
      validate: (value) => {
        if (value && isNaN(parseInt(value))) return 'Stock must be a number'
        if (value && parseInt(value) < 0) return 'Stock cannot be negative'
        return null
      }
    },
    hsn: {
      required: false,
      validate: (value) => {
        if (value && !/^\d{4,8}$/.test(value)) return 'HSN code must be 4-8 digits'
        return null
      }
    }
  }

  // Validate single field
  const validateField = (name, value) => {
    const validator = validators[name]
    if (!validator) return null
    return validator.validate(value)
  }

  // Validate all fields
  const validateForm = () => {
    const newErrors = {}
    Object.keys(validators).forEach(field => {
      const error = validateField(field, formData[field])
      if (error) newErrors[field] = error
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Load categories for a specific brand
  const loadCategoriesForBrand = async (brandName) => {
    if (!brandName) {
      setCategories(allCategories)
      return
    }
    setLoadingCategories(true)
    try {
      const response = await getCategories({ brand: brandName, limit: 100, active: true })
      if (response.success !== false) {
        setCategories(response.data || [])
      } else {
        setCategories([])
      }
    } catch (err) {
      console.error('Failed to fetch categories for brand:', err)
      setCategories([])
    } finally {
      setLoadingCategories(false)
    }
  }

  // Load subcategories when category changes
  const loadSubcategories = async (categoryId) => {
    if (!categoryId) {
      setSubcategories([])
      return
    }
    try {
      const response = await getSubcategories({ category: categoryId, limit: 100, active: true })
      if (response.success !== false) {
        setSubcategories(response.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch subcategories:', err)
    }
  }

  // Load series when category changes
  const loadSeries = async (categoryId) => {
    if (!categoryId) {
      setSeries([])
      return
    }
    try {
      const response = await getSeries({ category: categoryId, limit: 100, active: true })
      if (response.success !== false) {
        setSeries(response.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch series:', err)
    }
  }

  // Quick Add Handlers
  const handleQuickAddBrand = async (data) => {
    setQuickAddLoading(true)
    try {
      const response = await createBrand({ name: data.name, active: true })
      console.log('createBrand response:', response)
      if (response && (response.success !== false) && (response.data || response._id)) {
        const newBrand = response.data || response
        // Refresh brands list from parent
        if (onRefreshBrands) {
          await onRefreshBrands()
        }
        // Select the newly created brand
        setFormData(prev => ({
          ...prev,
          brandId: newBrand._id,
          brand: newBrand.name
        }))
      } else {
        throw new Error(response?.message || response?.error || 'Failed to create brand')
      }
    } catch (err) {
      console.error('handleQuickAddBrand error:', err)
      throw err
    } finally {
      setQuickAddLoading(false)
    }
  }

  const handleQuickAddCategory = async (data) => {
    setQuickAddLoading(true)
    try {
      const response = await createCategory({ name: data.name, active: true, brands: formData.brandId ? [formData.brandId] : [] })
      console.log('createCategory response:', response)
      if (response && (response.success !== false) && (response.data || response._id)) {
        const newCategory = response.data || response
        // Refresh categories list
        const categoriesRes = await getCategories({ limit: 1000, active: true })
        if (categoriesRes.success !== false) {
          setCategories(categoriesRes.data || [])
          setAllCategories(categoriesRes.data || [])
        }
        // Select the newly created category
        setFormData(prev => ({
          ...prev,
          categoryId: newCategory._id,
          category: newCategory.name,
          subcategoryId: '',
          subcategory: '',
          seriesId: '',
          series: ''
        }))
        setSubcategories([])
        setSeries([])
      } else {
        throw new Error(response?.message || response?.error || 'Failed to create category')
      }
    } catch (err) {
      console.error('handleQuickAddCategory error:', err)
      throw err
    } finally {
      setQuickAddLoading(false)
    }
  }

  const handleQuickAddSubcategory = async (data) => {
    if (!formData.categoryId) {
      throw new Error('Please select a category first')
    }
    setQuickAddLoading(true)
    try {
      const response = await createSubcategory({ name: data.name, category: formData.categoryId, active: true })
      console.log('createSubcategory response:', response)
      if (response && (response.success !== false) && (response.data || response._id)) {
        const newSubcategory = response.data || response
        // Refresh subcategories list
        await loadSubcategories(formData.categoryId)
        // Select the newly created subcategory
        setFormData(prev => ({
          ...prev,
          subcategoryId: newSubcategory._id,
          subcategory: newSubcategory.name
        }))
      } else {
        throw new Error(response?.message || response?.error || 'Failed to create subcategory')
      }
    } catch (err) {
      console.error('handleQuickAddSubcategory error:', err)
      throw err
    } finally {
      setQuickAddLoading(false)
    }
  }

  const handleQuickAddSeries = async (data) => {
    if (!formData.categoryId) {
      throw new Error('Please select a category first')
    }
    setQuickAddLoading(true)
    try {
      const response = await createSeries({ name: data.name, category: formData.categoryId, active: true })
      console.log('createSeries response:', response)
      if (response && (response.success !== false) && (response.data || response._id)) {
        const newSeries = response.data || response
        // Refresh series list
        await loadSeries(formData.categoryId)
        // Select the newly created series
        setFormData(prev => ({
          ...prev,
          seriesId: newSeries._id,
          series: newSeries.name
        }))
      } else {
        throw new Error(response?.message || response?.error || 'Failed to create series')
      }
    } catch (err) {
      console.error('handleQuickAddSeries error:', err)
      throw err
    } finally {
      setQuickAddLoading(false)
    }
  }

  // Initialize from product data
  useEffect(() => {
    if (product) {
      // Set initial form data from product
      setFormData(getInitialState(product))

      // Load categories for the brand if brand is set
      if (product.brand) {
        loadCategoriesForBrand(product.brand)
      }

      // Load subcategories and series based on category
      if (product.categoryId) {
        loadSubcategories(product.categoryId)
        loadSeries(product.categoryId)
      } else if (product.category) {
        // If categoryId is not set but category name is, find the ID
        const foundCategory = propCategories?.find(c => c.name === product.category)
        if (foundCategory?._id) {
          loadSubcategories(foundCategory._id)
          loadSeries(foundCategory._id)
        }
      }
      setInitialized(true)
    } else if (!initialized) {
      setInitialized(true)
    }
  }, [product?._id]) // Only re-run when product ID changes

  // Cache all categories when propCategories changes
  useEffect(() => {
    if (propCategories && propCategories.length > 0 && allCategories.length === 0) {
      setAllCategories(propCategories)
    }
  }, [propCategories])

  // Handle category change
  useEffect(() => {
    if (initialized && formData.categoryId) {
      loadSubcategories(formData.categoryId)
      loadSeries(formData.categoryId)
    } else if (initialized) {
      setSubcategories([])
      setSeries([])
    }
  }, [formData.categoryId, initialized])


  const handleImageUpload = async (e) => {
  const file = e.target.files[0]

  if (!file) return

  try {
    setUploadingImage(true)

    const response = await uploadFile('productImage', file)

    if (response.success) {
      setFormData(prev => ({
        ...prev,
        imageUrl: response.data.url
      }))
    } else {
      alert(response.message || 'Upload failed')
    }

  } catch (error) {
    alert('Failed to upload image')
  } finally {
    setUploadingImage(false)
  }
}

  const handleBrandChange = (e) => {
    const brandId = e.target.value
    const selectedBrand = brands.find(b => b._id === brandId)
    const brandName = selectedBrand?.name || ''

    setFormData(prev => ({
      ...prev,
      brandId,
      brand: brandName,
      // Reset category, subcategory, series when brand changes
      categoryId: '',
      category: '',
      subcategoryId: '',
      subcategory: '',
      seriesId: '',
      series: ''
    }))

    // Load categories for selected brand
    if (brandName) {
      loadCategoriesForBrand(brandName)
    } else {
      setCategories(allCategories)
    }
    // Reset subcategories and series
    setSubcategories([])
    setSeries([])
  }

  const handleCategoryChange = (e) => {
    const categoryId = e.target.value
    const selectedCategory = categories.find(c => c._id === categoryId)
    setFormData(prev => ({
      ...prev,
      categoryId,
      category: selectedCategory?.name || '',
      subcategoryId: '',
      subcategory: '',
      seriesId: '',
      series: ''
    }))
  }

  const handleSubcategoryChange = (e) => {
    const subcategoryId = e.target.value
    const selectedSubcategory = subcategories.find(s => s._id === subcategoryId)
    setFormData(prev => ({
      ...prev,
      subcategoryId,
      subcategory: selectedSubcategory?.name || ''
    }))
  }

  const handleSeriesChange = (e) => {
    const seriesId = e.target.value
    const selectedSeries = series.find(s => s._id === seriesId)
    setFormData(prev => ({
      ...prev,
      seriesId,
      series: selectedSeries?.name || ''
    }))
  }

  const handleChange = (e) => {
    const { name, value, type } = e.target
    let newValue = value

    // Filter numeric fields to only allow numbers and decimals
    const numericFields = ['mrp', 'mop', 'purchasePrice', 'marketPrice', 'marketPriceSI', 'marketPriceReseller', 'cnlc', 'mnlc', 'opPrice', 'c1', 'si1', 'si2', 't1', 't2', 't3', 't4', 'bottomPrice', 'dis1', 'dis2', 'dis3', 'dis4', 'dis5', 'profit', 'opC1', 'opSi1', 'opSi2', 'opT1', 'opT2', 'op1', 'op2', 'op3', 'op4', 'nlc']
    const integerFields = ['stock']

    if (numericFields.includes(name)) {
      // Allow numbers and decimals only
      newValue = value.replace(/[^0-9.]/g, '')
      // Ensure only one decimal point
      const parts = newValue.split('.')
      if (parts.length > 2) {
        newValue = parts[0] + '.' + parts.slice(1).join('')
      }
    } else if (integerFields.includes(name)) {
      // Allow only integers
      newValue = value.replace(/[^0-9]/g, '')
    } else if (name === 'hsn') {
      // HSN code - digits only, max 8
      newValue = value.replace(/[^0-9]/g, '').slice(0, 8)
    }
    // Don't filter name and partNumber - let users type freely
    // Validation will handle any issues on submit

    setFormData(prev => ({ ...prev, [name]: newValue }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  // Block minus key for number inputs
  const handleNumberKeyDown = (e) => {
    if (e.key === '-') {
      e.preventDefault()
    }
  }

  // Calculate prices based on pricing calculator inputs (with GST)
  const calculatePrices = () => {
    const gstRate = parseFloat(formData.gstRate) || 0

    // Get base price without GST
    let basePriceWithoutGst = 0
    if (formData.basePriceType === 'mop') {
      basePriceWithoutGst = parseFloat(formData.mop) || 0
    } else if (formData.basePriceType === 'purchase') {
      basePriceWithoutGst = parseFloat(formData.purchasePrice) || 0
    } else if (formData.basePriceType === 'market') {
      basePriceWithoutGst = parseFloat(formData.marketPrice) || 0
    }

    // Add GST to get the actual base price
    const basePriceWithGst = basePriceWithoutGst * (1 + gstRate / 100)

    let price = basePriceWithGst

    // Apply discounts 1-5 (discounts are applied on GST-inclusive price)
    const discounts = [
      { value: parseFloat(formData.dis1) || 0, type: formData.dis1Type },
      { value: parseFloat(formData.dis2) || 0, type: formData.dis2Type },
      { value: parseFloat(formData.dis3) || 0, type: formData.dis3Type },
      { value: parseFloat(formData.dis4) || 0, type: formData.dis4Type },
      { value: parseFloat(formData.dis5) || 0, type: formData.dis5Type },
    ]

    discounts.forEach(discount => {
      if (discount.type === 'percent') {
        price = price - (price * discount.value / 100)
      } else {
        price = price - discount.value
      }
    })

    // NLC (Net Landing Cost) - after GST and discounts
    const nlc = Math.round(price * 100) / 100

    // Add profit
    let profitAmount = 0
    const profitValue = parseFloat(formData.profit) || 0
    if (formData.profitType === 'percent') {
      profitAmount = nlc * profitValue / 100
    } else {
      profitAmount = profitValue
    }

    const priceWithProfit = nlc + profitAmount

    // Calculate OP prices based on type
    const getOpPrice = (opField, opTypeField, basePrice = priceWithProfit) => {
      const inputValue = parseFloat(formData[opField]) || 0
      const type = formData[opTypeField]

      if (type === 'flat') {
        // For flat type: final price = basePrice + flatAmount
        return Math.round((basePrice + inputValue) * 100) / 100
      } else {
        // For percent type: final price = basePrice * (1 + percentage/100)
        return Math.round((basePrice * (1 + inputValue / 100)) * 100) / 100
      }
    }

    // Determine base for SI prices: use marketPriceSI if set, otherwise priceWithProfit
    const siBase = (parseFloat(formData.marketPriceSI) > 0) ? parseFloat(formData.marketPriceSI) : priceWithProfit
    // Determine base for T prices: use marketPriceReseller if set, otherwise priceWithProfit
    const tBase = (parseFloat(formData.marketPriceReseller) > 0) ? parseFloat(formData.marketPriceReseller) : priceWithProfit

    // Calculate SI1 price from SI1 margin
    const si1Price = getOpPrice('opSi1', 'opSi1Type', siBase)

    // Calculate SI2 = SI1 + 1% (auto-calculated)
    const si2Price = Math.round(si1Price * 1.01 * 100) / 100

    // Calculate C1 = SI1 + 20% (auto-calculated)
    const c1Price = Math.round(si1Price * 1.20 * 100) / 100

    // Calculate T1 price from T1 margin
    const t1Price = getOpPrice('opT1', 'opT1Type', tBase)

    // Calculate T2 = T1 + 0.5% (auto-calculated)
    const t2Price = Math.round(t1Price * 1.005 * 100) / 100

    return {
      basePriceWithoutGst,
      basePriceWithGst,
      gstAmount: basePriceWithoutGst * gstRate / 100,
      gstRate,
      nlc,
      // SI base price (marketPriceSI if set, otherwise priceWithProfit)
      siBase,
      // Reseller base price (marketPriceReseller if set, otherwise priceWithProfit)
      tBase,
      // System Integrator prices (SI1 is input, SI2 and C1 are auto-calculated)
      opSi1: si1Price,
      opSi2: si2Price,
      opC1: c1Price,
      // Reseller prices (T1 is input, T2 is auto-calculated)
      opT1: t1Price,
      opT2: t2Price,
      // Legacy OP prices (kept for backward compatibility)
      op1: getOpPrice('op1', 'op1Type'),
      op2: getOpPrice('op2', 'op2Type'),
      op3: getOpPrice('op3', 'op3Type'),
      op4: getOpPrice('op4', 'op4Type'),
    }
  }

  // Update form data with calculated prices (called on blur for display purposes)
  const updateCalculatedPrices = () => {
    const calculated = calculatePrices()
    setFormData(prev => ({
      ...prev,
      nlc: calculated.nlc,
      // SI2, C1, T2 are auto-calculated and stored in the calculated object
      // These will be submitted with the form data
    }))
  }

  // Handle blur for validation
  const handleBlur = (e) => {
    const { name, value } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
    const error = validateField(name, value)
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Mark all fields as touched
    const allTouched = {}
    Object.keys(validators).forEach(field => {
      allTouched[field] = true
    })
    setTouched(allTouched)

    // Validate all fields
    if (!validateForm()) {
      return
    }

    const calculated = calculatePrices()

    // Calculate tier prices based on type (flat = direct value, percent = calculated)
    const getTierPrice = (opField, opType, calculatedValue) => {
      const inputValue = parseFloat(formData[opField]) || 0
      if (formData[opType] === 'flat') {
        // For flat type, use the direct input value
        return inputValue
      } else {
        // For percent type, use calculated value
        return calculatedValue
      }
    }

    // New Price List prices
    // SI1 is input by user
    const priceSi1 = getTierPrice('opSi1', 'opSi1Type', calculated.opSi1)
    // SI2 and C1 are auto-calculated from SI1
    const priceSi2 = calculated.opSi2
    const priceC1 = calculated.opC1
    // T1 is input by user
    const priceT1 = getTierPrice('opT1', 'opT1Type', calculated.opT1)
    // T2 is auto-calculated from T1
    const priceT2 = calculated.opT2

    // Legacy tier prices (kept for backward compatibility)
    const tier1 = getTierPrice('op1', 'op1Type', calculated.op1)
    const tier2 = getTierPrice('op2', 'op2Type', calculated.op2)
    const tier3 = getTierPrice('op3', 'op3Type', calculated.op3)
    const tier4 = getTierPrice('op4', 'op4Type', calculated.op4)

    const submitData = {
      ...formData,
      mrp: parseFloat(formData.mrp) || 0,
      mop: parseFloat(formData.mop) || 0,
      purchasePrice: parseFloat(formData.purchasePrice) || 0,
      marketPrice: parseFloat(formData.marketPrice) || 0,
      marketPriceSI: parseFloat(formData.marketPriceSI) || 0,
      marketPriceReseller: parseFloat(formData.marketPriceReseller) || 0,
      // Pricing calculator fields
      basePriceType: formData.basePriceType,
      dis1: parseFloat(formData.dis1) || 0,
      dis1Type: formData.dis1Type,
      dis2: parseFloat(formData.dis2) || 0,
      dis2Type: formData.dis2Type,
      dis3: parseFloat(formData.dis3) || 0,
      dis3Type: formData.dis3Type,
      dis4: parseFloat(formData.dis4) || 0,
      dis4Type: formData.dis4Type,
      dis5: parseFloat(formData.dis5) || 0,
      dis5Type: formData.dis5Type,
      nlc: calculated.nlc,
      profit: parseFloat(formData.profit) || 0,
      profitType: formData.profitType,
      // System Integrator: SI1 is input, SI2 and C1 are auto-calculated
      opSi1: parseFloat(formData.opSi1) || 0,
      opSi1Type: formData.opSi1Type,
      // opSi2 and opC1 are not stored as separate OP fields - they're auto-calculated
      // Reseller: T1 is input, T2 is auto-calculated
      opT1: parseFloat(formData.opT1) || 0,
      opT1Type: formData.opT1Type,
      // opT2 is not stored as separate OP field - it's auto-calculated
      // Calculated tier prices (stored for display)
      c1: priceC1,
      si1: priceSi1,
      si2: priceSi2,
      t1: priceT1,
      t2: priceT2,
      // Legacy OP fields (kept for backward compatibility)
      op1: parseFloat(formData.op1) || 0,
      op1Type: formData.op1Type,
      op2: parseFloat(formData.op2) || 0,
      op2Type: formData.op2Type,
      op3: parseFloat(formData.op3) || 0,
      op3Type: formData.op3Type,
      op4: parseFloat(formData.op4) || 0,
      op4Type: formData.op4Type,
      // Legacy T1-T4 prices
      t3: tier3,
      t4: tier4,
      opPrice: priceC1, // Default OP Price is C1
      // Legacy fields for backward compatibility
      cnlc: calculated.nlc,
      mnlc: parseFloat(formData.mnlc) || 0,
      bottomPrice: parseFloat(formData.bottomPrice) || tier4,
      gstRate: parseFloat(formData.gstRate) || 0,
      stock: parseInt(formData.stock) || 0,
      // New fields
      boxSize: formData.boxSize || '',
      procurement: formData.procurement || '',
      shortDescription: formData.shortDescription || '',
    }
    onSubmit(submitData)
  }

  return (
    <form onSubmit={handleSubmit} className="p-3 sm:p-4 space-y-4 sm:space-y-6">
      {/* Brand, Category, Subcategory, Series - Cascading */}
      <div className="border-b pb-3 sm:pb-4">
        <h4 className="font-medium text-gray-800 mb-2 sm:mb-3 text-sm sm:text-base">Classification</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Brand */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Brand
            </label>
            <div className="flex gap-2">
              <select
                name="brandId"
                value={formData.brandId}
                onChange={handleBrandChange}
                className="input-field text-sm flex-1"
              >
                <option value="">Select Brand</option>
                {brands.map(brand => (
                  <option key={brand._id} value={brand._id}>{brand.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowQuickAddBrand(true)}
                className="px-2 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors text-sm"
                title="Add new brand"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <div className="flex gap-2">
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleCategoryChange}
                disabled={loadingCategories}
                className="input-field text-sm flex-1 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">{loadingCategories ? 'Loading...' : 'Select Category'}</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowQuickAddCategory(true)}
                className="px-2 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors text-sm"
                title="Add new category"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {loadingCategories && <p className="text-xs text-gray-400 mt-1">Loading categories for selected brand...</p>}
            {!loadingCategories && formData.brandId && categories.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">No categories linked to this brand</p>
            )}
          </div>

          {/* Subcategory */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Subcategory</label>
            <div className="flex gap-2">
              <select
                name="subcategoryId"
                value={formData.subcategoryId}
                onChange={handleSubcategoryChange}
                disabled={!formData.categoryId}
                className="input-field text-sm flex-1 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Select Subcategory</option>
                {subcategories.map(sub => (
                  <option key={sub._id} value={sub._id}>{sub.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowQuickAddSubcategory(true)}
                disabled={!formData.categoryId}
                className="px-2 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                title="Add new subcategory"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {!formData.categoryId && <p className="text-xs text-gray-400 mt-1">Select a category first</p>}
          </div>

          {/* Series */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Series</label>
            <div className="flex gap-2">
              <select
                name="seriesId"
                value={formData.seriesId}
                onChange={handleSeriesChange}
                disabled={!formData.categoryId}
                className="input-field text-sm flex-1 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Select Series</option>
                {series.map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowQuickAddSeries(true)}
                disabled={!formData.categoryId}
                className="px-2 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                title="Add new series"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {!formData.categoryId && <p className="text-xs text-gray-400 mt-1">Select a category first</p>}
          </div>
        </div>
      </div>

      {/* Quick Add Modals */}
      <QuickAddModal
        isOpen={showQuickAddBrand}
        onClose={() => setShowQuickAddBrand(false)}
        title="Add New Brand"
        fields={[
          { name: 'name', label: 'Brand Name', required: true, placeholder: 'Enter brand name' }
        ]}
        onSubmit={handleQuickAddBrand}
        loading={quickAddLoading}
      />

      <QuickAddModal
        isOpen={showQuickAddCategory}
        onClose={() => setShowQuickAddCategory(false)}
        title="Add New Category"
        fields={[
          { name: 'name', label: 'Category Name', required: true, placeholder: 'Enter category name' }
        ]}
        onSubmit={handleQuickAddCategory}
        loading={quickAddLoading}
      />

      <QuickAddModal
        isOpen={showQuickAddSubcategory}
        onClose={() => setShowQuickAddSubcategory(false)}
        title="Add New Subcategory"
        fields={[
          { name: 'name', label: 'Subcategory Name', required: true, placeholder: 'Enter subcategory name' }
        ]}
        onSubmit={handleQuickAddSubcategory}
        loading={quickAddLoading}
      />

      <QuickAddModal
        isOpen={showQuickAddSeries}
        onClose={() => setShowQuickAddSeries(false)}
        title="Add New Series"
        fields={[
          { name: 'name', label: 'Series Name', required: true, placeholder: 'Enter series name' }
        ]}
        onSubmit={handleQuickAddSeries}
        loading={quickAddLoading}
      />

      {/* Basic Info */}
      <div className="border-b pb-3 sm:pb-4">
        <h4 className="font-medium text-gray-800 mb-2 sm:mb-3 text-sm sm:text-base">Basic Information</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Model Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              placeholder="Enter product name"
              className={`input-field text-sm ${errors.name && touched.name ? 'border-red-500 focus:ring-red-500' : ''}`}
            />
            {errors.name && touched.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Part Number</label>
            <input
              type="text"
              name="partNumber"
              value={formData.partNumber}
              onChange={handleChange}
              placeholder="Enter part number"
              className="input-field text-sm"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Product Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="input-field text-sm"
            />
            {formData.imageUrl && (
              <img
                src={getImageUrl(formData.imageUrl)}
                alt="Preview"
                className="mt-2 w-16 h-16 sm:w-24 sm:h-24 object-cover rounded-lg border"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://img.freepik.com/free-photo/modern-stationary-collection-arrangement_23-2149309643.jpg?semt=ais_rp_progressive&w=740&q=80';
                }}
              />
            )}
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Unit</label>
            <input
              type="text"
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              placeholder="e.g., PCS"
              className="input-field text-sm"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">HSN Code</label>
            <input
              type="text"
              name="hsn"
              value={formData.hsn}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter HSN code"
              className={`input-field text-sm ${errors.hsn && touched.hsn ? 'border-red-500 focus:ring-red-500' : ''}`}
            />
            {errors.hsn && touched.hsn && <p className="text-xs text-red-500 mt-1">{errors.hsn}</p>}
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">GST Rate (%)</label>
            <select name="gstRate" value={formData.gstRate} onChange={handleChange} className="input-field text-sm">
              <option value="0">0%</option>
              <option value="5">5%</option>
              <option value="12">12%</option>
              <option value="18">18%</option>
              <option value="28">28%</option>
            </select>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Density</label>
            <select name="density" value={formData.density} onChange={handleChange} className="input-field text-sm">
              <option value="Regular">Regular</option>
              <option value="B2B">B2B</option>
              
            </select>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Stock</label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              onBlur={handleBlur}
              onKeyDown={handleNumberKeyDown}
              placeholder="Stock quantity"
              min="0"
              className={`input-field text-sm ${errors.stock && touched.stock ? 'border-red-500 focus:ring-red-500' : ''}`}
            />
            {errors.stock && touched.stock && <p className="text-xs text-red-500 mt-1">{errors.stock}</p>}
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Box Size</label>
            <input
              type="text"
              name="boxSize"
              value={formData.boxSize}
              onChange={handleChange}
              placeholder="e.g., 10x5x3 cm"
              className="input-field text-sm"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Procurement</label>
            <input
              type="text"
              name="procurement"
              value={formData.procurement}
              onChange={handleChange}
              placeholder="e.g., Local Vendor, Import"
              className="input-field text-sm"
            />
          </div>
        </div>
        <div className="mt-3 sm:mt-4">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Short Description</label>
          <input
            type="text"
            name="shortDescription"
            value={formData.shortDescription}
            onChange={handleChange}
            placeholder="Brief description (max 200 chars)"
            maxLength={200}
            className="input-field text-sm"
          />
        </div>
        <div className="mt-3 sm:mt-4">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Description (Long)</label>
          <textarea name="description" value={formData.description} onChange={handleChange} rows="2"
            className="input-field text-sm" placeholder="Enter full product description" />
        </div>
      </div>

      {/* Pricing Calculator */}
      <div className="border-b pb-3 sm:pb-4">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h4 className="font-medium text-gray-800 text-base sm:text-lg">Pricing Calculator</h4>
          <button
            type="button"
            onClick={updateCalculatedPrices}
            className="btn-primary text-xs sm:text-sm py-1.5 px-3 sm:px-4 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
            Calculate
          </button>
        </div>

        {/* Step 1: Base Price */}
        <div className="bg-gray-50 rounded-xl p-3 sm:p-4 mb-3 sm:mb-4">
          <h5 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center gap-2">
            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">1</span>
            Base Price (excl. GST)
          </h5>
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 min-w-[400px] px-3 sm:px-0">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Base Type</label>
                <select
                  name="basePriceType"
                  value={formData.basePriceType}
                  onChange={handleChange}
                  className="input-field text-sm"
                >
                  <option value="mop">MOP (Manual)</option>
                  <option value="purchase">Purchase (API)</option>
                  <option value="market">Market Price</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">MRP</label>
                <input
                  type="number"
                  name="mrp"
                  value={formData.mrp}
                  onChange={handleChange}
                  onKeyDown={handleNumberKeyDown}
                  placeholder="₹0"
                  min="0"
                  className="input-field text-sm"
                />
                <FormGstInput
                  formData={formData}
                  setFormData={setFormData}
                  baseField="mrp"
                  gstRate={formData.gstRate}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  MOP {formData.basePriceType === 'mop' && <span className="text-blue-600">(Base)</span>}
                </label>
                <input
                  type="number"
                  name="mop"
                  value={formData.mop}
                  onChange={handleChange}
                  onKeyDown={handleNumberKeyDown}
                  placeholder="₹0"
                  min="0"
                  className={`input-field text-sm ${formData.basePriceType === 'mop' ? 'border-blue-500 ring-1 ring-blue-500/20' : ''}`}
                />
                <FormGstInput
                  formData={formData}
                  setFormData={setFormData}
                  baseField="mop"
                  gstRate={formData.gstRate}
                  isBase={formData.basePriceType === 'mop'}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Purchase {formData.basePriceType === 'purchase' && <span className="text-blue-600">(Base)</span>}
                </label>
                <input
                  type="number"
                  name="purchasePrice"
                  value={formData.purchasePrice}
                  onChange={handleChange}
                  onKeyDown={handleNumberKeyDown}
                  placeholder="₹0"
                  min="0"
                  className={`input-field text-sm ${formData.basePriceType === 'purchase' ? 'border-blue-500 ring-1 ring-blue-500/20' : ''}`}
                />
                <FormGstInput
                  formData={formData}
                  setFormData={setFormData}
                  baseField="purchasePrice"
                  gstRate={formData.gstRate}
                  isBase={formData.basePriceType === 'purchase'}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Market {formData.basePriceType === 'market' && <span className="text-blue-600">(Base)</span>}
                </label>
                <input
                  type="number"
                  name="marketPrice"
                  value={formData.marketPrice}
                  onChange={handleChange}
                  onKeyDown={handleNumberKeyDown}
                  placeholder="₹0"
                  min="0"
                  className={`input-field text-sm ${formData.basePriceType === 'market' ? 'border-blue-500 ring-1 ring-blue-500/20' : ''}`}
                />
                <FormGstInput
                  formData={formData}
                  setFormData={setFormData}
                  baseField="marketPrice"
                  gstRate={formData.gstRate}
                  isBase={formData.basePriceType === 'market'}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Discounts */}
        <div className="bg-gray-50 rounded-xl p-3 sm:p-4 mb-3 sm:mb-4">
          <h5 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center gap-2">
            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">2</span>
            Discounts (Applied Sequentially)
          </h5>
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3 min-w-[500px] px-3 sm:px-0">
              {[
                { field: 'dis1', label: 'Disc 1' },
                { field: 'dis2', label: 'Disc 2' },
                { field: 'dis3', label: 'Disc 3' },
                { field: 'dis4', label: 'Disc 4' },
                { field: 'dis5', label: 'Disc 5' },
              ].map((discount) => (
                <div key={discount.field} className="text-center">
                  <label className="block text-xs text-gray-500 mb-1">{discount.label}</label>
                  <div className="flex rounded-lg overflow-hidden border border-gray-200 bg-white">
                    <input
                      type="number"
                      name={discount.field}
                      value={formData[discount.field]}
                      onChange={handleChange}
                      onKeyDown={handleNumberKeyDown}
                      placeholder="0"
                      min="0"
                      step="any"
                      className="w-full px-1 sm:px-2 py-2 text-center text-sm focus:outline-none"
                    />
                    <select
                      name={`${discount.field}Type`}
                      value={formData[`${discount.field}Type`]}
                      onChange={handleChange}
                      className="w-12 h-9 text-xs text-center bg-gray-50 border-l focus:outline-none"
                    >
                      <option value="percent">%</option>
                      <option value="flat">Rs</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step 3: NLC & Profit */}
        <div className="bg-blue-50 rounded-xl p-3 sm:p-4 mb-3 sm:mb-4">
          <h5 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center gap-2">
            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">3</span>
            Net Landing Cost & Profit
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 items-end">
            <div className="bg-white rounded-lg p-3 text-center">
              <label className="block text-xs text-gray-500 mb-1">NLC (After GST & Discounts)</label>
              <div className="text-xl sm:text-2xl font-bold text-blue-700">
                ₹{calculatePrices().nlc.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
              </div>
              {calculatePrices().gstRate > 0 && calculatePrices().nlc > 0 && (
                <div className="mt-1">
                  <input
                    type="text"
                    value={`₹${(calculatePrices().nlc / (1 + calculatePrices().gstRate / 100)).toFixed(2)}`}
                    readOnly
                    className="w-full px-2 py-1 text-xs text-right border border-blue-200 rounded bg-blue-50 cursor-default focus:outline-none"
                  />
                  <div className="text-[9px] text-blue-500 text-center">excl. GST</div>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs sm:text-sm text-gray-600 mb-1">Add Profit</label>
              <div className="flex rounded-lg overflow-hidden border border-gray-200 bg-white">
                <input
                  type="number"
                  name="profit"
                  value={formData.profit}
                  onChange={handleChange}
                  onKeyDown={handleNumberKeyDown}
                  placeholder="0"
                  min="0"
                  step="any"
                  className="w-full px-2 sm:px-3 py-2 text-sm focus:outline-none"
                />
                <select
                  name="profitType"
                  value={formData.profitType}
                  onChange={handleChange}
                  className="w-12 h-9 text-xs text-center bg-gray-50 border-l focus:outline-none"
                >
                  <option value="percent">%</option>
                  <option value="flat">Rs</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4: Price List Prices (OP Prices) */}
        <div className="bg-green-50 rounded-xl p-3 sm:p-4">
          <h5 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center gap-2">
            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center">4</span>
            Price List - For Customer Price Lists
          </h5>

          {/* System Integrator Section */}
          <div className="mb-4">
            <h6 className="text-xs font-semibold text-gray-600 mb-2">System Integrator</h6>
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <div className="grid grid-cols-4 gap-2 sm:gap-3 min-w-[400px] px-3 sm:px-0">
                {/* Market Price (SI) - Input */}
                <div className="bg-yellow-50 rounded-lg p-2 sm:p-3 text-center">
                  <label className="block text-xs text-gray-500 mb-1">Market Price (SI)</label>
                  <div className="flex rounded-lg overflow-hidden border border-yellow-300 bg-white mb-1">
                    <input
                      type="number"
                      name="marketPriceSI"
                      value={formData.marketPriceSI}
                      onChange={handleChange}
                      onKeyDown={handleNumberKeyDown}
                      placeholder="0"
                      min="0"
                      step="any"
                      className="w-full px-1 sm:px-2 py-1.5 sm:py-2 text-center text-sm font-medium focus:outline-none"
                    />
                  </div>
                  <FormGstInput
                    formData={formData}
                    setFormData={setFormData}
                    baseField="marketPriceSI"
                    gstRate={formData.gstRate}
                  />
                  <div className="text-xs text-gray-400 font-medium mt-0.5">
                    {parseFloat(formData.marketPriceSI) > 0 ? 'SI base price' : 'Uses default base'}
                  </div>
                </div>

                {/* SI1 - Input */}
                <div className="bg-white rounded-lg p-2 sm:p-3 text-center">
                  <label className="block text-xs text-gray-500 mb-1">SI1 Price</label>
                  <div className="flex rounded-lg overflow-hidden border border-gray-200 bg-white mb-1">
                    <input
                      type="number"
                      name="opSi1"
                      value={formData.opSi1}
                      onChange={handleChange}
                      onKeyDown={handleNumberKeyDown}
                      placeholder="0"
                      min="0"
                      step="any"
                      className="w-full px-1 sm:px-2 py-1.5 sm:py-2 text-center text-sm font-medium focus:outline-none"
                    />
                  </div>
                  <div className="text-xs text-green-600 font-medium">
                    ₹{calculatePrices().opSi1?.toLocaleString('en-IN', { minimumFractionDigits: 0 }) || '0'}
                  </div>
                  {formData.gstRate > 0 && (calculatePrices().opSi1 || 0) > 0 && (
                    <div className="mt-0.5">
                      <input
                        type="text"
                        value={`₹${((calculatePrices().opSi1 || 0) * (1 + formData.gstRate / 100)).toFixed(2)}`}
                        readOnly
                        className="w-full px-2 py-1 text-xs text-right border border-green-200 rounded bg-green-50 cursor-default focus:outline-none"
                      />
                      <div className="text-[9px] text-green-600 text-center">+ {formData.gstRate}% GST</div>
                    </div>
                  )}
                </div>

                {/* SI2 - Auto-calculated (SI1 + 1%) */}
                <div className="bg-white rounded-lg p-2 sm:p-3 text-center opacity-75">
                  <label className="block text-xs text-gray-500 mb-1">SI2 (SI1+1%)</label>
                  <div className="flex rounded-lg overflow-hidden border border-gray-200 bg-gray-100 mb-1">
                    <input
                      type="text"
                      value="+1%"
                      disabled
                      className="w-full px-1 sm:px-2 py-1.5 sm:py-2 text-center text-sm font-medium bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                  <div className="text-xs text-blue-600 font-medium">
                    ₹{calculatePrices().opSi2?.toLocaleString('en-IN', { minimumFractionDigits: 0 }) || '0'}
                  </div>
                  {formData.gstRate > 0 && (calculatePrices().opSi2 || 0) > 0 && (
                    <div className="mt-0.5">
                      <input
                        type="text"
                        value={`₹${((calculatePrices().opSi2 || 0) * (1 + formData.gstRate / 100)).toFixed(2)}`}
                        readOnly
                        className="w-full px-2 py-1 text-xs text-right border border-green-200 rounded bg-green-50 cursor-default focus:outline-none"
                      />
                      <div className="text-[9px] text-green-600 text-center">+ {formData.gstRate}% GST</div>
                    </div>
                  )}
                </div>

                {/* C1 - Auto-calculated (SI1 + 20%) */}
                <div className="bg-white rounded-lg p-2 sm:p-3 text-center opacity-75">
                  <label className="block text-xs text-gray-500 mb-1">C1 (SI1+20%)</label>
                  <div className="flex rounded-lg overflow-hidden border border-gray-200 bg-gray-100 mb-1">
                    <input
                      type="text"
                      value="+20%"
                      disabled
                      className="w-full px-1 sm:px-2 py-1.5 sm:py-2 text-center text-sm font-medium bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                  <div className="text-xs text-blue-600 font-medium">
                    ₹{calculatePrices().opC1?.toLocaleString('en-IN', { minimumFractionDigits: 0 }) || '0'}
                  </div>
                  {formData.gstRate > 0 && (calculatePrices().opC1 || 0) > 0 && (
                    <div className="mt-0.5">
                      <input
                        type="text"
                        value={`₹${((calculatePrices().opC1 || 0) * (1 + formData.gstRate / 100)).toFixed(2)}`}
                        readOnly
                        className="w-full px-2 py-1 text-xs text-right border border-green-200 rounded bg-green-50 cursor-default focus:outline-none"
                      />
                      <div className="text-[9px] text-green-600 text-center">+ {formData.gstRate}% GST</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Reseller Section */}
          <div>
            <h6 className="text-xs font-semibold text-gray-600 mb-2">Reseller</h6>
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <div className="grid grid-cols-3 gap-2 sm:gap-3 min-w-[300px] px-3 sm:px-0">
                {/* Market Price (Reseller) - Input */}
                <div className="bg-yellow-50 rounded-lg p-2 sm:p-3 text-center">
                  <label className="block text-xs text-gray-500 mb-1">Market Price (Reseller)</label>
                  <div className="flex rounded-lg overflow-hidden border border-yellow-300 bg-white mb-1">
                    <input
                      type="number"
                      name="marketPriceReseller"
                      value={formData.marketPriceReseller}
                      onChange={handleChange}
                      onKeyDown={handleNumberKeyDown}
                      placeholder="0"
                      min="0"
                      step="any"
                      className="w-full px-1 sm:px-2 py-1.5 sm:py-2 text-center text-sm font-medium focus:outline-none"
                    />
                  </div>
                  <FormGstInput
                    formData={formData}
                    setFormData={setFormData}
                    baseField="marketPriceReseller"
                    gstRate={formData.gstRate}
                  />
                  <div className="text-xs text-gray-400 font-medium mt-0.5">
                    {parseFloat(formData.marketPriceReseller) > 0 ? 'Reseller base price' : 'Uses default base'}
                  </div>
                </div>

                {/* T1 - Input */}
                <div className="bg-white rounded-lg p-2 sm:p-3 text-center">
                  <label className="block text-xs text-gray-500 mb-1">T1 Price</label>
                  <div className="flex rounded-lg overflow-hidden border border-gray-200 bg-white mb-1">
                    <input
                      type="number"
                      name="opT1"
                      value={formData.opT1}
                      onChange={handleChange}
                      onKeyDown={handleNumberKeyDown}
                      placeholder="0"
                      min="0"
                      step="any"
                      className="w-full px-1 sm:px-2 py-1.5 sm:py-2 text-center text-sm font-medium focus:outline-none"
                    />
                  </div>
                  <div className="text-xs text-green-600 font-medium">
                    ₹{calculatePrices().opT1?.toLocaleString('en-IN', { minimumFractionDigits: 0 }) || '0'}
                  </div>
                  {formData.gstRate > 0 && (calculatePrices().opT1 || 0) > 0 && (
                    <div className="mt-0.5">
                      <input
                        type="text"
                        value={`₹${((calculatePrices().opT1 || 0) * (1 + formData.gstRate / 100)).toFixed(2)}`}
                        readOnly
                        className="w-full px-2 py-1 text-xs text-right border border-green-200 rounded bg-green-50 cursor-default focus:outline-none"
                      />
                      <div className="text-[9px] text-green-600 text-center">+ {formData.gstRate}% GST</div>
                    </div>
                  )}
                </div>

                {/* T2 - Auto-calculated (T1 + 0.5%) */}
                <div className="bg-white rounded-lg p-2 sm:p-3 text-center opacity-75">
                  <label className="block text-xs text-gray-500 mb-1">T2 (T1+0.5%)</label>
                  <div className="flex rounded-lg overflow-hidden border border-gray-200 bg-gray-100 mb-1">
                    <input
                      type="text"
                      value="+0.5%"
                      disabled
                      className="w-full px-1 sm:px-2 py-1.5 sm:py-2 text-center text-sm font-medium bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                  <div className="text-xs text-blue-600 font-medium">
                    ₹{calculatePrices().opT2?.toLocaleString('en-IN', { minimumFractionDigits: 0 }) || '0'}
                  </div>
                  {formData.gstRate > 0 && (calculatePrices().opT2 || 0) > 0 && (
                    <div className="mt-0.5">
                      <input
                        type="text"
                        value={`₹${((calculatePrices().opT2 || 0) * (1 + formData.gstRate / 100)).toFixed(2)}`}
                        readOnly
                        className="w-full px-2 py-1 text-xs text-right border border-green-200 rounded bg-green-50 cursor-default focus:outline-none"
                      />
                      <div className="text-[9px] text-green-600 text-center">+ {formData.gstRate}% GST</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-3 text-center">
            <strong>System Integrator:</strong> Market Price (SI) overrides base for SI calculations. SI1 margin → SI2 and C1 auto-calculated.
            <strong className="ml-2">Reseller:</strong> Market Price (Reseller) overrides base for T calculations. T1 margin → T2 auto-calculated.
          </p>
        </div>
      </div>

      <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1 text-sm" disabled={loading}>Cancel</button>
        <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm" disabled={loading}>
          {loading && <Loader className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />}
          {product ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  )
}

// Inline Input Component - Always shows input, auto-saves on blur/Tab
function InlineInput({ product, field, value, onSave, onKeyDown, type = 'number', width = 'w-20', savingFields, min = 0 }) {
  const [localValue, setLocalValue] = useState(value?.toString() || '')
  const inputRef = useRef(null)
  const isSaving = savingFields?.[`${product._id}-${field}`]

  // Sync local value when prop changes
  useEffect(() => {
    setLocalValue(value?.toString() || '')
  }, [value])

  const handleChange = (e) => {
    setLocalValue(e.target.value)
  }

  const handleBlur = () => {
    // Only save if value changed
    let newValue = type === 'number' ? parseFloat(localValue) || 0 : localValue
    const oldValue = type === 'number' ? parseFloat(value) || 0 : value
    // Prevent negative values for number fields
    if (type === 'number' && min !== undefined && newValue < min) {
      newValue = min
      setLocalValue(min.toString())
    }
    if (newValue !== oldValue) {
      onSave(product, field, newValue)
    }
  }

  const handleKeyDown = (e, product) => {
    // Block minus key for number inputs
    if (e.key === '-' && type === 'number') {
      e.preventDefault()
      return
    }
    if (e.key === 'Enter' || e.key === 'Tab') {
      // Save on Enter or Tab
      let newValue = type === 'number' ? parseFloat(localValue) || 0 : localValue
      const oldValue = type === 'number' ? parseFloat(value) || 0 : value
      // Prevent negative values for number fields
      if (type === 'number' && min !== undefined && newValue < min) {
        newValue = min
      }
      if (newValue !== oldValue) {
        onSave(product, field, newValue)
      }
    }
  }

  return (
    <input
      ref={inputRef}
      type={type}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={(e) => handleKeyDown(e, product)}
      className={`${width} px-2 py-1 text-xs text-right border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${isSaving ? 'bg-yellow-50' : ''}`}
      disabled={isSaving}
      min={type === 'number' ? min : undefined}
      step={type === 'number' ? 'any' : undefined}
    />
  )
}

// Inline GST Price Component - Shows price with GST in an editable input-style box
// When edited, reverse-calculates the base price (e.g., MRP or MOP)
function InlineGstPrice({ product, baseField, gstRate, onSave, savingFields, isBase = false }) {
  const gstValue = (parseFloat(product[baseField]) || 0) * (1 + (parseFloat(gstRate) || 0) / 100)
  const [localValue, setLocalValue] = useState(gstValue ? gstValue.toFixed(2) : '')
  const inputRef = useRef(null)
  const isSaving = savingFields?.[`${product._id}-${baseField}`]

  useEffect(() => {
    const newGstValue = (parseFloat(product[baseField]) || 0) * (1 + (parseFloat(gstRate) || 0) / 100)
    setLocalValue(newGstValue ? newGstValue.toFixed(2) : '')
  }, [product[baseField], gstRate])

  const handleBlur = () => {
    const newGstPrice = parseFloat(localValue) || 0
    if (newGstPrice > 0 && parseFloat(gstRate) > 0) {
      // Reverse calculate: basePrice = gstPrice / (1 + gstRate/100)
      const basePrice = Math.round((newGstPrice / (1 + parseFloat(gstRate) / 100)) * 100) / 100
      const oldBase = parseFloat(product[baseField]) || 0
      if (basePrice !== oldBase) {
        onSave(product, baseField, basePrice)
      }
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === '-') {
      e.preventDefault()
      return
    }
    if (e.key === 'Enter' || e.key === 'Tab') {
      const newGstPrice = parseFloat(localValue) || 0
      if (newGstPrice > 0 && parseFloat(gstRate) > 0) {
        const basePrice = Math.round((newGstPrice / (1 + parseFloat(gstRate) / 100)) * 100) / 100
        const oldBase = parseFloat(product[baseField]) || 0
        if (basePrice !== oldBase) {
          onSave(product, baseField, basePrice)
        }
      }
    }
  }

  return (
    <div className="mt-0.5">
      <input
        ref={inputRef}
        type="number"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`w-20 px-2 py-1 text-xs text-right border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${isBase ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-300'} ${isSaving ? 'opacity-50' : ''}`}
        disabled={isSaving}
        min={0}
        step="any"
        placeholder="+GST"
      />
      {isBase && (
        <div className="text-[9px] text-blue-600 font-medium text-center">Base</div>
      )}
    </div>
  )
}

// Inline Select Component - Always shows select
function InlineSelect({ product, field, value, options, onSave, savingFields }) {
  const [localValue, setLocalValue] = useState(value || '')
  const isSaving = savingFields?.[`${product._id}-${field}`]

  useEffect(() => {
    setLocalValue(value || '')
  }, [value])

  const handleChange = (e) => {
    const newValue = e.target.value
    setLocalValue(newValue)
    if (newValue !== value) {
      onSave(product, field, newValue)
    }
  }

  return (
    <select
      value={localValue}
      onChange={handleChange}
      className="px-2 py-1 text-[10px] border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
      disabled={isSaving}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}

// Inline Price Value Component - for displaying/editing price values only (no type dropdown)
function InlinePriceValue({ product, field, value, onSave, savingFields }) {
  const [localValue, setLocalValue] = useState(value?.toString() || '0')
  const isSaving = savingFields?.[`${product._id}-${field}`]

  useEffect(() => {
    setLocalValue(value?.toString() || '0')
  }, [value])

  const handleChange = (e) => {
    setLocalValue(e.target.value)
  }

  const handleBlur = () => {
    let newValue = parseFloat(localValue) || 0
    // Prevent negative values
    if (newValue < 0) {
      newValue = 0
      setLocalValue('0')
    }
    const oldValue = parseFloat(value) || 0
    if (newValue !== oldValue) {
      onSave(product, field, newValue)
    }
  }

  const handleKeyDown = (e) => {
    // Block minus key
    if (e.key === '-') {
      e.preventDefault()
      return
    }
    if (e.key === 'Enter' || e.key === 'Tab') {
      let newValue = parseFloat(localValue) || 0
      // Prevent negative values
      if (newValue < 0) {
        newValue = 0
      }
      const oldValue = parseFloat(value) || 0
      if (newValue !== oldValue) {
        onSave(product, field, newValue)
      }
    }
  }

  return (
    <input
      type="number"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className="w-16 px-2 py-1 text-xs text-center border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
      disabled={isSaving}
      min="0"
      step="any"
    />
  )
}

// Inline Discount Component - Value + Type (e.g., 10% or ₹100)
function InlineDiscount({ product, disIndex, field, value, type: typeVal, onSave, onSaveType, savingFields }) {
  // Determine field name - use disIndex for discount fields, otherwise use field prop
  const valueField = disIndex ? `dis${disIndex}` : field
  const typeField = disIndex ? `dis${disIndex}Type` : `${field}Type`
  const isSavingValue = savingFields?.[`${product._id}-${valueField}`]
  const isSavingType = savingFields?.[`${product._id}-${typeField}`]
  const isSaving = isSavingValue || isSavingType

  const [localValue, setLocalValue] = useState(value?.toString() || '0')

  useEffect(() => {
    setLocalValue(value?.toString() || '0')
  }, [value])

  const handleChange = (e) => {
    setLocalValue(e.target.value)
  }

  const handleBlur = () => {
    let newValue = parseFloat(localValue) || 0
    // Prevent negative values
    if (newValue < 0) {
      newValue = 0
      setLocalValue('0')
    }
    const oldValue = parseFloat(value) || 0
    if (newValue !== oldValue) {
      onSave(product, valueField, newValue)
    }
  }

  const handleKeyDown = (e) => {
    // Block minus key
    if (e.key === '-') {
      e.preventDefault()
      return
    }
    if (e.key === 'Enter' || e.key === 'Tab') {
      let newValue = parseFloat(localValue) || 0
      // Prevent negative values
      if (newValue < 0) {
        newValue = 0
      }
      const oldValue = parseFloat(value) || 0
      if (newValue !== oldValue) {
        onSave(product, valueField, newValue)
      }
    }
  }

  // Get the current type for display
  const currentType = typeVal || 'percent'
  const typeLabel = currentType === 'percent' ? '%' : 'Rs'
  const otherType = currentType === 'percent' ? 'flat' : 'percent'
  const otherLabel = currentType === 'percent' ? 'Rs' : '%'

  const handleToggleType = () => {
    if (!isSaving && onSaveType) {
      onSaveType(product._id, typeField, otherType)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-14 px-2 py-1 text-xs text-center border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        disabled={isSaving}
        min="0"
        step="any"
      />
      <button
        type="button"
        onClick={handleToggleType}
        className={`w-10 h-6 text-xs font-medium border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
          currentType === 'percent'
            ? 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100'
            : 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100'
        } ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        disabled={isSaving}
        title={`Click to change to ${otherLabel}`}
      >
        {typeLabel}
      </button>
    </div>
  )
}

// Inline Profit/OP Component - Value + Type for profit and tier prices
function InlinePriceInput({ product, field, value, type: typeVal, onSave, onSaveType, savingFields, isPrice = false }) {
  const [localValue, setLocalValue] = useState(value?.toString() || '0')
  const isSaving = savingFields?.[`${product._id}-${field}`]

  useEffect(() => {
    setLocalValue(value?.toString() || '0')
  }, [value])

  const handleChange = (e) => {
    setLocalValue(e.target.value)
  }

  const handleBlur = () => {
    let newValue = parseFloat(localValue) || 0
    // Prevent negative values
    if (newValue < 0) {
      newValue = 0
      setLocalValue('0')
    }
    const oldValue = parseFloat(value) || 0
    if (newValue !== oldValue) {
      onSave(product, field, newValue)
    }
  }

  const handleKeyDown = (e) => {
    // Block minus key
    if (e.key === '-') {
      e.preventDefault()
      return
    }
    if (e.key === 'Enter' || e.key === 'Tab') {
      let newValue = parseFloat(localValue) || 0
      // Prevent negative values
      if (newValue < 0) {
        newValue = 0
      }
      const oldValue = parseFloat(value) || 0
      if (newValue !== oldValue) {
        onSave(product, field, newValue)
      }
    }
  }

  const handleTypeChange = (e) => {
    const newType = e.target.value
    if (newType !== typeVal) {
      onSaveType(product, `${field}Type`, newType)
    }
  }

  const displayValue = isPrice ? (value ? `₹${Number(value).toLocaleString('en-IN')}` : '-') : value

  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-14 px-2 py-1 text-xs text-center border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        disabled={isSaving}
        min="0"
        step="any"
      />
      <select
        value={typeVal || 'percent'}
        onChange={handleTypeChange}
        className="w-14 h-6 text-xs text-center border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white cursor-pointer"
        disabled={isSaving}
      >
        <option value="percent">%</option>
        <option value="flat">Rs</option>
      </select>
    </div>
  )
}

// Editable Cell Component - for single values (kept for backward compatibility)
function EditableCell({ productId, field, value, displayValue, editingField, editingValue, savingField, onStartEdit, onChangeValue, onBlur, onKeyDown, type = 'text', width = 'w-20' }) {
  const isEditing = editingField?.productId === productId && editingField?.field === field
  const isSaving = savingField && isEditing

  if (isEditing) {
    return (
      <input
        type={type}
        value={editingValue}
        onChange={(e) => onChangeValue(e.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        autoFocus
        className={`${width} px-2 py-1 text-sm text-right border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
        disabled={isSaving}
      />
    )
  }

  return (
    <div onClick={() => !savingField && onStartEdit(productId, field, value)} className="cursor-pointer">
      {displayValue}
    </div>
  )
}

// Editable Select Component - for dropdown values
function EditableSelect({ productId, field, value, options, displayValue, editingField, editingValue, savingField, onStartEdit, onChangeValue, onBlur }) {
  const isEditing = editingField?.productId === productId && editingField?.field === field

  if (isEditing) {
    return (
      <select
        value={editingValue}
        onChange={(e) => onChangeValue(e.target.value)}
        onBlur={onBlur}
        autoFocus
        className="px-2 py-1 text-xs border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        disabled={savingField}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    )
  }

  return (
    <div onClick={() => !savingField && onStartEdit(productId, field, value)} className="cursor-pointer">
      {displayValue}
    </div>
  )
}

// Editable Discount Component - for value + type (e.g., 10% or ₹100)
function EditableDiscount({ productId, field, disIndex, value, type: typeVal, editingField, editingValue, savingField, onStartEdit, onChangeValue, onBlur, onKeyDown, isPrice = false, onSaveType }) {
  // Determine the field name
  const valueField = disIndex ? `dis${disIndex}` : field
  const typeField = disIndex ? `dis${disIndex}Type` : `${field}Type`

  // Check if this product's discount cell is being edited
  const isEditingThisCell = editingField?.productId === productId &&
    (editingField?.field === valueField || editingField?.field === typeField)

  // When editing, show input + dropdown
  if (isEditingThisCell) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={editingValue}
          onChange={(e) => onChangeValue(e.target.value)}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          autoFocus
          className="w-14 px-2 py-1 text-xs text-center border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          disabled={savingField}
          placeholder="0"
        />
        <select
          value={typeVal || 'percent'}
          onChange={(e) => {
            e.stopPropagation()
            const newType = e.target.value
            if (onSaveType) {
              onSaveType(productId, typeField, newType)
            }
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="w-14 h-6 text-xs text-center border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white cursor-pointer"
          disabled={savingField}
        >
          <option value="percent">%</option>
          <option value="flat">Rs</option>
        </select>
      </div>
    )
  }

  // When NOT editing, show clickable value + always-visible dropdown
  return (
    <div className="flex items-center gap-1">
      <div
        onClick={(e) => {
          e.stopPropagation()
          if (!savingField) onStartEdit(productId, valueField, value)
        }}
        className="cursor-pointer hover:bg-yellow-50 px-1 rounded text-xs"
      >
        {isPrice ? (value ? `₹${Number(value).toLocaleString('en-IN')}` : '-') : (value ? `${value}${typeVal === 'percent' ? '%' : '₹'}` : '-')}
      </div>
      <select
        value={typeVal || 'percent'}
        onChange={(e) => {
          e.stopPropagation()
          const newType = e.target.value
          if (onSaveType) {
            onSaveType(productId, typeField, newType)
          }
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="w-14 h-6 text-xs text-center border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white cursor-pointer"
        disabled={savingField}
      >
        <option value="percent">%</option>
        <option value="flat">Rs</option>
      </select>
    </div>
  )
}

export default function Products() {
  const [products, setProducts] = useState([])
  const [brands, setBrands] = useState([])
  const [categories, setCategories] = useState([])
  const [allCategories, setAllCategories] = useState([]) // Cache all categories
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [subcategories, setSubcategories] = useState([])
  const [series, setSeries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [brandFilter, setBrandFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [categoryFilterId, setCategoryFilterId] = useState('')
  const [subcategoryFilter, setSubcategoryFilter] = useState('')
  const [subcategoryFilterId, setSubcategoryFilterId] = useState('')
  const [seriesFilter, setSeriesFilter] = useState('')
  const [seriesFilterId, setSeriesFilterId] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
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

  // Inline editing state - for individual field auto-save
  const [editingField, setEditingField] = useState(null) // { productId, field }
  const [editingValue, setEditingValue] = useState('')
  const [savingField, setSavingField] = useState(false)
  const [savingFields, setSavingFields] = useState({}) // Track saving state per field: { 'productId-field': true }

  // Column visibility state - all columns visible by default
  const [showColumnPopup, setShowColumnPopup] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState([
    'stock', 'mrp', 'mop', 'base',
    'd1', 'd2', 'd3', 'd4', 'd5', 'nlc',
    'purchase', 'marketSI', 'marketReseller',
    'c1', 'si1', 'si2', 't1', 't2'
  ])
  const columnPopupRef = useRef(null)

  // Bulk update state - for applying discounts to filtered products
  const [bulkValues, setBulkValues] = useState({
    dis1: { value: '', type: 'percent' },
    dis2: { value: '', type: 'percent' },
    dis3: { value: '', type: 'percent' },
    dis4: { value: '', type: 'percent' },
    dis5: { value: '', type: 'percent' },
    // System Integrator: only SI1 is editable, SI2 and C1 are auto-calculated
    opSi1: { value: '', type: 'percent' },
    // Reseller: only T1 is editable, T2 is auto-calculated
    opT1: { value: '', type: 'percent' },
  })
  const [bulkUpdating, setBulkUpdating] = useState(false)

  // Close column popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (columnPopupRef.current && !columnPopupRef.current.contains(event.target)) {
        setShowColumnPopup(false)
      }
    }
    if (showColumnPopup) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showColumnPopup])

  // Toggle column visibility
  const toggleColumnVisibility = (key) => {
    if (key === 'all') {
      // Show all columns
      setVisibleColumns(['stock', 'mrp', 'mop', 'base', 'd1', 'd2', 'd3', 'd4', 'd5', 'nlc', 'purchase', 'marketSI', 'si1', 'si2', 'c1', 'marketReseller', 't1', 't2'])
    } else if (key === 'none') {
      // Hide all columns (keep at least one visible)
      setVisibleColumns([])
    } else {
      setVisibleColumns(prev => {
        if (prev.includes(key)) {
          return prev.filter(c => c !== key)
        } else {
          return [...prev, key]
        }
      })
    }
  }

  // Filter subcategories and series when category filter changes
  const [filterSubcategories, setFilterSubcategories] = useState([])
  const [filterSeries, setFilterSeries] = useState([])

  // Debounce search - trigger API after 300ms of no typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchBrands = async () => {
    try {
      const response = await getBrands({ limit: 1000 })
      if (response.success !== false) {
        setBrands(response.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch brands:', err)
    }
  }

  const fetchCategories = async (brand = null) => {
    try {
      setLoadingCategories(true)
      const params = { limit: 1000 }
      if (brand) {
        params.brand = brand
      }
      const response = await getCategories(params)
      if (response.success !== false) {
        const cats = response.data || []
        setCategories(cats)
        // Cache all categories on first load (when no brand is selected)
        if (!brand && allCategories.length === 0) {
          setAllCategories(cats)
        }
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    } finally {
      setLoadingCategories(false)
    }
  }

  // Fetch categories when brand filter changes
  useEffect(() => {
    if (brandFilter) {
      fetchCategories(brandFilter)
      // Reset category/subcategory/series when brand changes
      setCategoryFilter('')
      setCategoryFilterId('')
      setSubcategoryFilter('')
      setSubcategoryFilterId('')
      setSeriesFilter('')
      setSeriesFilterId('')
    } else {
      // Show all categories when brand is cleared
      if (allCategories.length > 0) {
        setCategories(allCategories)
      } else {
        fetchCategories()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandFilter])

  // Use ref to track if component is mounted
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const fetchProducts = useCallback(async (page = 1, limit = 10) => {
    setLoading(true)
    setError(null)
    try {
      const params = { page, limit }
      if (brandFilter) params.brand = brandFilter
      if (categoryFilter) params.category = categoryFilter
      if (subcategoryFilter) params.subcategory = subcategoryFilter
      if (seriesFilter) params.series = seriesFilter
      if (debouncedSearch) params.search = debouncedSearch

      const response = await getAdminProducts(params)
      if (response.success !== false) {
        if (response.pagination) {
          setProducts(response.data || [])
          setPagination({
            total: response.pagination.totalItems || response.pagination.total || 0,
            totalPages: response.pagination.totalPages || 1,
            limit: response.pagination.itemsPerPage || response.pagination.limit || 10,
          })
        } else {
          setProducts(response.data || response.products || [])
          setPagination({
            total: (response.data || response.products || []).length,
            totalPages: 1,
            limit: 9999,
          })
        }
      } else {
        if (isMountedRef.current) {
          setError(response.message || 'Failed to fetch products')
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError('Failed to fetch products')
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [brandFilter, categoryFilter, subcategoryFilter, seriesFilter, debouncedSearch])

  useEffect(() => {
    fetchBrands()
    fetchCategories()
    fetchProducts(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch products when search or filters change
  useEffect(() => {
    setCurrentPage(1)
    fetchProducts(1)
  }, [fetchProducts])

  // Load subcategories and series when category filter changes
  useEffect(() => {
    if (categoryFilterId) {
      // Fetch subcategories for this category
      getSubcategories({ category: categoryFilterId, limit: 100, active: true })
        .then(res => {
          if (res.success !== false) {
            setFilterSubcategories(res.data || [])
          }
        })
        .catch(() => setFilterSubcategories([]))

      // Fetch series for this category
      getSeries({ category: categoryFilterId, limit: 100, active: true })
        .then(res => {
          if (res.success !== false) {
            setFilterSeries(res.data || [])
          }
        })
        .catch(() => setFilterSeries([]))

      setSubcategoryFilter('')
      setSubcategoryFilterId('')
      setSeriesFilter('')
      setSeriesFilterId('')
    } else {
      setFilterSubcategories([])
      setFilterSeries([])
      setSubcategoryFilter('')
      setSubcategoryFilterId('')
      setSeriesFilter('')
      setSeriesFilterId('')
    }
  }, [categoryFilterId])

  const handlePageChange = (page) => {
    setCurrentPage(page)
    fetchProducts(page, pagination.limit)
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const response = await syncProducts()
      if (response.success) {
        const { total, synced, failed } = response.data || {}
        const message = failed > 0
          ? `Synced ${synced} of ${total} products. ${failed} failed.`
          : `Successfully synced ${synced} products from AccountGST.`
        alert(message)
        fetchProducts(currentPage)
        fetchBrands()
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
      if (response.success !== false) {
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
      if (response.success !== false) {
        setProducts(prev => prev.map(p => p._id === selectedProduct._id ? response.data : p))
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
      if (response.success !== false) {
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

  // Toggle product active status (Continue/Discontinue)
  const toggleProductStatus = async (productId, currentStatus) => {
    const newStatus = !currentStatus
    try {
      const response = await updateAdminProduct(productId, { active: newStatus })
      if (response.success !== false) {
        setProducts(prev => prev.map(p => p._id === productId ? { ...p, active: newStatus } : p))
      } else {
        alert(response.message || 'Failed to update status')
      }
    } catch (err) {
      alert('Failed to update status')
    }
  }

  // Bulk update filtered products with discounts/tier prices
  const handleBulkUpdate = async (fieldKey) => {
    const value = bulkValues[fieldKey]?.value
    const type = bulkValues[fieldKey]?.type || 'percent'

    // Don't update if value is empty
    if (value === '' || value === undefined || value === null) {
      return
    }

    // Build updates object for this single field
    const updates = {}

    if (fieldKey.startsWith('dis')) {
      // Discount fields
      const disNum = fieldKey.replace('dis', '')
      updates[fieldKey] = parseFloat(value) || 0
      updates[`dis${disNum}Type`] = type
    } else {
      // Tier price fields
      updates[fieldKey] = parseFloat(value) || 0
      updates[`${fieldKey}Type`] = type
    }

    setBulkUpdating(true)
    try {
      // Build filters object
      const filters = {}
      if (brandFilter) filters.brand = brandFilter
      if (categoryFilter) filters.category = categoryFilter
      if (subcategoryFilter) filters.subcategory = subcategoryFilter
      if (seriesFilter) filters.series = seriesFilter
      if (debouncedSearch) filters.search = debouncedSearch

      const response = await bulkUpdateProducts(filters, updates)
      if (response.success !== false) {
        // Refresh products to show updated values
        fetchProducts(currentPage)
      } else {
        alert(response.message || 'Failed to update products')
      }
    } catch (err) {
      alert('Failed to update products')
    } finally {
      setBulkUpdating(false)
    }
  }

  // Handle Enter key press for bulk update inputs
  const handleBulkKeyDown = (e, fieldKey) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleBulkUpdate(fieldKey)
    }
  }

  // Inline editing functions - Auto-save on blur
  const startEditingField = (productId, field, currentValue) => {
    setEditingField({ productId, field })
    setEditingValue(currentValue?.toString() || '')
  }

  const cancelEditingField = () => {
    setEditingField(null)
    setEditingValue('')
  }

  // Save field directly from inline input (auto-save on blur)
  const saveFieldDirectly = async (product, field, newValue) => {
    const fieldKey = `${product._id}-${field}`
    if (savingFields[fieldKey]) return

    setSavingFields(prev => ({ ...prev, [fieldKey]: true }))

    try {
      let updateData = {}

      // Determine field type and set value
      if (field === 'stock') {
        updateData[field] = parseInt(newValue) || 0
      } else if (field === 'basePriceType') {
        updateData[field] = newValue
      } else if (['mrp', 'mop', 'purchasePrice', 'marketPrice', 'marketPriceSI', 'marketPriceReseller', 'dis1', 'dis2', 'dis3', 'dis4', 'dis5', 'profit', 'op1', 'op2', 'op3', 'op4'].includes(field)) {
        updateData[field] = parseFloat(newValue) || 0
      } else {
        updateData[field] = newValue
      }

      // Recalculate NLC and tier prices if pricing fields changed
      const pricingFields = ['mrp', 'mop', 'purchasePrice', 'marketPrice', 'marketPriceSI', 'marketPriceReseller', 'basePriceType', 'dis1', 'dis2', 'dis3', 'dis4', 'dis5', 'profit', 'opC1', 'opSi1', 'opSi2', 'opT1', 'opT2']
      if (pricingFields.includes(field)) {
        const updatedProduct = { ...product, ...updateData }
        const gstRate = parseFloat(updatedProduct.gstRate) || 0

        // Calculate base price without GST
        let basePriceWithoutGst = 0
        if (updatedProduct.basePriceType === 'mop') {
          basePriceWithoutGst = parseFloat(updatedProduct.mop) || 0
        } else if (updatedProduct.basePriceType === 'purchase') {
          basePriceWithoutGst = parseFloat(updatedProduct.purchasePrice) || 0
        } else if (updatedProduct.basePriceType === 'market') {
          basePriceWithoutGst = parseFloat(updatedProduct.marketPrice) || 0
        }

        // Add GST to get base price
        let nlc = basePriceWithoutGst * (1 + gstRate / 100)

        // Apply discounts
        for (let i = 1; i <= 5; i++) {
          const discountVal = parseFloat(updatedProduct[`dis${i}`]) || 0
          const discountType = updatedProduct[`dis${i}Type`]
          if (discountType === 'percent') {
            nlc = nlc - (nlc * discountVal / 100)
          } else {
            nlc = nlc - discountVal
          }
        }
        nlc = Math.round(nlc * 100) / 100

        // Calculate price with profit
        let priceWithProfit = nlc
        const profitVal = parseFloat(updatedProduct.profit) || 0
        if (updatedProduct.profitType === 'percent') {
          priceWithProfit = nlc + (nlc * profitVal / 100)
        } else {
          priceWithProfit = nlc + profitVal
        }

        // Calculate OP prices
        const calculateOpPrice = (opField, opTypeField, basePrice = priceWithProfit) => {
          const inputValue = parseFloat(updatedProduct[opField]) || 0
          if (updatedProduct[opTypeField] === 'flat') {
            // For flat margin: final price = basePrice + flatAmount
            return Math.round((basePrice + inputValue) * 100) / 100
          } else {
            // For percent margin: final price = basePrice * (1 + percentage/100)
            return Math.round((basePrice * (1 + inputValue / 100)) * 100) / 100
          }
        }

        // Determine base for SI prices: use marketPriceSI if set, otherwise priceWithProfit
        const siBase = (parseFloat(updatedProduct.marketPriceSI) > 0) ? parseFloat(updatedProduct.marketPriceSI) : priceWithProfit
        // Determine base for T prices: use marketPriceReseller if set, otherwise priceWithProfit
        const tBase = (parseFloat(updatedProduct.marketPriceReseller) > 0) ? parseFloat(updatedProduct.marketPriceReseller) : priceWithProfit

        // Calculate SI1 from SI base
        const si1Price = calculateOpPrice('opSi1', 'opSi1Type', siBase)
        const si2Price = Math.round(si1Price * 1.01 * 100) / 100
        const c1Price = Math.round(si1Price * 1.20 * 100) / 100

        // Calculate T1 from T base
        const t1Price = calculateOpPrice('opT1', 'opT1Type', tBase)
        const t2Price = Math.round(t1Price * 1.005 * 100) / 100

        updateData.nlc = nlc
        // New Price List prices
        updateData.c1 = c1Price
        updateData.si1 = si1Price
        updateData.si2 = si2Price
        updateData.t1 = t1Price
        updateData.t2 = t2Price
        updateData.opPrice = c1Price
        // Legacy tier prices (kept for backward compatibility)
        updateData.t3 = calculateOpPrice('op3', 'op3Type')
        updateData.t4 = calculateOpPrice('op4', 'op4Type')
        // Note: op fields store the user's input (percentage or flat amount), NOT the calculated price
        // c1, si1, si2, t1, t2 store the calculated final prices
      }

      const response = await updateAdminProduct(product._id, updateData)
      if (response.success !== false) {
        setProducts(prev => prev.map(p => p._id === product._id ? { ...p, ...updateData } : p))
      } else {
        alert(response.message || 'Failed to update')
      }
    } catch (err) {
      console.error('Failed to save:', err)
      alert('Failed to save changes')
    } finally {
      setSavingFields(prev => {
        const newState = { ...prev }
        delete newState[fieldKey]
        return newState
      })
    }
  }

  // Direct save for type dropdowns (percent/flat)
  const saveTypeDirectly = async (productId, typeField, newType) => {
    const fieldKey = `${productId}-${typeField}`
    if (savingFields[fieldKey]) {
      return
    }

    setSavingFields(prev => ({ ...prev, [fieldKey]: true }))

    try {
      const product = products.find(p => p._id === productId)
      if (!product) {
        return
      }

      const updateData = { [typeField]: newType }

      // Recalculate prices if this is a pricing-related type field
      const pricingTypeFields = ['dis1Type', 'dis2Type', 'dis3Type', 'dis4Type', 'dis5Type', 'profitType', 'opC1Type', 'opSi1Type', 'opSi2Type', 'opT1Type', 'opT2Type']
      if (pricingTypeFields.includes(typeField)) {
        // Get current product values with the new type
        const updatedProduct = { ...product, [typeField]: newType }
        const gstRate = parseFloat(updatedProduct.gstRate) || 0

        // Calculate base price without GST
        let basePriceWithoutGst = 0
        if (updatedProduct.basePriceType === 'mop') {
          basePriceWithoutGst = parseFloat(updatedProduct.mop) || 0
        } else if (updatedProduct.basePriceType === 'purchase') {
          basePriceWithoutGst = parseFloat(updatedProduct.purchasePrice) || 0
        } else if (updatedProduct.basePriceType === 'market') {
          basePriceWithoutGst = parseFloat(updatedProduct.marketPrice) || 0
        }

        // Add GST to get base price with GST
        let nlc = basePriceWithoutGst * (1 + gstRate / 100)

        // Apply discounts
        for (let i = 1; i <= 5; i++) {
          const discountVal = parseFloat(updatedProduct[`dis${i}`]) || 0
          const discountType = updatedProduct[`dis${i}Type`]
          if (discountType === 'percent') {
            nlc = nlc - (nlc * discountVal / 100)
          } else {
            nlc = nlc - discountVal
          }
        }
        // Clamp NLC to minimum 0 (discounts can't exceed base price)
        nlc = Math.max(0, Math.round(nlc * 100) / 100)

        // Calculate price with profit
        let priceWithProfit = nlc
        const profitVal = parseFloat(updatedProduct.profit) || 0
        if (updatedProduct.profitType === 'percent') {
          priceWithProfit = nlc + (nlc * profitVal / 100)
        } else {
          priceWithProfit = nlc + profitVal
        }
        // Clamp to minimum 0
        priceWithProfit = Math.max(0, priceWithProfit)

        // Calculate OP prices (clamped to minimum 0)
        const calculateOpPrice = (opField, opTypeField, basePrice = priceWithProfit) => {
          const inputValue = parseFloat(updatedProduct[opField]) || 0
          let result
          if (updatedProduct[opTypeField] === 'flat') {
            result = Math.round((basePrice + inputValue) * 100) / 100
          } else {
            result = Math.round((basePrice * (1 + inputValue / 100)) * 100) / 100
          }
          return Math.max(0, result)
        }

        // Determine base for SI prices: use marketPriceSI if set, otherwise priceWithProfit
        const siBase = (parseFloat(updatedProduct.marketPriceSI) > 0) ? parseFloat(updatedProduct.marketPriceSI) : priceWithProfit
        // Determine base for T prices: use marketPriceReseller if set, otherwise priceWithProfit
        const tBase = (parseFloat(updatedProduct.marketPriceReseller) > 0) ? parseFloat(updatedProduct.marketPriceReseller) : priceWithProfit

        // Calculate SI prices from SI base
        const si1Price = calculateOpPrice('opSi1', 'opSi1Type', siBase)
        const si2Price = Math.round(si1Price * 1.01 * 100) / 100
        const c1Price = Math.round(si1Price * 1.20 * 100) / 100

        // Calculate T prices from T base
        const t1Price = calculateOpPrice('opT1', 'opT1Type', tBase)
        const t2Price = Math.round(t1Price * 1.005 * 100) / 100

        updateData.nlc = nlc
        updateData.c1 = c1Price
        updateData.si1 = si1Price
        updateData.si2 = si2Price
        updateData.t1 = t1Price
        updateData.t2 = t2Price
        updateData.opPrice = c1Price
        // Legacy tier prices (kept for backward compatibility)
        updateData.t3 = calculateOpPrice('op3', 'op3Type')
        updateData.t4 = calculateOpPrice('op4', 'op4Type')
      }

      const response = await updateAdminProduct(productId, updateData)
      if (response.success !== false) {
        setProducts(prev => prev.map(p => p._id === productId ? { ...p, ...updateData } : p))
      } else {
        alert(response.message || 'Failed to update')
      }
    } catch (err) {
      console.error('Failed to save type:', err)
      alert('Failed to save changes')
    } finally {
      setSavingFields(prev => {
        const newState = { ...prev }
        delete newState[fieldKey]
        return newState
      })
    }
  }

  // Auto-save field on blur
  const saveFieldOnBlur = async (product) => {
    if (!editingField || savingField) return

    const { productId, field } = editingField
    if (productId !== product._id) return

    setSavingField(true)

    try {
      // Build update data based on field type
      let updateData = {}

      if (field === 'stock') {
        updateData[field] = parseInt(editingValue) || 0
      } else if (field === 'basePriceType') {
        updateData[field] = editingValue
      } else if (field.startsWith('dis') && field.endsWith('Type')) {
        updateData[field] = editingValue
        
      } else if (field.startsWith('op') && field.endsWith('Type')) {
        updateData[field] = editingValue
      } else if (field === 'profitType') {
        updateData[field] = editingValue
      } else if (['mrp', 'mop', 'purchasePrice', 'marketPrice', 'marketPriceSI', 'marketPriceReseller', 'dis1', 'dis2', 'dis3', 'dis4', 'dis5', 'profit', 'op1', 'op2', 'op3', 'op4'].includes(field)) {
        updateData[field] = parseFloat(editingValue) || 0
      }

      // Recalculate NLC and tier prices if pricing fields changed
      const pricingFields = ['mrp', 'mop', 'purchasePrice', 'marketPrice', 'marketPriceSI', 'marketPriceReseller', 'basePriceType', 'dis1', 'dis1Type', 'dis2', 'dis2Type', 'dis3', 'dis3Type', 'dis4', 'dis4Type', 'dis5', 'dis5Type', 'profit', 'profitType', 'opC1', 'opC1Type', 'opSi1', 'opSi1Type', 'opSi2', 'opSi2Type', 'opT1', 'opT1Type', 'opT2', 'opT2Type']
      if (pricingFields.includes(field)) {
        // Get current product values with the new value
        const updatedProduct = { ...product, ...updateData }
        const gstRate = parseFloat(updatedProduct.gstRate) || 0

        // Calculate base price without GST
        let basePriceWithoutGst = 0
        if (updatedProduct.basePriceType === 'mop') {
          basePriceWithoutGst = parseFloat(updatedProduct.mop) || 0
        } else if (updatedProduct.basePriceType === 'purchase') {
          basePriceWithoutGst = parseFloat(updatedProduct.purchasePrice) || 0
        } else if (updatedProduct.basePriceType === 'market') {
          basePriceWithoutGst = parseFloat(updatedProduct.marketPrice) || 0
        }

        // Add GST to get base price
        let nlc = basePriceWithoutGst * (1 + gstRate / 100)

        // Apply discounts
        for (let i = 1; i <= 5; i++) {
          const discountVal = parseFloat(updatedProduct[`dis${i}`]) || 0
          const discountType = updatedProduct[`dis${i}Type`]
          if (discountType === 'percent') {
            nlc = nlc - (nlc * discountVal / 100)
          } else {
            nlc = nlc - discountVal
          }
        }
        nlc = Math.round(nlc * 100) / 100

        // Calculate price with profit
        let priceWithProfit = nlc
        const profitVal = parseFloat(updatedProduct.profit) || 0
        if (updatedProduct.profitType === 'percent') {
          priceWithProfit = nlc + (nlc * profitVal / 100)
        } else {
          priceWithProfit = nlc + profitVal
        }

        // Calculate OP prices
        const calculateOpPrice = (opField, opTypeField, basePrice = priceWithProfit) => {
          const inputValue = parseFloat(updatedProduct[opField]) || 0
          if (updatedProduct[opTypeField] === 'flat') {
            // For flat margin: final price = basePrice + flatAmount
            return Math.round((basePrice + inputValue) * 100) / 100
          } else {
            // For percent margin: final price = basePrice * (1 + percentage/100)
            return Math.round((basePrice * (1 + inputValue / 100)) * 100) / 100
          }
        }

        // Determine base for SI prices: use marketPriceSI if set, otherwise priceWithProfit
        const siBase = (parseFloat(updatedProduct.marketPriceSI) > 0) ? parseFloat(updatedProduct.marketPriceSI) : priceWithProfit
        // Determine base for T prices: use marketPriceReseller if set, otherwise priceWithProfit
        const tBase = (parseFloat(updatedProduct.marketPriceReseller) > 0) ? parseFloat(updatedProduct.marketPriceReseller) : priceWithProfit

        // Calculate SI prices from SI base
        const si1Price = calculateOpPrice('opSi1', 'opSi1Type', siBase)
        const si2Price = Math.round(si1Price * 1.01 * 100) / 100
        const c1Price = Math.round(si1Price * 1.20 * 100) / 100

        // Calculate T prices from T base
        const t1Price = calculateOpPrice('opT1', 'opT1Type', tBase)
        const t2Price = Math.round(t1Price * 1.005 * 100) / 100

        updateData.nlc = nlc
        // New Price List prices
        updateData.c1 = c1Price
        updateData.si1 = si1Price
        updateData.si2 = si2Price
        updateData.t1 = t1Price
        updateData.t2 = t2Price
        updateData.opPrice = c1Price
        // Legacy tier prices (kept for backward compatibility)
        updateData.t3 = calculateOpPrice('op3', 'op3Type')
        updateData.t4 = calculateOpPrice('op4', 'op4Type')
        // Note: op fields store the user's input (percentage or flat amount), NOT the calculated price
        // c1, si1, si2, t1, t2 store the calculated final prices
      }

      const response = await updateAdminProduct(productId, updateData)
      if (response.success !== false) {
        setProducts(prev => prev.map(p => p._id === productId ? { ...p, ...updateData } : p))
      } else {
        alert(response.message || 'Failed to update')
      }

    } catch (err) {
      console.error('Failed to save:', err)
      alert('Failed to save changes')
    } finally {
      setSavingField(false)
      setEditingField(null)
      setEditingValue('')
    }
  }

  // Define the order of editable fields for Tab navigation
  const EDITABLE_FIELDS_ORDER = [
    'stock',
    'mrp',
    'mop',
    'purchasePrice',
    'marketPrice',
    'marketPriceSI',
    'opSi1', 'opSi2', 'opC1',
    'marketPriceReseller',
    'opT1', 'opT2',
    'basePriceType',
    'dis1', 'dis2', 'dis3', 'dis4', 'dis5',
    'profit',
  ]

  const handleKeyDown = (e, product) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveFieldOnBlur(product)
    } else if (e.key === 'Escape') {
      cancelEditingField()
    } else if (e.key === 'Tab') {
      e.preventDefault()
      // Save current field first
      saveFieldOnBlur(product)

      // Find current field index
      const currentField = editingField?.field
      const currentIndex = EDITABLE_FIELDS_ORDER.indexOf(currentField)

      if (currentIndex !== -1) {
        // Determine next field index
        let nextIndex
        if (e.shiftKey) {
          // Shift+Tab: go to previous field
          nextIndex = currentIndex > 0 ? currentIndex - 1 : EDITABLE_FIELDS_ORDER.length - 1
        } else {
          // Tab: go to next field
          nextIndex = currentIndex < EDITABLE_FIELDS_ORDER.length - 1 ? currentIndex + 1 : 0
        }

        const nextField = EDITABLE_FIELDS_ORDER[nextIndex]

        // Get the value for the next field
        const nextValue = product[nextField] ?? (nextField.startsWith('dis') || nextField.startsWith('op') || nextField === 'profit' ? 0 : '')

        // Start editing the next field
        startEditingField(product._id, nextField, nextValue)
      }
    }
  }

  const formatPrice = (price) => price ? `₹${Number(price).toLocaleString('en-IN')}` : '-'

  // Only show full error state if we have no products at all
  if (error && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-gray-600 mb-4">{error}</p>
        <button onClick={() => fetchProducts(1)} className="btn-primary">Retry</button>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn p-2 sm:p-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">Manage your product catalog</p>
        </div>
        <div className="flex gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="btn-secondary flex items-center gap-1 sm:gap-2 whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4 py-2"
          >
            {syncing ? (
              <>
                <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                <span className="hidden sm:inline">Syncing...</span>
                <span className="sm:hidden">Sync...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Sync from AccountGST</span>
                <span className="sm:hidden">Sync</span>
              </>
            )}
          </button>
          <button onClick={() => { setSelectedProduct(null); setShowModal(true) }} className="btn-primary flex items-center gap-1 sm:gap-2 whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4 py-2">
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Add Product</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-4">
        <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-4">
          <div className="relative col-span-2 sm:flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <select
            value={brandFilter}
            onChange={(e) => { setBrandFilter(e.target.value); setCurrentPage(1) }}
            className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="">All Brands</option>
            {brands.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
          </select>
          <select
            value={categoryFilterId}
            onChange={(e) => {
              const selectedCategory = categories.find(c => c._id === e.target.value)
              setCategoryFilterId(e.target.value)
              setCategoryFilter(selectedCategory?.name || '')
              setCurrentPage(1)
            }}
            disabled={loadingCategories}
            className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50"
          >
            <option value="">{loadingCategories ? 'Loading...' : brandFilter ? `(${brandFilter})` : 'Category'}</option>
            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select
            value={subcategoryFilterId}
            onChange={(e) => {
              const selectedSubcategory = filterSubcategories.find(s => s._id === e.target.value)
              setSubcategoryFilterId(e.target.value)
              setSubcategoryFilter(selectedSubcategory?.name || '')
              setCurrentPage(1)
            }}
            disabled={!categoryFilterId}
            className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50"
          >
            <option value="">Subcategory</option>
            {filterSubcategories.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
          <select
            value={seriesFilterId}
            onChange={(e) => {
              const selectedSeries = filterSeries.find(s => s._id === e.target.value)
              setSeriesFilterId(e.target.value)
              setSeriesFilter(selectedSeries?.name || '')
              setCurrentPage(1)
            }}
            disabled={!categoryFilterId}
            className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50"
          >
            <option value="">Series</option>
            {filterSeries.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
          {(brandFilter || categoryFilter || subcategoryFilter || seriesFilter || searchQuery) && (
            <button
              onClick={() => {
                setBrandFilter('')
                setCategoryFilter('')
                setCategoryFilterId('')
                setSubcategoryFilter('')
                setSubcategoryFilterId('')
                setSeriesFilter('')
                setSeriesFilterId('')
                setSearchQuery('')
                setCategories(allCategories)
                setCurrentPage(1)
              }}
              className="px-3 sm:px-4 py-2 sm:py-2.5 text-red-600 hover:bg-red-50 border border-red-200 rounded-xl text-xs sm:text-sm font-medium transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Table Header with Actions */}
        <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-xs sm:text-sm font-medium text-gray-700">Pricing Table</span>
            <span className="hidden sm:inline text-xs text-gray-500">(Edit values directly - auto-saves)</span>
          </div>
          <div className="relative" ref={columnPopupRef}>
            <button
              onClick={() => setShowColumnPopup(!showColumnPopup)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
            >
              <Columns className="w-4 h-4" />
              <span className="hidden sm:inline">Columns</span>
            </button>
            {showColumnPopup && (
              <ColumnVisibilityPopup
                visibleColumns={visibleColumns}
                onToggle={toggleColumnVisibility}
                onClose={() => setShowColumnPopup(false)}
              />
            )}
          </div>
        </div>

        <div className="overflow-x-auto overflow-y-visible -webkit-overflow-scrolling-touch" style={{ touchAction: 'pan-x' }}>
          <table className="w-full border-collapse" style={{ minWidth: '1800px' }}>
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-3 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap" style={{ minWidth: '150px' }}>Product</th>
                {/* {visibleColumns.includes('status') && <th className="text-center px-2 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap" style={{ minWidth: '70px' }}>Status</th>} */}
                {visibleColumns.includes('stock') && <th className="text-center px-2 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap" style={{ minWidth: '50px' }}>Stock</th>}
                {visibleColumns.includes('mrp') && <th className="text-center px-2 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap" style={{ minWidth: '85px' }}>MRP</th>}
                {visibleColumns.includes('mop') && <th className="text-center px-2 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap" style={{ minWidth: '85px' }}>MOP</th>}
                {visibleColumns.includes('base') && <th className="text-center px-2 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap" style={{ minWidth: '50px' }}>Base</th>}
                {visibleColumns.includes('d1') && <th className="text-center px-1 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap bg-blue-50" style={{ minWidth: '75px' }}>D1</th>}
                {visibleColumns.includes('d2') && <th className="text-center px-1 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap bg-blue-50" style={{ minWidth: '75px' }}>D2</th>}
                {visibleColumns.includes('d3') && <th className="text-center px-1 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap bg-blue-50" style={{ minWidth: '75px' }}>D3</th>}
                {visibleColumns.includes('d4') && <th className="text-center px-1 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap bg-blue-50" style={{ minWidth: '75px' }}>D4</th>}
                {visibleColumns.includes('d5') && <th className="text-center px-1 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap bg-blue-50" style={{ minWidth: '75px' }}>D5</th>}
                {visibleColumns.includes('nlc') && <th className="text-center px-2 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap bg-blue-100" style={{ minWidth: '85px' }}>NLC</th>}
                {/* {visibleColumns.includes('profit') && <th className="text-center px-1 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap" style={{ minWidth: '75px' }}>Profit</th>} */}
                {visibleColumns.includes('purchase') && <th className="text-center px-2 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap" style={{ minWidth: '85px' }}>Purchase</th>}
                {visibleColumns.includes('marketSI') && <th className="text-center px-2 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap bg-green-50" style={{ minWidth: '85px' }}>Mkt(SI)</th>}
                {visibleColumns.includes('si1') && <th className="text-center px-2 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap bg-green-50" style={{ minWidth: '85px' }}>SI1</th>}
                {visibleColumns.includes('si2') && <th className="text-center px-2 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap bg-green-50" style={{ minWidth: '85px' }}>SI2</th>}
                {visibleColumns.includes('c1') && <th className="text-center px-2 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap bg-green-50" style={{ minWidth: '85px' }}>C1</th>}
                {visibleColumns.includes('marketReseller') && <th className="text-center px-2 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap bg-green-50" style={{ minWidth: '85px' }}>Mkt(Reseller)</th>}
                {visibleColumns.includes('t1') && <th className="text-center px-2 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap bg-green-50" style={{ minWidth: '85px' }}>T1</th>}
                {visibleColumns.includes('t2') && <th className="text-center px-2 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap bg-green-50" style={{ minWidth: '85px' }}>T2</th>}
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap" style={{ minWidth: '70px' }}>Actions</th>
              </tr>
              {/* Bulk Update Row */}
              <tr className="bg-yellow-50 border-b border-yellow-100">
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-600 whitespace-nowrap">
                  <span className="text-yellow-700">Bulk ({pagination.total})</span>
                 
                </th>
                {visibleColumns.includes('stock') && <th></th>}
                {visibleColumns.includes('mrp') && <th></th>}
                {visibleColumns.includes('mop') && <th></th>}
                {visibleColumns.includes('base') && <th></th>}
                {visibleColumns.includes('d1') && (
                  <th className="px-1 py-1 bg-blue-50">
                    <div className="flex items-center gap-1 justify-center">
                      <input
                        type="number"
                        placeholder="0"
                        value={bulkValues.dis1.value}
                        onChange={(e) => setBulkValues(prev => ({ ...prev, dis1: { ...prev.dis1, value: e.target.value } }))}
                        onKeyDown={(e) => handleBulkKeyDown(e, 'dis1')}
                        disabled={bulkUpdating}
                        className="w-10 px-1 py-0.5 text-xs text-center border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                      />
                      <select
                        value={bulkValues.dis1.type}
                        onChange={(e) => setBulkValues(prev => ({ ...prev, dis1: { ...prev.dis1, type: e.target.value } }))}
                        className="w-10 h-5 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                      >
                        <option value="percent">%</option>
                        <option value="flat">Rs</option>
                      </select>
                    </div>
                  </th>
                )}
                {visibleColumns.includes('d2') && (
                  <th className="px-1 py-1 bg-blue-50">
                    <div className="flex items-center gap-1 justify-center">
                      <input
                        type="number"
                        placeholder="0"
                        value={bulkValues.dis2.value}
                        onChange={(e) => setBulkValues(prev => ({ ...prev, dis2: { ...prev.dis2, value: e.target.value } }))}
                        onKeyDown={(e) => handleBulkKeyDown(e, 'dis2')}
                        disabled={bulkUpdating}
                        className="w-10 px-1 py-0.5 text-xs text-center border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                      />
                      <select
                        value={bulkValues.dis2.type}
                        onChange={(e) => setBulkValues(prev => ({ ...prev, dis2: { ...prev.dis2, type: e.target.value } }))}
                        className="w-10 h-5 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                      >
                        <option value="percent">%</option>
                        <option value="flat">Rs</option>
                      </select>
                    </div>
                  </th>
                )}
                {visibleColumns.includes('d3') && (
                  <th className="px-1 py-1 bg-blue-50">
                    <div className="flex items-center gap-1 justify-center">
                      <input
                        type="number"
                        placeholder="0"
                        value={bulkValues.dis3.value}
                        onChange={(e) => setBulkValues(prev => ({ ...prev, dis3: { ...prev.dis3, value: e.target.value } }))}
                        onKeyDown={(e) => handleBulkKeyDown(e, 'dis3')}
                        disabled={bulkUpdating}
                        className="w-10 px-1 py-0.5 text-xs text-center border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                      />
                      <select
                        value={bulkValues.dis3.type}
                        onChange={(e) => setBulkValues(prev => ({ ...prev, dis3: { ...prev.dis3, type: e.target.value } }))}
                        className="w-10 h-5 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                      >
                        <option value="percent">%</option>
                        <option value="flat">Rs</option>
                      </select>
                    </div>
                  </th>
                )}
                {visibleColumns.includes('d4') && (
                  <th className="px-1 py-1 bg-blue-50">
                    <div className="flex items-center gap-1 justify-center">
                      <input
                        type="number"
                        placeholder="0"
                        value={bulkValues.dis4.value}
                        onChange={(e) => setBulkValues(prev => ({ ...prev, dis4: { ...prev.dis4, value: e.target.value } }))}
                        onKeyDown={(e) => handleBulkKeyDown(e, 'dis4')}
                        disabled={bulkUpdating}
                        className="w-10 px-1 py-0.5 text-xs text-center border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                      />
                      <select
                        value={bulkValues.dis4.type}
                        onChange={(e) => setBulkValues(prev => ({ ...prev, dis4: { ...prev.dis4, type: e.target.value } }))}
                        className="w-10 h-5 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                      >
                        <option value="percent">%</option>
                        <option value="flat">Rs</option>
                      </select>
                    </div>
                  </th>
                )}
                {visibleColumns.includes('d5') && (
                  <th className="px-1 py-1 bg-blue-50">
                    <div className="flex items-center gap-1 justify-center">
                      <input
                        type="number"
                        placeholder="0"
                        value={bulkValues.dis5.value}
                        onChange={(e) => setBulkValues(prev => ({ ...prev, dis5: { ...prev.dis5, value: e.target.value } }))}
                        onKeyDown={(e) => handleBulkKeyDown(e, 'dis5')}
                        disabled={bulkUpdating}
                        className="w-10 px-1 py-0.5 text-xs text-center border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                      />
                      <select
                        value={bulkValues.dis5.type}
                        onChange={(e) => setBulkValues(prev => ({ ...prev, dis5: { ...prev.dis5, type: e.target.value } }))}
                        className="w-10 h-5 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                      >
                        <option value="percent">%</option>
                        <option value="flat">Rs</option>
                      </select>
                    </div>
                  </th>
                )}
                {visibleColumns.includes('nlc') && <th></th>}
                {visibleColumns.includes('purchase') && <th></th>}
                {visibleColumns.includes('marketSI') && <th></th>}
                {visibleColumns.includes('si1') && (
                  <th className="px-2 py-1 bg-green-50">
                    <input
                      type="number"
                      placeholder="0"
                      value={bulkValues.opSi1?.value || ''}
                      onChange={(e) => setBulkValues(prev => ({ ...prev, opSi1: { ...prev.opSi1, value: e.target.value } }))}
                      onKeyDown={(e) => handleBulkKeyDown(e, 'opSi1')}
                      disabled={bulkUpdating}
                      className="w-14 px-1 py-0.5 text-xs text-center border border-green-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-50"
                    />
                    <span className="text-[10px] text-gray-400 ml-0.5">%</span>
                  </th>
                )}
                {visibleColumns.includes('si2') && (
                  <th className="px-2 py-1 bg-green-50"></th>
                )}
                {visibleColumns.includes('c1') && (
                  <th className="px-2 py-1 bg-green-50"></th>
                )}
                {visibleColumns.includes('marketReseller') && <th></th>}
                {visibleColumns.includes('t1') && (
                  <th className="px-2 py-1 bg-green-50">
                    <input
                      type="number"
                      placeholder="0"
                      value={bulkValues.opT1?.value || ''}
                      onChange={(e) => setBulkValues(prev => ({ ...prev, opT1: { ...prev.opT1, value: e.target.value } }))}
                      onKeyDown={(e) => handleBulkKeyDown(e, 'opT1')}
                      disabled={bulkUpdating}
                      className="w-14 px-1 py-0.5 text-xs text-center border border-green-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-50"
                    />
                    <span className="text-[10px] text-gray-400 ml-0.5">%</span>
                  </th>
                )}
                {visibleColumns.includes('t2') && (
                  <th className="px-2 py-1 bg-green-50"></th>
                )}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={visibleColumns.length + 2} className="text-center py-12">
                    <Loader className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
                    <p className="text-gray-500">Loading products...</p>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length + 2} className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No products found</p>
                  </td>
                </tr>
              ) : (
                products.map(product => {
                  const isEditingThis = editingField?.productId === product._id

                  return (
                    <tr key={product._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      {/* Product Name */}
                      <td
                        className="px-3 py-2 bg-white cursor-pointer hover:bg-blue-50 transition-colors"
                        style={{ minWidth: '150px' }}
                        onClick={() => { setSelectedProduct(product); setShowModal(true); }}
                        title="Click to edit product"
                      >
                        <p className="font-medium text-gray-900 text-s truncate max-w-[130px]">{product.brand}</p>
                        {product.partNumber && <p className="text-[15px] text-gray-500 truncate">{product.partNumber}</p>}
                        <p className="text-[13px] text-gray-400" title={product.name}>{product.name}</p>
                      </td>

                      {/* Status - Continue/Discontinue toggle (commented out)
                      {visibleColumns.includes('status') && (
                        <td className="px-2 py-2 text-center">
                          <button
                            onClick={() => toggleProductStatus(product._id, product.active)}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-colors ${
                              product.active !== false
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                            title={product.active !== false ? 'Click to discontinue' : 'Click to continue'}
                          >
                            {product.active !== false ? (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                Active
                              </>
                            ) : (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                Inactive
                              </>
                            )}
                          </button>
                        </td>
                      )} */}

                      {/* Stock - Always visible input */}
                      {visibleColumns.includes('stock') && (
                        <td className="px-2 py-2 text-center">
                          <InlineInput
                            product={product}
                            field="stock"
                            value={product.stock || 0}
                            onSave={saveFieldDirectly}
                            type="number"
                            width="w-14"
                            savingFields={savingFields}
                          />
                        </td>
                      )}

                      {/* MRP */}
                      {visibleColumns.includes('mrp') && (
                        <td className="px-2 py-2 text-right">
                          <InlineInput
                            product={product}
                            field="mrp"
                            value={product.mrp}
                            onSave={saveFieldDirectly}
                            type="number"
                            width="w-20"
                            savingFields={savingFields}
                          />
                          {product.gstRate > 0 && (
                            <InlineGstPrice
                              product={product}
                              baseField="mrp"
                              gstRate={product.gstRate}
                              onSave={saveFieldDirectly}
                              savingFields={savingFields}
                            />
                          )}
                        </td>
                      )}

                      {/* MOP */}
                      {visibleColumns.includes('mop') && (
                        <td className="px-2 py-2 text-right">
                          <InlineInput
                            product={product}
                            field="mop"
                            value={product.mop}
                            onSave={saveFieldDirectly}
                            type="number"
                            width="w-20"
                            savingFields={savingFields}
                          />
                          {product.gstRate > 0 && (
                            <InlineGstPrice
                              product={product}
                              baseField="mop"
                              gstRate={product.gstRate}
                              onSave={saveFieldDirectly}
                              savingFields={savingFields}
                              isBase={product.basePriceType === 'mop'}
                            />
                          )}
                        </td>
                      )}

                      {/* Base Type */}
                      {visibleColumns.includes('base') && (
                        <td className="px-2 py-2 text-center">
                          <InlineSelect
                            product={product}
                            field="basePriceType"
                            value={product.basePriceType || 'mop'}
                            options={[
                              { value: 'mop', label: 'MOP' },
                              { value: 'purchase', label: 'Purch' },
                              { value: 'market', label: 'Mkt' }
                            ]}
                            onSave={saveFieldDirectly}
                            savingFields={savingFields}
                          />
                        </td>
                      )}

                      {/* Discounts D1-D5 */}
                      {[1, 2, 3, 4, 5].map(i => (
                        visibleColumns.includes(`d${i}`) && (
                          <td key={`dis${i}`} className="px-1 py-2 text-center bg-blue-50">
                            <InlineDiscount
                              product={product}
                              disIndex={i}
                              value={product[`dis${i}`] || 0}
                              type={product[`dis${i}Type`] || 'percent'}
                              onSave={saveFieldDirectly}
                              onSaveType={saveTypeDirectly}
                              savingFields={savingFields}
                            />
                          </td>
                        )
                      ))}

                      {/* NLC - Display Only */}
                      {visibleColumns.includes('nlc') && (
                        <td className="px-2 py-2 text-right bg-blue-100">
                          <div className="text-xs font-semibold text-blue-700">{formatPrice(product.nlc)}</div>
                          {product.gstRate > 0 && product.nlc > 0 && (
                            <div className="mt-0.5">
                              <input
                                type="text"
                                value={`₹${(product.nlc / (1 + product.gstRate / 100)).toFixed(2)}`}
                                readOnly
                                className="w-20 px-2 py-1 text-xs text-right border border-blue-200 rounded bg-blue-50 cursor-default focus:outline-none"
                              />
                              <div className="text-[9px] text-blue-500 whitespace-nowrap">excl. GST</div>
                            </div>
                          )}
                        </td>
                      )}

                      {/* Profit (commented out)
                      {visibleColumns.includes('profit') && (
                        <td className="px-1 py-2 text-center">
                          <InlineDiscount
                            product={product}
                            disIndex={null}
                            field="profit"
                            value={product.profit || 0}
                            type={product.profitType || 'percent'}
                            onSave={saveFieldDirectly}
                            onSaveType={saveTypeDirectly}
                            savingFields={savingFields}
                          />
                        </td>
                      )} */}

                      {/* Purchase */}
                      {visibleColumns.includes('purchase') && (
                        <td className="px-2 py-2 text-right">
                          <InlineInput
                            product={product}
                            field="purchasePrice"
                            value={product.purchasePrice}
                            onSave={saveFieldDirectly}
                            type="number"
                            width="w-20"
                            savingFields={savingFields}
                          />
                          {product.gstRate > 0 && (
                            <InlineGstPrice
                              product={product}
                              baseField="purchasePrice"
                              gstRate={product.gstRate}
                              onSave={saveFieldDirectly}
                              savingFields={savingFields}
                              isBase={product.basePriceType === 'purchase'}
                            />
                          )}
                        </td>
                      )}

                      {/* Market Price (SI) */}
                      {visibleColumns.includes('marketSI') && (
                        <td className="px-2 py-2 text-right bg-green-50">
                          <InlineInput
                            product={product}
                            field="marketPriceSI"
                            value={product.marketPriceSI || 0}
                            onSave={saveFieldDirectly}
                            type="number"
                            width="w-20"
                            savingFields={savingFields}
                          />
                          {product.gstRate > 0 && (
                            <InlineGstPrice
                              product={product}
                              baseField="marketPriceSI"
                              gstRate={product.gstRate}
                              onSave={saveFieldDirectly}
                              savingFields={savingFields}
                            />
                          )}
                        </td>
                      )}
                      {visibleColumns.includes('si1') && (
                        <td className="px-2 py-2 text-right bg-green-50">
                          <InlineInput
                            product={product}
                            field="opSi1"
                            value={product.opSi1 || product.si1 || 0}
                            onSave={saveFieldDirectly}
                            type="number"
                            width="w-14"
                            savingFields={savingFields}
                          />
                          {product.gstRate > 0 && (product.si1 || product.opSi1) > 0 && (
                            <div className="mt-0.5">
                              <input
                                type="text"
                                value={`₹${((product.si1 || product.opSi1) * (1 + product.gstRate / 100)).toFixed(2)}`}
                                readOnly
                                className="w-20 px-2 py-1 text-xs text-right border border-green-200 rounded bg-green-100 cursor-default focus:outline-none"
                              />
                              <div className="text-[9px] text-green-600 whitespace-nowrap">+ {product.gstRate}% GST</div>
                            </div>
                          )}
                        </td>
                      )}
                      {visibleColumns.includes('si2') && (
                        <td className="px-2 py-2 text-right bg-green-50">
                          <span className="text-xs font-medium text-blue-600">{formatPrice(product.si2 || product.opSi2)}</span>
                          {product.gstRate > 0 && (product.si2 || product.opSi2) > 0 && (
                            <div className="mt-0.5">
                              <input
                                type="text"
                                value={`₹${((product.si2 || product.opSi2) * (1 + product.gstRate / 100)).toFixed(2)}`}
                                readOnly
                                className="w-20 px-2 py-1 text-xs text-right border border-green-200 rounded bg-green-100 cursor-default focus:outline-none"
                              />
                              <div className="text-[9px] text-green-600 whitespace-nowrap">+ {product.gstRate}% GST</div>
                            </div>
                          )}
                        </td>
                      )}
                      {visibleColumns.includes('c1') && (
                        <td className="px-2 py-2 text-right bg-green-50">
                          <InlineInput
                            product={product}
                            field="opC1"
                            value={product.opC1 || product.c1 || 0}
                            onSave={saveFieldDirectly}
                            type="number"
                            width="w-14"
                            savingFields={savingFields}
                          />
                          {product.gstRate > 0 && (product.c1 || product.opC1) > 0 && (
                            <div className="mt-0.5">
                              <input
                                type="text"
                                value={`₹${((product.c1 || product.opC1) * (1 + product.gstRate / 100)).toFixed(2)}`}
                                readOnly
                                className="w-20 px-2 py-1 text-xs text-right border border-green-200 rounded bg-green-100 cursor-default focus:outline-none"
                              />
                              <div className="text-[9px] text-green-600 whitespace-nowrap">+ {product.gstRate}% GST</div>
                            </div>
                          )}
                        </td>
                      )}

                      {/* Market Price (Reseller) */}
                      {visibleColumns.includes('marketReseller') && (
                        <td className="px-2 py-2 text-right bg-green-50">
                          <InlineInput
                            product={product}
                            field="marketPriceReseller"
                            value={product.marketPriceReseller || 0}
                            onSave={saveFieldDirectly}
                            type="number"
                            width="w-20"
                            savingFields={savingFields}
                          />
                          {product.gstRate > 0 && (
                            <InlineGstPrice
                              product={product}
                              baseField="marketPriceReseller"
                              gstRate={product.gstRate}
                              onSave={saveFieldDirectly}
                              savingFields={savingFields}
                            />
                          )}
                        </td>
                      )}
                      {visibleColumns.includes('t1') && (
                        <td className="px-2 py-2 text-right bg-green-50">
                          <InlineInput
                            product={product}
                            field="opT1"
                            value={product.opT1 || product.t1 || 0}
                            onSave={saveFieldDirectly}
                            type="number"
                            width="w-14"
                            savingFields={savingFields}
                          />
                          {product.gstRate > 0 && (product.t1 || product.opT1) > 0 && (
                            <div className="mt-0.5">
                              <input
                                type="text"
                                value={`₹${((product.t1 || product.opT1) * (1 + product.gstRate / 100)).toFixed(2)}`}
                                readOnly
                                className="w-20 px-2 py-1 text-xs text-right border border-green-200 rounded bg-green-100 cursor-default focus:outline-none"
                              />
                              <div className="text-[9px] text-green-600 whitespace-nowrap">+ {product.gstRate}% GST</div>
                            </div>
                          )}
                        </td>
                      )}
                      {visibleColumns.includes('t2') && (
                        <td className="px-2 py-2 text-right bg-green-50">
                          <span className="text-xs font-medium text-blue-600">{formatPrice(product.t2 || product.opT2)}</span>
                          {product.gstRate > 0 && (product.t2 || product.opT2) > 0 && (
                            <div className="mt-0.5">
                              <input
                                type="text"
                                value={`₹${((product.t2 || product.opT2) * (1 + product.gstRate / 100)).toFixed(2)}`}
                                readOnly
                                className="w-20 px-2 py-1 text-xs text-right border border-green-200 rounded bg-green-100 cursor-default focus:outline-none"
                              />
                              <div className="text-[9px] text-green-600 whitespace-nowrap">+ {product.gstRate}% GST</div>
                            </div>
                          )}
                        </td>
                      )}

                      {/* Actions */}
                      <td className="px-2 py-2 bg-white">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => { setSelectedProduct(product); setShowModal(true) }}
                            className="p-1 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                          </button>
                          <button
                            onClick={() => { setSelectedProduct(product); setShowViewModal(true) }}
                            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye className="w-3.5 h-3.5 text-gray-500" />
                          </button>
                          <button
                            onClick={() => handleDelete(product._id)}
                            className="p-1 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
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
        onClose={() => { setShowModal(false); setSelectedProduct(null) }}
        title={selectedProduct ? 'Edit Product' : 'Add Product'}
        size="xl"
      >
        <ProductForm
          product={selectedProduct}
          onSubmit={selectedProduct ? handleUpdate : handleCreate}
          onCancel={() => { setShowModal(false); setSelectedProduct(null) }}
          loading={formLoading}
          brands={brands}
          categories={categories}
          onRefreshBrands={fetchBrands}
        />
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => { setShowViewModal(false); setSelectedProduct(null) }}
        title="Product Details"
        size="lg"
      >
        <ProductViewModal product={selectedProduct} onClose={() => { setShowViewModal(false); setSelectedProduct(null) }} />
      </Modal>
    </div>
  )
}