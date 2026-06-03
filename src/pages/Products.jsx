import { useState, useEffect } from 'react'
import { Search, Plus, Edit2, Trash2, X, Loader, AlertCircle, Package, RefreshCw, Eye } from 'lucide-react'
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
  const sizeClasses = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-5xl' }
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

// Product View Modal
function ProductViewModal({ product, onClose }) {
  if (!product) return null

  const formatPrice = (price) => price ? `₹${Number(price).toLocaleString('en-IN')}` : '-'
  const formatDiscount = (value, type) => {
    if (!value) return '-'
    return type === 'percent' ? `${value}%` : `₹${Number(value).toLocaleString('en-IN')}`
  }

  return (
    <div className="p-6 max-h-[80vh] overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-800 border-b pb-2">Basic Information</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">Name:</span><p className="font-medium">{product.name}</p></div>
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
          </div>
          {product.description && (
            <div className="text-sm">
              <span className="text-gray-500">Description:</span>
              <p className="mt-1">{product.description}</p>
            </div>
          )}
        </div>

        {/* Pricing Calculator */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-800 border-b pb-2">Pricing Calculator</h4>

          {/* Base Price */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Base Price</h5>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div><span className="text-gray-500">Type:</span><p className="font-medium">{product.basePriceType === 'mop' ? 'MOP' : 'Purchase Price'}</p></div>
              <div><span className="text-gray-500">MRP:</span><p className="font-medium">{formatPrice(product.mrp)}</p></div>
              <div><span className="text-gray-500">MOP:</span><p className="font-medium">{formatPrice(product.mop)}</p></div>
              <div><span className="text-gray-500">Purchase:</span><p className="font-medium">{formatPrice(product.purchasePrice)}</p></div>
            </div>
          </div>

          {/* Discounts */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Discounts</h5>
            <div className="grid grid-cols-5 gap-2 text-sm">
              <div><span className="text-gray-500 text-xs">Disc 1:</span><p className="font-medium">{formatDiscount(product.dis1, product.dis1Type)}</p></div>
              <div><span className="text-gray-500 text-xs">Disc 2:</span><p className="font-medium">{formatDiscount(product.dis2, product.dis2Type)}</p></div>
              <div><span className="text-gray-500 text-xs">Disc 3:</span><p className="font-medium">{formatDiscount(product.dis3, product.dis3Type)}</p></div>
              <div><span className="text-gray-500 text-xs">Disc 4:</span><p className="font-medium">{formatDiscount(product.dis4, product.dis4Type)}</p></div>
              <div><span className="text-gray-500 text-xs">Disc 5:</span><p className="font-medium">{formatDiscount(product.dis5, product.dis5Type)}</p></div>
            </div>
          </div>

          {/* NLC & Profit */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">NLC (Net Landing Cost):</span>
                <p className="font-bold text-blue-700 text-lg">{formatPrice(product.nlc)}</p>
              </div>
              <div>
                <span className="text-gray-500">Profit:</span>
                <p className="font-medium">{formatDiscount(product.profit, product.profitType)}</p>
              </div>
            </div>
          </div>

          {/* Tier Prices (T1-T4) */}
          <div className="bg-green-50 p-3 rounded-lg">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Tier Prices (Customer Price Lists)</h5>
            <div className="grid grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-gray-500 text-xs">T1 Price:</span>
                <p className="font-medium text-green-700">{formatPrice(product.op1 || product.t1)}</p>
                <span className="text-xs text-gray-400">Tier 1 customers</span>
              </div>
              <div>
                <span className="text-gray-500 text-xs">T2 Price:</span>
                <p className="font-medium text-green-700">{formatPrice(product.op2 || product.t2)}</p>
                <span className="text-xs text-gray-400">Tier 2 customers</span>
              </div>
              <div>
                <span className="text-gray-500 text-xs">T3 Price:</span>
                <p className="font-medium text-green-700">{formatPrice(product.op3 || product.t3)}</p>
                <span className="text-xs text-gray-400">Tier 3 customers</span>
              </div>
              <div>
                <span className="text-gray-500 text-xs">T4 Price:</span>
                <p className="font-medium text-green-700">{formatPrice(product.op4 || product.t4)}</p>
                <span className="text-xs text-gray-400">Tier 4 customers</span>
              </div>
            </div>
          </div>

          {/* Legacy Pricing */}
          {(product.cnlc || product.mnlc || product.opPrice) && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Legacy Pricing</h5>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div><span className="text-gray-500">CNLC:</span><p className="font-medium">{formatPrice(product.cnlc)}</p></div>
                <div><span className="text-gray-500">MNLC:</span><p className="font-medium">{formatPrice(product.mnlc)}</p></div>
                <div><span className="text-gray-500">OP Price:</span><p className="font-medium">{formatPrice(product.opPrice)}</p></div>
                <div><span className="text-gray-500">Bottom:</span><p className="font-medium">{formatPrice(product.bottomPrice)}</p></div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end mt-6">
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

  const getInitialState = () => {
    const state = {
      name: product?.name || '',
      imageUrl: product?.imageUrl || '',
      partNumber: product?.partNumber || '',
      description: product?.description || '',
      brand: product?.brand || '',
      brandId: product?.brandId || '',
      category: product?.category || '',
      categoryId: product?.categoryId || '',
      subcategory: product?.subcategory || '',
      subcategoryId: product?.subcategoryId || '',
      series: product?.series || '',
      seriesId: product?.seriesId || '',
      unit: product?.unit || '',
      hsn: product?.hsn || '',
      gstRate: product?.gstRate || 18,
      mrp: product?.mrp || '',
      mop: product?.mop || '',
      purchasePrice: product?.purchasePrice || '',
      // Pricing calculator fields
      basePriceType: product?.basePriceType || 'mop', // 'mop' or 'purchase'
      dis1: product?.dis1 || '',
      dis1Type: product?.dis1Type || 'percent', // 'percent' or 'flat'
      dis2: product?.dis2 || '',
      dis2Type: product?.dis2Type || 'percent',
      dis3: product?.dis3 || '',
      dis3Type: product?.dis3Type || 'percent',
      dis4: product?.dis4 || '',
      dis4Type: product?.dis4Type || 'percent',
      dis5: product?.dis5 || '',
      dis5Type: product?.dis5Type || 'percent',
      nlc: product?.nlc || '',
      profit: product?.profit || '',
      profitType: product?.profitType || 'percent',
      op1: product?.op1 || '',
      op1Type: product?.op1Type || 'percent',
      op2: product?.op2 || '',
      op2Type: product?.op2Type || 'percent',
      op3: product?.op3 || '',
      op3Type: product?.op3Type || 'percent',
      op4: product?.op4 || '',
      // Legacy fields for backward compatibility
      cnlc: product?.cnlc || '',
      mnlc: product?.mnlc || '',
      opPrice: product?.opPrice || '',
      t1: product?.t1 || '',
      t2: product?.t2 || '',
      t3: product?.t3 || '',
      t4: product?.t4 || '',
      bottomPrice: product?.bottomPrice || '',
      density: product?.density || 'Regular',
      stock: product?.stock || 0,
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
    if (!initialized && product) {
      // Set initial form data from product
      setFormData(getInitialState())

      // Load subcategories and series based on category
      if (product.categoryId) {
        loadSubcategories(product.categoryId)
        loadSeries(product.categoryId)
      }
      setInitialized(true)
    } else if (!initialized) {
      setInitialized(true)
    }
  }, [product, initialized])

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
    const numericFields = ['mrp', 'mop', 'purchasePrice', 'cnlc', 'mnlc', 'opPrice', 't1', 't2', 't3', 't4', 'bottomPrice', 'dis1', 'dis2', 'dis3', 'dis4', 'dis5', 'profit', 'op1', 'op2', 'op3', 'op4', 'nlc']
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
    const basePrice = formData.basePriceType === 'mop'
      ? parseFloat(formData.mop) || 0
      : parseFloat(formData.purchasePrice) || 0

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

    // Calculate OP prices
    const opPrices = []
    const opFields = [
      { value: parseFloat(formData.op1) || 0, type: formData.op1Type },
      { value: parseFloat(formData.op2) || 0, type: formData.op2Type },
      { value: parseFloat(formData.op3) || 0, type: formData.op3Type },
      { value: parseFloat(formData.op4) || 0, type: formData.op4Type || 'flat' },
    ]

    opFields.forEach(op => {
      if (op.type === 'percent') {
        opPrices.push(Math.round((priceWithProfit * (1 + op.value / 100)) * 100) / 100)
      } else {
        opPrices.push(Math.round((priceWithProfit + op.value) * 100) / 100)
      }
    })

    return {
      nlc,
      op1: opPrices[0] || 0,
      op2: opPrices[1] || 0,
      op3: opPrices[2] || 0,
      op4: opPrices[3] || 0,
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
    const submitData = {
      ...formData,
      mrp: parseFloat(formData.mrp) || 0,
      mop: parseFloat(formData.mop) || 0,
      purchasePrice: parseFloat(formData.purchasePrice) || 0,
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
      // OP Prices (T1-T4)
      op1: calculated.op1,
      op1Type: formData.op1Type,
      op2: calculated.op2,
      op2Type: formData.op2Type,
      op3: calculated.op3,
      op3Type: formData.op3Type,
      op4: calculated.op4,
      // T1-T4 prices = OP prices for customer price lists
      t1: calculated.op1,
      t2: calculated.op2,
      t3: calculated.op3,
      t4: calculated.op4,
      opPrice: calculated.op1, // Default OP Price is T1
      // Legacy fields for backward compatibility
      cnlc: calculated.nlc,
      mnlc: parseFloat(formData.mnlc) || 0,
      bottomPrice: parseFloat(formData.bottomPrice) || calculated.op4,
      t4: parseFloat(formData.t4) || 0,
      bottomPrice: parseFloat(formData.bottomPrice) || 0,
      gstRate: parseFloat(formData.gstRate) || 0,
      stock: parseInt(formData.stock) || 0,
    }
    onSubmit(submitData)
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-6">
      {/* Brand, Category, Subcategory, Series - All Independent */}
      <div className="border-b pb-4">
        <h4 className="font-medium text-gray-800 mb-3">Classification</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand
            </label>
            <select
              name="brandId"
              value={formData.brandId}
              onChange={handleBrandChange}
              className="input-field"
            >
              <option value="">Select Brand</option>
              {brands.map(brand => (
                <option key={brand._id} value={brand._id}>{brand.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleCategoryChange}
              className="input-field"
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
            <select
              name="subcategoryId"
              value={formData.subcategoryId}
              onChange={handleSubcategoryChange}
              disabled={!formData.categoryId}
              className="input-field disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select Subcategory</option>
              {subcategories.map(sub => (
                <option key={sub._id} value={sub._id}>{sub.name}</option>
              ))}
            </select>
            {!formData.categoryId && <p className="text-xs text-gray-400 mt-1">Select a category first</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Series</label>
            <select
              name="seriesId"
              value={formData.seriesId}
              onChange={handleSeriesChange}
              disabled={!formData.categoryId}
              className="input-field disabled:bg-gray-100 disabled:cursor-not-allowed"
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
      <div className="border-b pb-4">
        <h4 className="font-medium text-gray-800 mb-3">Basic Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              placeholder="Enter product name"
              className={`input-field ${errors.name && touched.name ? 'border-red-500 focus:ring-red-500' : ''}`}
            />
            {errors.name && touched.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Part Number</label>
            <input
              type="text"
              name="partNumber"
              value={formData.partNumber}
              onChange={handleChange}
              placeholder="Enter part number"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="input-field"
            />
            {formData.imageUrl && (
              <img
                src={getImageUrl(formData.imageUrl)}
                alt="Preview"
                className="mt-2 w-24 h-24 object-cover rounded-lg border"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://img.freepik.com/free-photo/modern-stationary-collection-arrangement_23-2149309643.jpg?semt=ais_rp_progressive&w=740&q=80';
                }}
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
            <input
              type="text"
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              placeholder="e.g., PCS, KG"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">HSN Code</label>
            <input
              type="text"
              name="hsn"
              value={formData.hsn}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter HSN code"
              className={`input-field ${errors.hsn && touched.hsn ? 'border-red-500 focus:ring-red-500' : ''}`}
            />
            {errors.hsn && touched.hsn && <p className="text-xs text-red-500 mt-1">{errors.hsn}</p>}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Density</label>
            <select name="density" value={formData.density} onChange={handleChange} className="input-field">
              <option value="Regular">Regular</option>
              <option value="B2B">B2B</option>
              <option value="Back to Back">Back to Back</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Stock quantity"
              className={`input-field ${errors.stock && touched.stock ? 'border-red-500 focus:ring-red-500' : ''}`}
            />
            {errors.stock && touched.stock && <p className="text-xs text-red-500 mt-1">{errors.stock}</p>}
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea name="description" value={formData.description} onChange={handleChange} rows="2"
            className="input-field" placeholder="Enter product description" />
        </div>
      </div>

      {/* Pricing Calculator */}
      <div className="border-b pb-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-800 text-lg">Pricing Calculator</h4>
          <button
            type="button"
            onClick={updateCalculatedPrices}
            className="btn-primary text-sm py-1.5 px-4 flex items-center gap-1"
          >
            <RefreshCw className="w-4 h-4" />
            Calculate
          </button>
        </div>

        {/* Step 1: Base Price */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">1</span>
            Base Price
          </h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Base Type</label>
              <select
                name="basePriceType"
                value={formData.basePriceType}
                onChange={handleChange}
                className="input-field"
              >
                <option value="mop">MOP (Manual)</option>
                <option value="purchase">Purchase (API)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">MRP</label>
              <input
                type="number"
                name="mrp"
                value={formData.mrp}
                onChange={handleChange}
                placeholder="₹0"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">MOP</label>
              <input
                type="number"
                name="mop"
                value={formData.mop}
                onChange={handleChange}
                placeholder="₹0"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Purchase Price</label>
              <input
                type="number"
                name="purchasePrice"
                value={formData.purchasePrice}
                onChange={handleChange}
                placeholder="₹0"
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Discounts */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">2</span>
            Discounts (Applied Sequentially)
          </h5>
          <div className="grid grid-cols-5 gap-3">
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
                    className="w-full px-2 py-2 text-center text-sm focus:outline-none"
                  />
                  <select
                    name={`${discount.field}Type`}
                    value={formData[`${discount.field}Type`]}
                    onChange={handleChange}
                    className="w-10 text-xs bg-gray-50 border-l focus:outline-none"
                  >
                    <option value="percent">%</option>
                    <option value="flat">₹</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step 3: NLC & Profit */}
        <div className="bg-blue-50 rounded-xl p-4 mb-4">
          <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">3</span>
            Net Landing Cost & Profit
          </h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
            <div className="bg-white rounded-lg p-3 text-center">
              <label className="block text-xs text-gray-500 mb-1">NLC (After Discounts)</label>
              <div className="text-2xl font-bold text-blue-700">
                ₹{calculatePrices().nlc.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Add Profit</label>
              <div className="flex rounded-lg overflow-hidden border border-gray-200 bg-white">
                <input
                  type="number"
                  name="profit"
                  value={formData.profit}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm focus:outline-none"
                />
                <select
                  name="profitType"
                  value={formData.profitType}
                  onChange={handleChange}
                  className="w-12 text-xs bg-gray-50 border-l focus:outline-none"
                >
                  <option value="percent">%</option>
                  <option value="flat">₹</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4: T1-T4 Prices (OP Prices) */}
        <div className="bg-green-50 rounded-xl p-4">
          <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center">4</span>
            Tier Prices (T1, T2, T3, T4) - For Customer Price Lists
          </h5>
          <div className="grid grid-cols-4 gap-3">
            {[
              { field: 'op1', label: 'T1 Price', tier: 'Tier 1' },
              { field: 'op2', label: 'T2 Price', tier: 'Tier 2' },
              { field: 'op3', label: 'T3 Price', tier: 'Tier 3' },
              { field: 'op4', label: 'T4 Price', tier: 'Tier 4' },
            ].map((op, index) => (
              <div key={op.field} className="bg-white rounded-lg p-3 text-center">
                <label className="block text-xs text-gray-500 mb-1">{op.label}</label>
                <div className="flex rounded-lg overflow-hidden border border-gray-200 bg-white mb-1">
                  <input
                    type="number"
                    name={op.field}
                    value={formData[op.field]}
                    onChange={handleChange}
                    placeholder="0"
                    className="w-full px-2 py-2 text-center text-sm font-medium focus:outline-none"
                  />
                  {index < 3 && (
                    <select
                      name={`${op.field}Type`}
                      value={formData[`${op.field}Type`]}
                      onChange={handleChange}
                      className="w-10 text-xs bg-gray-50 border-l focus:outline-none"
                    >
                      <option value="percent">%</option>
                      <option value="flat">₹</option>
                    </select>
                  )}
                </div>
                <div className="text-xs text-green-600 font-medium">
                  ₹{calculatePrices()[op.field].toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            These T1-T4 prices are used for different customer price lists. Select markup % or flat ₹ to add on NLC+Profit.
          </p>
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
  const [brands, setBrands] = useState([])
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [series, setSeries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [brandFilter, setBrandFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [subcategoryFilter, setSubcategoryFilter] = useState('')
  const [seriesFilter, setSeriesFilter] = useState('')
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

  // Filter subcategories and series when category filter changes
  const [filterSubcategories, setFilterSubcategories] = useState([])
  const [filterSeries, setFilterSeries] = useState([])

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

  const fetchCategories = async () => {
    try {
      const response = await getCategories({ limit: 1000 })
      if (response.success !== false) {
        setCategories(response.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    }
  }

  const fetchProducts = async (page = currentPage, limit = pagination.limit) => {
    setLoading(true)
    setError(null)
    try {
      const params = { page, limit }
      if (brandFilter) params.brand = brandFilter
      if (categoryFilter) params.category = categoryFilter
      if (subcategoryFilter) params.subcategory = subcategoryFilter
      if (seriesFilter) params.series = seriesFilter
      if (searchQuery) params.search = searchQuery

      const response = await getAdminProducts(params)
      if (response.success !== false) {
        if (response.pagination) {
          setProducts(response.data || [])
          setPagination({
            total: response.pagination.total || 0,
            totalPages: response.pagination.totalPages || 1,
            limit: response.pagination.limit || 10,
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

  // Load subcategories and series when category filter changes
  useEffect(() => {
    if (categoryFilter) {
      // Fetch subcategories for this category
      getSubcategories({ category: categoryFilter, limit: 100, active: true })
        .then(res => {
          if (res.success !== false) {
            setFilterSubcategories(res.data || [])
          }
        })
        .catch(() => setFilterSubcategories([]))

      // Fetch series for this category
      getSeries({ category: categoryFilter, limit: 100, active: true })
        .then(res => {
          if (res.success !== false) {
            setFilterSeries(res.data || [])
          }
        })
        .catch(() => setFilterSeries([]))

      setSubcategoryFilter('')
      setSeriesFilter('')
    } else {
      setFilterSubcategories([])
      setFilterSeries([])
      setSubcategoryFilter('')
      setSeriesFilter('')
    }
  }, [categoryFilter])

  const handlePageChange = (page) => {
    setCurrentPage(page)
    fetchProducts(page)
  }

  const handleSearch = () => {
    setCurrentPage(1)
    fetchProducts(1)
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
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 mt-1">Manage your product catalog</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="btn-secondary flex items-center gap-2 whitespace-nowrap"
          >
            {syncing ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                Sync from AccountGST
              </>
            )}
          </button>
          <button onClick={() => { setSelectedProduct(null); setShowModal(true) }} className="btn-primary flex items-center gap-2 whitespace-nowrap">
            <Plus className="w-5 h-5" />
            Add Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <select
            value={brandFilter}
            onChange={(e) => { setBrandFilter(e.target.value); setCurrentPage(1) }}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="">All Brands</option>
            {brands.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1) }}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
          </select>
          <select
            value={subcategoryFilter}
            onChange={(e) => { setSubcategoryFilter(e.target.value); setCurrentPage(1) }}
            disabled={!categoryFilter}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50"
          >
            <option value="">All Subcategories</option>
            {filterSubcategories.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
          </select>
          <select
            value={seriesFilter}
            onChange={(e) => { setSeriesFilter(e.target.value); setCurrentPage(1) }}
            disabled={!categoryFilter}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50"
          >
            <option value="">All Series</option>
            {filterSeries.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
          </select>
          <button onClick={handleSearch} className="btn-secondary">Search</button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Product</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 hidden lg:table-cell">Brand</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 hidden lg:table-cell">Category</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 hidden xl:table-cell">Subcategory</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 hidden xl:table-cell">Series</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">MRP</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600 hidden sm:table-cell">Stock</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No products found</p>
                  </td>
                </tr>
              ) : (
                products.map(product => (
                  <tr key={product._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{product.name}</p>
                      {product.partNumber && <p className="text-sm text-gray-500">{product.partNumber}</p>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 hidden lg:table-cell">{product.brand || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 hidden lg:table-cell">{product.category || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 hidden xl:table-cell">{product.subcategory || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 hidden xl:table-cell">{product.series || '-'}</td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">{formatPrice(product.mrp)}</td>
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
                        <button
                          onClick={() => { setSelectedProduct(product); setShowViewModal(true) }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => { setSelectedProduct(product); setShowModal(true) }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleDelete(product._id)}
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