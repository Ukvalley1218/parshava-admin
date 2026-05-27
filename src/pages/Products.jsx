import { useState, useEffect } from 'react'
import { Search, Plus, Edit2, Trash2, X, Loader, AlertCircle, Package, RefreshCw, Eye } from 'lucide-react'
import {
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  syncProducts,
  getBrands,
  uploadFile
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

  return (
    <div className="p-6">
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

        {/* Pricing */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-800 border-b pb-2">Pricing</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">MRP:</span><p className="font-medium">{formatPrice(product.mrp)}</p></div>
            <div><span className="text-gray-500">MOP:</span><p className="font-medium">{formatPrice(product.mop)}</p></div>
            <div><span className="text-gray-500">Purchase Price:</span><p className="font-medium">{formatPrice(product.purchasePrice)}</p></div>
            <div><span className="text-gray-500">CNLC:</span><p className="font-medium">{formatPrice(product.cnlc)}</p></div>
            <div><span className="text-gray-500">MNLC:</span><p className="font-medium">{formatPrice(product.mnlc)}</p></div>
          </div>

          <h5 className="font-medium text-gray-700 pt-2">Selling Prices</h5>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">OP Price:</span><p className="font-medium">{formatPrice(product.opPrice)}</p></div>
            <div><span className="text-gray-500">T1:</span><p className="font-medium">{formatPrice(product.t1)}</p></div>
            <div><span className="text-gray-500">T2:</span><p className="font-medium">{formatPrice(product.t2)}</p></div>
            <div><span className="text-gray-500">T3:</span><p className="font-medium">{formatPrice(product.t3)}</p></div>
            <div><span className="text-gray-500">T4:</span><p className="font-medium">{formatPrice(product.t4)}</p></div>
            <div><span className="text-gray-500">Bottom Price:</span><p className="font-medium">{formatPrice(product.bottomPrice)}</p></div>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <button onClick={onClose} className="btn-secondary">Close</button>
      </div>
    </div>
  )
}

// Product Form Component
function ProductForm({ product, onSubmit, onCancel, loading, brands }) {
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
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
      unit: product?.unit || '',
      hsn: product?.hsn || '',
      gstRate: product?.gstRate || 18,
      mrp: product?.mrp || '',
      mop: product?.mop || '',
      purchasePrice: product?.purchasePrice || '',
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

  // Initialize brandId and categoryId from existing product data (by name matching)
  useEffect(() => {
    // Set initialized to true once brands are loaded (for both new and edit modes)
    if (brands.length > 0 && !initialized) {
      if (product) {
        let brandId = product.brandId
        let categoryId = product.categoryId

        // Find brand by name if brandId not set
        if (product.brand && !brandId) {
          const foundBrand = brands.find(b => b.name.toLowerCase() === product.brand.toLowerCase())
          if (foundBrand) {
            brandId = foundBrand._id
          }
        }

        // Set categories based on brand
        if (brandId) {
          const selectedBrand = brands.find(b => b._id === brandId)
          if (selectedBrand && selectedBrand.categories) {
            setCategories(selectedBrand.categories.filter(c => c.active))

            // Find category by name if categoryId not set
            if (product.category && !categoryId) {
              const foundCategory = selectedBrand.categories.find(
                c => c.name.toLowerCase() === product.category.toLowerCase()
              )
              if (foundCategory) {
                categoryId = foundCategory._id
              }
            }

            // Set subcategories based on category
            if (categoryId) {
              const selectedCategory = selectedBrand.categories.find(c => c._id === categoryId)
              if (selectedCategory && selectedCategory.subcategories) {
                setSubcategories(selectedCategory.subcategories.filter(s => s.active))

                // Find subcategory by name if subcategoryId not set
                if (product.subcategory && !product.subcategoryId) {
                  const foundSubcategory = selectedCategory.subcategories.find(
                    s => s.name.toLowerCase() === product.subcategory.toLowerCase()
                  )
                  if (foundSubcategory) {
                    setFormData(prev => ({
                      ...prev,
                      brandId: brandId,
                      brand: product.brand,
                      categoryId: categoryId,
                      category: product.category,
                      subcategoryId: foundSubcategory._id,
                      subcategory: product.subcategory
                    }))
                    setInitialized(true)
                    return
                  }
                }
              }
            }
          }
        }

        setFormData(prev => ({
          ...prev,
          brandId: brandId || product.brandId || '',
          categoryId: categoryId || product.categoryId || ''
        }))
      }
      setInitialized(true)
    }
  }, [brands, product, initialized])

  // Update categories when brand changes
  useEffect(() => {
    if (initialized && formData.brandId) {
      const selectedBrand = brands.find(b => b._id === formData.brandId)
      if (selectedBrand && selectedBrand.categories) {
        setCategories(selectedBrand.categories.filter(c => c.active))
        setSubcategories([])
      }
    } else if (initialized && !formData.brandId) {
      setCategories([])
      setSubcategories([])
    }
  }, [formData.brandId, brands, initialized])

  // Update subcategories when category changes
  useEffect(() => {
    if (initialized && formData.categoryId && categories.length > 0) {
      const selectedCategory = categories.find(c => c._id === formData.categoryId)
      if (selectedCategory && selectedCategory.subcategories) {
        setSubcategories(selectedCategory.subcategories.filter(s => s.active))
      }
    } else if (initialized && !formData.categoryId) {
      setSubcategories([])
    }
  }, [formData.categoryId, categories, initialized])


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
      brand: selectedBrand?.name || '',
      category: '',
      categoryId: '',
      subcategory: '',
      subcategoryId: ''
    }))
  }

  const handleCategoryChange = (e) => {
    const categoryId = e.target.value
    const selectedCategory = categories.find(c => c._id === categoryId)
    setFormData(prev => ({
      ...prev,
      categoryId,
      category: selectedCategory?.name || '',
      subcategory: '',
      subcategoryId: ''
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

  const handleChange = (e) => {
    const { name, value, type } = e.target
    let newValue = value

    // Filter numeric fields to only allow numbers and decimals
    const numericFields = ['mrp', 'mop', 'purchasePrice', 'cnlc', 'mnlc', 'opPrice', 't1', 't2', 't3', 't4', 'bottomPrice']
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

    const submitData = {
      ...formData,
      mrp: parseFloat(formData.mrp) || 0,
      mop: parseFloat(formData.mop) || 0,
      purchasePrice: parseFloat(formData.purchasePrice) || 0,
      cnlc: parseFloat(formData.cnlc) || 0,
      mnlc: parseFloat(formData.mnlc) || 0,
      opPrice: parseFloat(formData.opPrice) || 0,
      t1: parseFloat(formData.t1) || 0,
      t2: parseFloat(formData.t2) || 0,
      t3: parseFloat(formData.t3) || 0,
      t4: parseFloat(formData.t4) || 0,
      bottomPrice: parseFloat(formData.bottomPrice) || 0,
      gstRate: parseFloat(formData.gstRate) || 0,
      stock: parseInt(formData.stock) || 0,
    }
    onSubmit(submitData)
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-6">
      {/* Brand, Category, Subcategory */}
      <div className="border-b pb-4">
        <h4 className="font-medium text-gray-800 mb-3">Classification</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand <span className="text-red-500">*</span>
            </label>
            <select
              name="brandId"
              value={formData.brandId}
              onChange={handleBrandChange}
              required
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
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleCategoryChange}
              required
              disabled={!formData.brandId}
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
              className="input-field"
            >
              <option value="">Select Subcategory</option>
              {subcategories.map(sub => (
                <option key={sub._id} value={sub._id}>{sub.name}</option>
              ))}
            </select>
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

      {/* Cost Pricing */}
      <div className="border-b pb-4">
        <h4 className="font-medium text-gray-800 mb-3">Cost Pricing</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">MRP</label>
            <input
              type="number"
              name="mrp"
              value={formData.mrp}
              onChange={handleChange}
              placeholder="₹0.00"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">MOP</label>
            <input
              type="number"
              name="mop"
              value={formData.mop}
              onChange={handleChange}
              placeholder="₹0.00"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price</label>
            <input
              type="number"
              name="purchasePrice"
              value={formData.purchasePrice}
              onChange={handleChange}
              placeholder="₹0.00"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CNLC</label>
            <input
              type="number"
              name="cnlc"
              value={formData.cnlc}
              onChange={handleChange}
              placeholder="₹0.00"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">MNLC</label>
            <input
              type="number"
              name="mnlc"
              value={formData.mnlc}
              onChange={handleChange}
              placeholder="₹0.00"
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Selling Pricing */}
      <div className="border-b pb-4">
        <h4 className="font-medium text-gray-800 mb-3">Selling Pricing</h4>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">OP Price</label>
            <input
              type="number"
              name="opPrice"
              value={formData.opPrice}
              onChange={handleChange}
              placeholder="₹0.00"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">T1</label>
            <input
              type="number"
              name="t1"
              value={formData.t1}
              onChange={handleChange}
              placeholder="₹0.00"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">T2</label>
            <input
              type="number"
              name="t2"
              value={formData.t2}
              onChange={handleChange}
              placeholder="₹0.00"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">T3</label>
            <input
              type="number"
              name="t3"
              value={formData.t3}
              onChange={handleChange}
              placeholder="₹0.00"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">T4</label>
            <input
              type="number"
              name="t4"
              value={formData.t4}
              onChange={handleChange}
              placeholder="₹0.00"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bottom Price</label>
            <input
              type="number"
              name="bottomPrice"
              value={formData.bottomPrice}
              onChange={handleChange}
              placeholder="₹0.00"
              className="input-field"
            />
          </div>
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [brandFilter, setBrandFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [subcategoryFilter, setSubcategoryFilter] = useState('')
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

  // Dynamic filter options from brands
  const [filterCategories, setFilterCategories] = useState([])
  const [filterSubcategories, setFilterSubcategories] = useState([])

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

  const fetchProducts = async (page = currentPage, limit = pagination.limit) => {
    setLoading(true)
    setError(null)
    try {
      const params = { page, limit }
      if (brandFilter) params.brand = brandFilter
      if (categoryFilter) params.category = categoryFilter
      if (subcategoryFilter) params.subcategory = subcategoryFilter
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
    fetchProducts(1)
  }, [])

  useEffect(() => {
    // Update filter categories when brand filter changes
    if (brandFilter) {
      const selectedBrand = brands.find(b => b.name === brandFilter)
      setFilterCategories(selectedBrand?.categories?.filter(c => c.active) || [])
      setFilterSubcategories([])
      setCategoryFilter('')
      setSubcategoryFilter('')
    } else {
      setFilterCategories([])
      setFilterSubcategories([])
    }
  }, [brandFilter, brands])

  useEffect(() => {
    // Update filter subcategories when category filter changes
    if (categoryFilter && filterCategories.length > 0) {
      const selectedCategory = filterCategories.find(c => c.name === categoryFilter)
      setFilterSubcategories(selectedCategory?.subcategories?.filter(s => s.active) || [])
      setSubcategoryFilter('')
    } else {
      setFilterSubcategories([])
    }
  }, [categoryFilter, filterCategories])

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
        alert('Products synced successfully!')
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
            disabled={!brandFilter}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50"
          >
            <option value="">All Categories</option>
            {filterCategories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
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
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">MRP</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600 hidden sm:table-cell">Stock</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
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