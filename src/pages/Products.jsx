import { useState, useEffect } from 'react'
import { Search, Plus, Edit2, Trash2, X, Loader, AlertCircle, Package, RefreshCw, Eye, Save, XCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  syncProducts,
  getBrands,
  uploadFile,
  getCategories,
  getSubcategories,
  getSeries
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
  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-2 sm:p-4 overflow-y-auto z-50" onClick={onClose}>
      <div className={`bg-white rounded-2xl w-full ${sizeClasses[size]} shadow-xl animate-fadeIn my-2 sm:my-4`}
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
            <div><span className="text-gray-500">GST Rate:</span><p className="font-medium">{product.gstRate || 0}%</p></div>
            <div><span className="text-gray-500">Density:</span><p className="font-medium">{product.density || 'Regular'}</p></div>
            <div><span className="text-gray-500">Stock:</span><p className="font-medium">{product.stock || 0}</p></div>
            <div><span className="text-gray-500">Box Size:</span><p className="font-medium">{product.boxSize || '-'}</p></div>
            <div><span className="text-gray-500">Procurement:</span><p className="font-medium">{product.procurement || '-'}</p></div>
          </div>
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
            <h5 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Base Price</h5>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm">
              <div><span className="text-gray-500">Type:</span><p className="font-medium">{product.basePriceType === 'mop' ? 'MOP' : product.basePriceType === 'purchase' ? 'Purchase' : 'Market'}</p></div>
              <div><span className="text-gray-500">MRP:</span><p className="font-medium">{formatPrice(product.mrp)}</p></div>
              <div><span className="text-gray-500">MOP:</span><p className="font-medium">{formatPrice(product.mop)}</p></div>
              <div><span className="text-gray-500">Purchase:</span><p className="font-medium">{formatPrice(product.purchasePrice)}</p></div>
              <div><span className="text-gray-500">Market:</span><p className="font-medium">{formatPrice(product.marketPrice)}</p></div>
            </div>
          </div>

          {/* Discounts */}
          <div className="bg-gray-50 p-2 sm:p-3 rounded-lg overflow-x-auto">
            <h5 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Discounts</h5>
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
                <span className="text-gray-500">NLC:</span>
                <p className="font-bold text-blue-700 text-sm sm:text-lg">{formatPrice(product.nlc)}</p>
              </div>
              <div>
                <span className="text-gray-500">Profit:</span>
                <p className="font-medium">{formatDiscount(product.profit, product.profitType)}</p>
              </div>
            </div>
          </div>

          {/* Tier Prices (T1-T4) */}
          <div className="bg-green-50 p-2 sm:p-3 rounded-lg overflow-x-auto">
            <h5 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Tier Prices</h5>
            <div className="flex gap-2 sm:gap-3 text-xs sm:text-sm min-w-max">
              <div className="min-w-[60px]">
                <span className="text-gray-500 text-[10px] sm:text-xs">T1:</span>
                <p className="font-medium text-green-700">{formatPrice(product.op1 || product.t1)}</p>
              </div>
              <div className="min-w-[60px]">
                <span className="text-gray-500 text-[10px] sm:text-xs">T2:</span>
                <p className="font-medium text-green-700">{formatPrice(product.op2 || product.t2)}</p>
              </div>
              <div className="min-w-[60px]">
                <span className="text-gray-500 text-[10px] sm:text-xs">T3:</span>
                <p className="font-medium text-green-700">{formatPrice(product.op3 || product.t3)}</p>
              </div>
              <div className="min-w-[60px]">
                <span className="text-gray-500 text-[10px] sm:text-xs">T4:</span>
                <p className="font-medium text-green-700">{formatPrice(product.op4 || product.t4)}</p>
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

// Product Form Component
function ProductForm({ product, onSubmit, onCancel, loading, brands, categories: propCategories, subcategories: propSubcategories, series: propSeries }) {
  const [categories, setCategories] = useState(propCategories || [])
  const [subcategories, setSubcategories] = useState(propSubcategories || [])
  const [series, setSeries] = useState(propSeries || [])
  const [initialized, setInitialized] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  const getInitialState = (productData = null) => {
    const p = productData || product
    const state = {
      name: p?.name || '',
      imageUrl: p?.imageUrl || '',
      partNumber: p?.partNumber || '',
      description: p?.description || '',
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

  // Initialize from product data
  useEffect(() => {
    if (product) {
      // Set initial form data from product
      setFormData(getInitialState(product))

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
    setFormData(prev => ({
      ...prev,
      brandId,
      brand: selectedBrand?.name || ''
    }))
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
    const numericFields = ['mrp', 'mop', 'purchasePrice', 'marketPrice', 'cnlc', 'mnlc', 'opPrice', 't1', 't2', 't3', 't4', 'bottomPrice', 'dis1', 'dis2', 'dis3', 'dis4', 'dis5', 'profit', 'op1', 'op2', 'op3', 'op4', 'nlc']
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

  // Calculate prices based on pricing calculator inputs
  const calculatePrices = () => {
    let basePrice = 0
    if (formData.basePriceType === 'mop') {
      basePrice = parseFloat(formData.mop) || 0
    } else if (formData.basePriceType === 'purchase') {
      basePrice = parseFloat(formData.purchasePrice) || 0
    } else if (formData.basePriceType === 'market') {
      basePrice = parseFloat(formData.marketPrice) || 0
    }

    let price = basePrice

    // Apply discounts 1-5
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

    // NLC (Net Landing Cost)
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
    const getOpPrice = (opField, opTypeField) => {
      const inputValue = parseFloat(formData[opField]) || 0
      const type = formData[opTypeField]

      if (type === 'flat') {
        // For flat type, the input IS the final price
        return inputValue
      } else {
        // For percent type, calculate from priceWithProfit
        return Math.round((priceWithProfit * (1 + inputValue / 100)) * 100) / 100
      }
    }

    return {
      nlc,
      op1: getOpPrice('op1', 'op1Type'),
      op2: getOpPrice('op2', 'op2Type'),
      op3: getOpPrice('op3', 'op3Type'),
      op4: getOpPrice('op4', 'op4Type'),
    }
  }

  // Update form data with calculated prices
  const updateCalculatedPrices = () => {
    const calculated = calculatePrices()
    setFormData(prev => ({
      ...prev,
      nlc: calculated.nlc,
      op1: calculated.op1,
      op2: calculated.op2,
      op3: calculated.op3,
      op4: calculated.op4,
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
      // OP Prices (T1-T4) - store actual tier prices
      op1: tier1,
      op1Type: formData.op1Type,
      op2: tier2,
      op2Type: formData.op2Type,
      op3: tier3,
      op3Type: formData.op3Type,
      op4: tier4,
      op4Type: formData.op4Type,
      // T1-T4 prices = OP prices for customer price lists
      t1: tier1,
      t2: tier2,
      t3: tier3,
      t4: tier4,
      opPrice: tier1, // Default OP Price is T1
      // Legacy fields for backward compatibility
      cnlc: calculated.nlc,
      mnlc: parseFloat(formData.mnlc) || 0,
      bottomPrice: parseFloat(formData.bottomPrice) || tier4,
      gstRate: parseFloat(formData.gstRate) || 0,
      stock: parseInt(formData.stock) || 0,
      // New fields
      boxSize: formData.boxSize || '',
      procurement: formData.procurement || '',
    }
    onSubmit(submitData)
  }

  return (
    <form onSubmit={handleSubmit} className="p-3 sm:p-4 space-y-4 sm:space-y-6">
      {/* Brand, Category, Subcategory, Series - All Independent */}
      <div className="border-b pb-3 sm:pb-4">
        <h4 className="font-medium text-gray-800 mb-2 sm:mb-3 text-sm sm:text-base">Classification</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Brand
            </label>
            <select
              name="brandId"
              value={formData.brandId}
              onChange={handleBrandChange}
              className="input-field text-sm"
            >
              <option value="">Select Brand</option>
              {brands.map(brand => (
                <option key={brand._id} value={brand._id}>{brand.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleCategoryChange}
              className="input-field text-sm"
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Subcategory</label>
            <select
              name="subcategoryId"
              value={formData.subcategoryId}
              onChange={handleSubcategoryChange}
              disabled={!formData.categoryId}
              className="input-field text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select Subcategory</option>
              {subcategories.map(sub => (
                <option key={sub._id} value={sub._id}>{sub.name}</option>
              ))}
            </select>
            {!formData.categoryId && <p className="text-xs text-gray-400 mt-1">Select a category first</p>}
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Series</label>
            <select
              name="seriesId"
              value={formData.seriesId}
              onChange={handleSeriesChange}
              disabled={!formData.categoryId}
              className="input-field text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select Series</option>
              {series.map(s => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
            {!formData.categoryId && <p className="text-xs text-gray-400 mt-1">Select a category first</p>}
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="border-b pb-3 sm:pb-4">
        <h4 className="font-medium text-gray-800 mb-2 sm:mb-3 text-sm sm:text-base">Basic Information</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Item Name <span className="text-red-500">*</span></label>
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
              <option value="Back to Back">Back to Back</option>
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
              placeholder="Stock quantity"
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
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea name="description" value={formData.description} onChange={handleChange} rows="2"
            className="input-field text-sm" placeholder="Enter product description" />
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
            Base Price
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
                  placeholder="₹0"
                  className="input-field text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">MOP</label>
                <input
                  type="number"
                  name="mop"
                  value={formData.mop}
                  onChange={handleChange}
                  placeholder="₹0"
                  className="input-field text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Purchase Price</label>
                <input
                  type="number"
                  name="purchasePrice"
                  value={formData.purchasePrice}
                  onChange={handleChange}
                  placeholder="₹0"
                  className="input-field text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Market Price</label>
                <input
                  type="number"
                  name="marketPrice"
                  value={formData.marketPrice}
                  onChange={handleChange}
                  placeholder="₹0"
                  className="input-field text-sm"
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
                      placeholder="0"
                      className="w-full px-1 sm:px-2 py-2 text-center text-sm focus:outline-none"
                    />
                    <select
                      name={`${discount.field}Type`}
                      value={formData[`${discount.field}Type`]}
                      onChange={handleChange}
                      className="w-8 sm:w-10 text-xs bg-gray-50 border-l focus:outline-none"
                    >
                      <option value="percent">%</option>
                      <option value="flat">₹</option>
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
              <label className="block text-xs text-gray-500 mb-1">NLC (After Discounts)</label>
              <div className="text-xl sm:text-2xl font-bold text-blue-700">
                ₹{calculatePrices().nlc.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
              </div>
            </div>
            <div>
              <label className="block text-xs sm:text-sm text-gray-600 mb-1">Add Profit</label>
              <div className="flex rounded-lg overflow-hidden border border-gray-200 bg-white">
                <input
                  type="number"
                  name="profit"
                  value={formData.profit}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full px-2 sm:px-3 py-2 text-sm focus:outline-none"
                />
                <select
                  name="profitType"
                  value={formData.profitType}
                  onChange={handleChange}
                  className="w-10 sm:w-12 text-xs bg-gray-50 border-l focus:outline-none"
                >
                  <option value="percent">%</option>
                  <option value="flat">₹</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4: T1-T4 Prices (OP Prices) */}
        <div className="bg-green-50 rounded-xl p-3 sm:p-4">
          <h5 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center gap-2">
            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center">4</span>
            Tier Prices (T1, T2, T3, T4) - For Customer Price Lists
          </h5>
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 min-w-[400px] px-3 sm:px-0">
              {[
                { field: 'op1', label: 'T1 Price', tier: 'Tier 1' },
                { field: 'op2', label: 'T2 Price', tier: 'Tier 2' },
                { field: 'op3', label: 'T3 Price', tier: 'Tier 3' },
                { field: 'op4', label: 'T4 Price', tier: 'Tier 4' },
              ].map((op, index) => (
                <div key={op.field} className="bg-white rounded-lg p-2 sm:p-3 text-center">
                  <label className="block text-xs text-gray-500 mb-1">{op.label}</label>
                  <div className="flex rounded-lg overflow-hidden border border-gray-200 bg-white mb-1">
                    <input
                      type="number"
                      name={op.field}
                      value={formData[op.field]}
                      onChange={handleChange}
                      placeholder="0"
                      className="w-full px-1 sm:px-2 py-1.5 sm:py-2 text-center text-sm font-medium focus:outline-none"
                    />
                    <select
                      name={`${op.field}Type`}
                      value={formData[`${op.field}Type`]}
                      onChange={handleChange}
                      className="w-8 sm:w-10 text-xs bg-gray-50 border-l focus:outline-none"
                    >
                      <option value="percent">%</option>
                      <option value="flat">₹</option>
                    </select>
                  </div>
                  <div className="text-xs text-green-600 font-medium">
                    ₹{calculatePrices()[op.field].toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            These T1-T4 prices are used for different customer price lists. Select markup % or flat ₹ to add on NLC+Profit.
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

// Editable Cell Component - for single values
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
          className="w-12 px-1 py-1 text-xs text-center border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
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
          className="w-10 px-1 py-1 text-xs border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white cursor-pointer"
          disabled={savingField}
        >
          <option value="percent">%</option>
          <option value="flat">₹</option>
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
        className="w-8 px-0 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white cursor-pointer"
        disabled={savingField}
      >
        <option value="percent">%</option>
        <option value="flat">₹</option>
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
  }, [brandFilter])

  const fetchProducts = async (page = currentPage, limit = pagination.limit) => {
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
        setError(response.message || 'Failed to fetch products')
      }
    } catch (err) {
      setError('Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBrands()
    fetchCategories()
    fetchProducts(1)
  }, [])

  // Fetch products when search or filters change
  useEffect(() => {
    setCurrentPage(1)
    fetchProducts(1)
  }, [debouncedSearch, brandFilter, categoryFilter, subcategoryFilter, seriesFilter])

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
    fetchProducts(page)
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

  // Inline editing functions - Auto-save on blur
  const startEditingField = (productId, field, currentValue) => {
    setEditingField({ productId, field })
    setEditingValue(currentValue?.toString() || '')
  }

  const cancelEditingField = () => {
    setEditingField(null)
    setEditingValue('')
  }

  // Direct save for type dropdowns (percent/flat)
  const saveTypeDirectly = async (productId, typeField, newType) => {
    if (savingField) return
    setSavingField(true)

    try {
      const product = products.find(p => p._id === productId)
      if (!product) return

      const updateData = { [typeField]: newType }

      // Recalculate prices if this is a pricing-related type field
      const pricingTypeFields = ['dis1Type', 'dis2Type', 'dis3Type', 'dis4Type', 'dis5Type', 'profitType', 'op1Type', 'op2Type', 'op3Type', 'op4Type']
      if (pricingTypeFields.includes(typeField)) {
        // Get current product values with the new type
        const updatedProduct = { ...product, [typeField]: newType }

        // Calculate NLC
        let basePrice = 0
        if (updatedProduct.basePriceType === 'mop') {
          basePrice = parseFloat(updatedProduct.mop) || 0
        } else if (updatedProduct.basePriceType === 'purchase') {
          basePrice = parseFloat(updatedProduct.purchasePrice) || 0
        } else if (updatedProduct.basePriceType === 'market') {
          basePrice = parseFloat(updatedProduct.marketPrice) || 0
        }

        let nlc = basePrice
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
        const calculateOpPrice = (opField, opTypeField) => {
          const inputValue = parseFloat(updatedProduct[opField]) || 0
          if (updatedProduct[opTypeField] === 'flat') {
            return inputValue
          } else {
            return Math.round((priceWithProfit * (1 + inputValue / 100)) * 100) / 100
          }
        }

        updateData.nlc = nlc
        updateData.t1 = calculateOpPrice('op1', 'op1Type')
        updateData.t2 = calculateOpPrice('op2', 'op2Type')
        updateData.t3 = calculateOpPrice('op3', 'op3Type')
        updateData.t4 = calculateOpPrice('op4', 'op4Type')
        updateData.opPrice = calculateOpPrice('op1', 'op1Type')
        updateData.op1 = calculateOpPrice('op1', 'op1Type')
        updateData.op2 = calculateOpPrice('op2', 'op2Type')
        updateData.op3 = calculateOpPrice('op3', 'op3Type')
        updateData.op4 = calculateOpPrice('op4', 'op4Type')
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
      setSavingField(false)
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
      } else if (['mrp', 'mop', 'purchasePrice', 'marketPrice', 'dis1', 'dis2', 'dis3', 'dis4', 'dis5', 'profit', 'op1', 'op2', 'op3', 'op4'].includes(field)) {
        updateData[field] = parseFloat(editingValue) || 0
      }

      // Recalculate NLC and tier prices if pricing fields changed
      const pricingFields = ['mrp', 'mop', 'purchasePrice', 'marketPrice', 'basePriceType', 'dis1', 'dis1Type', 'dis2', 'dis2Type', 'dis3', 'dis3Type', 'dis4', 'dis4Type', 'dis5', 'dis5Type', 'profit', 'profitType', 'op1', 'op1Type', 'op2', 'op2Type', 'op3', 'op3Type', 'op4', 'op4Type']
      if (pricingFields.includes(field)) {
        // Get current product values with the new value
        const updatedProduct = { ...product, ...updateData }

        // Calculate NLC
        let basePrice = 0
        if (updatedProduct.basePriceType === 'mop') {
          basePrice = parseFloat(updatedProduct.mop) || 0
        } else if (updatedProduct.basePriceType === 'purchase') {
          basePrice = parseFloat(updatedProduct.purchasePrice) || 0
        } else if (updatedProduct.basePriceType === 'market') {
          basePrice = parseFloat(updatedProduct.marketPrice) || 0
        }

        let nlc = basePrice
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
        const calculateOpPrice = (opField, opTypeField) => {
          const inputValue = parseFloat(updatedProduct[opField]) || 0
          if (updatedProduct[opTypeField] === 'flat') {
            return inputValue
          } else {
            return Math.round((priceWithProfit * (1 + inputValue / 100)) * 100) / 100
          }
        }

        updateData.nlc = nlc
        updateData.t1 = calculateOpPrice('op1', 'op1Type')
        updateData.t2 = calculateOpPrice('op2', 'op2Type')
        updateData.t3 = calculateOpPrice('op3', 'op3Type')
        updateData.t4 = calculateOpPrice('op4', 'op4Type')
        updateData.opPrice = calculateOpPrice('op1', 'op1Type')

        // Also save OP values
        if (!field.startsWith('op')) {
          updateData.op1 = calculateOpPrice('op1', 'op1Type')
          updateData.op2 = calculateOpPrice('op2', 'op2Type')
          updateData.op3 = calculateOpPrice('op3', 'op3Type')
          updateData.op4 = calculateOpPrice('op4', 'op4Type')
        }
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

  const handleKeyDown = (e, product) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveFieldOnBlur(product)
    } else if (e.key === 'Escape') {
      cancelEditingField()
    }
  }

  const formatPrice = (price) => price ? `₹${Number(price).toLocaleString('en-IN')}` : '-'

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
            <span className="hidden sm:inline text-xs text-gray-500">(Click on prices/discounts to edit - auto-saves on blur)</span>
            <span className="sm:hidden text-xs text-gray-500">(← Swipe to see all columns →)</span>
          </div>
        </div>

        <div className="overflow-x-auto overflow-y-visible -webkit-overflow-scrolling-touch" style={{ touchAction: 'pan-x' }}>
          <table className="w-full border-collapse" style={{ minWidth: '1800px' }}>
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-3 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap" style={{ minWidth: '150px' }}>Product</th>
                <th className="text-center px-2 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap" style={{ minWidth: '50px' }}>Stock</th>
                <th className="text-right px-2 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap" style={{ minWidth: '70px' }}>MRP</th>
                <th className="text-right px-2 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap" style={{ minWidth: '70px' }}>MOP</th>
                <th className="text-right px-2 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap" style={{ minWidth: '70px' }}>Purchase</th>
                <th className="text-right px-2 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap" style={{ minWidth: '70px' }}>Market</th>
                <th className="text-center px-2 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap" style={{ minWidth: '50px' }}>Base</th>
                <th className="text-center px-1 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap bg-blue-50" style={{ minWidth: '60px' }}>D1</th>
                <th className="text-center px-1 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap bg-blue-50" style={{ minWidth: '60px' }}>D2</th>
                <th className="text-center px-1 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap bg-blue-50" style={{ minWidth: '60px' }}>D3</th>
                <th className="text-center px-1 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap bg-blue-50" style={{ minWidth: '60px' }}>D4</th>
                <th className="text-center px-1 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap bg-blue-50" style={{ minWidth: '60px' }}>D5</th>
                <th className="text-right px-2 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap bg-blue-100" style={{ minWidth: '70px' }}>NLC</th>
                <th className="text-center px-1 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap" style={{ minWidth: '60px' }}>Profit</th>
                <th className="text-right px-2 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap bg-green-50" style={{ minWidth: '70px' }}>T1</th>
                <th className="text-right px-2 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap bg-green-50" style={{ minWidth: '70px' }}>T2</th>
                <th className="text-right px-2 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap bg-green-50" style={{ minWidth: '70px' }}>T3</th>
                <th className="text-right px-2 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap bg-green-50" style={{ minWidth: '70px' }}>T4</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-600 whitespace-nowrap" style={{ minWidth: '70px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={18} className="text-center py-12">
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
                      <td className="px-3 py-2 bg-white" style={{ minWidth: '150px' }}>
                        <p className="font-medium text-gray-900 text-xs truncate max-w-[130px]" title={product.name}>{product.name}</p>
                        {product.partNumber && <p className="text-[10px] text-gray-500 truncate">{product.partNumber}</p>}
                        <p className="text-[10px] text-gray-400">{product.brand || '-'}</p>
                      </td>

                      {/* Stock - Clickable */}
                      <td className="px-2 py-2 text-center">
                        <EditableCell
                          productId={product._id}
                          field="stock"
                          value={product.stock || 0}
                          displayValue={
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                              product.stock > 10 ? 'bg-green-100 text-green-700' :
                              product.stock > 0 ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {product.stock || 0}
                            </span>
                          }
                          editingField={editingField}
                          editingValue={editingValue}
                          savingField={savingField}
                          onStartEdit={startEditingField}
                          onChangeValue={setEditingValue}
                          onBlur={() => saveFieldOnBlur(product)}
                          onKeyDown={(e) => handleKeyDown(e, product)}
                          type="number"
                          width="w-12"
                        />
                      </td>

                      {/* MRP - Clickable */}
                      <td className="px-2 py-2 text-right">
                        <EditableCell
                          productId={product._id}
                          field="mrp"
                          value={product.mrp}
                          displayValue={<span className="text-xs text-gray-900 cursor-pointer hover:bg-yellow-50 px-1 rounded">{formatPrice(product.mrp)}</span>}
                          editingField={editingField}
                          editingValue={editingValue}
                          savingField={savingField}
                          onStartEdit={startEditingField}
                          onChangeValue={setEditingValue}
                          onBlur={() => saveFieldOnBlur(product)}
                          onKeyDown={(e) => handleKeyDown(e, product)}
                          type="number"
                          width="w-16"
                        />
                      </td>

                      {/* MOP - Clickable */}
                      <td className="px-2 py-2 text-right">
                        <EditableCell
                          productId={product._id}
                          field="mop"
                          value={product.mop}
                          displayValue={<span className="text-xs text-gray-900 cursor-pointer hover:bg-yellow-50 px-1 rounded">{formatPrice(product.mop)}</span>}
                          editingField={editingField}
                          editingValue={editingValue}
                          savingField={savingField}
                          onStartEdit={startEditingField}
                          onChangeValue={setEditingValue}
                          onBlur={() => saveFieldOnBlur(product)}
                          onKeyDown={(e) => handleKeyDown(e, product)}
                          type="number"
                          width="w-16"
                        />
                      </td>

                      {/* Purchase - Clickable */}
                      <td className="px-2 py-2 text-right">
                        <EditableCell
                          productId={product._id}
                          field="purchasePrice"
                          value={product.purchasePrice}
                          displayValue={<span className="text-xs text-gray-900 cursor-pointer hover:bg-yellow-50 px-1 rounded">{formatPrice(product.purchasePrice)}</span>}
                          editingField={editingField}
                          editingValue={editingValue}
                          savingField={savingField}
                          onStartEdit={startEditingField}
                          onChangeValue={setEditingValue}
                          onBlur={() => saveFieldOnBlur(product)}
                          onKeyDown={(e) => handleKeyDown(e, product)}
                          type="number"
                          width="w-16"
                        />
                      </td>

                      {/* Market - Clickable */}
                      <td className="px-2 py-2 text-right">
                        <EditableCell
                          productId={product._id}
                          field="marketPrice"
                          value={product.marketPrice}
                          displayValue={<span className="text-xs text-gray-900 cursor-pointer hover:bg-yellow-50 px-1 rounded">{formatPrice(product.marketPrice)}</span>}
                          editingField={editingField}
                          editingValue={editingValue}
                          savingField={savingField}
                          onStartEdit={startEditingField}
                          onChangeValue={setEditingValue}
                          onBlur={() => saveFieldOnBlur(product)}
                          onKeyDown={(e) => handleKeyDown(e, product)}
                          type="number"
                          width="w-16"
                        />
                      </td>

                      {/* Base Type - Clickable Dropdown */}
                      <td className="px-2 py-2 text-center">
                        <EditableSelect
                          productId={product._id}
                          field="basePriceType"
                          value={product.basePriceType || 'mop'}
                          options={[
                            { value: 'mop', label: 'MOP' },
                            { value: 'purchase', label: 'Purch' },
                            { value: 'market', label: 'Mkt' }
                          ]}
                          displayValue={<span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 cursor-pointer hover:bg-gray-200">{product.basePriceType === 'mop' ? 'MOP' : product.basePriceType === 'purchase' ? 'Purch' : 'Mkt'}</span>}
                          editingField={editingField}
                          editingValue={editingValue}
                          savingField={savingField}
                          onStartEdit={startEditingField}
                          onChangeValue={setEditingValue}
                          onBlur={() => saveFieldOnBlur(product)}
                        />
                      </td>

                      {/* Discounts D1-D5 */}
                      {[1, 2, 3, 4, 5].map(i => (
                        <td key={`dis${i}`} className="px-1 py-2 text-center bg-blue-50">
                          <EditableDiscount
                            productId={product._id}
                            disIndex={i}
                            value={product[`dis${i}`] || 0}
                            type={product[`dis${i}Type`] || 'percent'}
                            editingField={editingField}
                            editingValue={editingValue}
                            savingField={savingField}
                            onStartEdit={startEditingField}
                            onChangeValue={setEditingValue}
                            onBlur={() => saveFieldOnBlur(product)}
                            onKeyDown={(e) => handleKeyDown(e, product)}
                            onSaveType={saveTypeDirectly}
                          />
                        </td>
                      ))}

                      {/* NLC - Display Only */}
                      <td className="px-2 py-2 text-right bg-blue-100">
                        <span className="text-xs font-semibold text-blue-700">{formatPrice(product.nlc)}</span>
                      </td>

                      {/* Profit */}
                      <td className="px-1 py-2 text-center">
                        <EditableDiscount
                          productId={product._id}
                          field="profit"
                          value={product.profit || 0}
                          type={product.profitType || 'percent'}
                          editingField={editingField}
                          editingValue={editingValue}
                          savingField={savingField}
                          onStartEdit={startEditingField}
                          onChangeValue={setEditingValue}
                          onBlur={() => saveFieldOnBlur(product)}
                          onKeyDown={(e) => handleKeyDown(e, product)}
                          onSaveType={saveTypeDirectly}
                        />
                      </td>

                      {/* T1-T4 */}
                      {[1, 2, 3, 4].map(i => (
                        <td key={`op${i}`} className="px-2 py-2 text-right bg-green-50">
                          <EditableDiscount
                            productId={product._id}
                            field={`op${i}`}
                            value={product[`op${i}`] || product[`t${i}`] || 0}
                            type={product[`op${i}Type`] || 'percent'}
                            editingField={editingField}
                            editingValue={editingValue}
                            savingField={savingField}
                            onStartEdit={startEditingField}
                            onChangeValue={setEditingValue}
                            onBlur={() => saveFieldOnBlur(product)}
                            onKeyDown={(e) => handleKeyDown(e, product)}
                            isPrice
                            onSaveType={saveTypeDirectly}
                          />
                        </td>
                      ))}

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