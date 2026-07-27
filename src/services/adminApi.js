import { get, post, put, patch, del } from './apiClient.js'

// ============================================
// AUTH API
// ============================================
export const adminLogin = async (credentials) => {
  return post('/admin/auth/login', credentials)
}

export const getAdminProfile = async () => {
  return get('/admin/auth/me')
}

export const updateAdminProfile = async (data) => {
  return put('/admin/auth/profile', data)
}

export const changeAdminPassword = async (data) => {
  return put('/admin/auth/change-password', data)
}

// ============================================
// SALES USERS API
// ============================================
export const getSalesUsers = async (params) => {
  return get('/admin/users', params)
}

export const getSalesUserById = async (id) => {
  return get(`/admin/users/${id}`)
}

export const createSalesUser = async (data) => {
  return post('/admin/users', data)
}

export const updateSalesUser = async (id, data) => {
  return put(`/admin/users/${id}`, data)
}

export const deleteSalesUser = async (id) => {
  return del(`/admin/users/${id}`)
}

export const toggleUserStatus = async (id) => {
  return patch(`/admin/users/${id}/toggle-status`)
}

// ============================================
// UPLOAD API
// ============================================
export const uploadFile = async (field, file) => {
  const formData = new FormData()
  formData.append(field, file)

  const token = localStorage.getItem('admin_token')
  // baseUrl already includes /api, so we don't add it again
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://parshava-backend.onrender.com/api'

  const response = await fetch(`${baseUrl}/upload/single/${field}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  })

  return response.json()
}

export const uploadCustomerFiles = async (files) => {
  const formData = new FormData()

  Object.keys(files).forEach(field => {
    if (Array.isArray(files[field])) {
      files[field].forEach(file => {
        formData.append(field, file)
      })
    } else {
      formData.append(field, files[field])
    }
  })

  const token = localStorage.getItem('admin_token')
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://parshava-backend.onrender.com/api'

  const response = await fetch(`${baseUrl}/upload/customer`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  })

  return response.json()
}

// Generic image upload function
export const uploadImage = async (file, field = 'image') => {
  const formData = new FormData()
  formData.append(field, file)

  const token = localStorage.getItem('admin_token')
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://parshava-backend.onrender.com/api'

  const response = await fetch(`${baseUrl}/upload/single/${field}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  })

  return response.json()
}

// ============================================
// CUSTOMERS API
// ============================================
export const getAdminCustomers = async (params) => {
  return get('/admin/customers', params)
}

export const getAdminCustomerById = async (id) => {
  return get(`/admin/customers/${id}`)
}

export const createAdminCustomer = async (data) => {
  return post('/admin/customers', data)
}

export const updateAdminCustomer = async (id, data) => {
  return put(`/admin/customers/${id}`, data)
}

export const deleteAdminCustomer = async (id) => {
  return del(`/admin/customers/${id}`)
}

export const bulkUpdateCustomers = async (customerIds, updates) => {
  return post('/admin/customers/bulk-update', { customerIds, updates })
}

// ============================================
// INQUIRIES API
// ============================================
export const getAdminInquiries = async (params) => {
  return get('/admin/inquiries', params)
}

export const getAdminInquiryById = async (id) => {
  return get(`/admin/inquiries/${id}`)
}

export const updateInquiryStatus = async (id, status) => {
  return patch(`/admin/inquiries/${id}/status`, { status })
}

export const deleteAdminInquiry = async (id) => {
  return del(`/admin/inquiries/${id}`)
}

export const convertInquiryToOrder = async (id) => {
  return post(`/admin/inquiries/${id}/convert`)
}

export const assignInquiryAdmin = async (id, assignedToUserId) => {
  return post(`/admin/inquiries/${id}/assign`, { assignedToUserId })
}

export const getUsersForAssignmentAdmin = async () => {
  return get('/admin/inquiries/users')
}

// ============================================
// ORDERS API
// ============================================
export const getAdminOrders = async (params) => {
  return get('/admin/orders', params)
}

export const getAdminOrderById = async (id) => {
  return get(`/admin/orders/${id}`)
}

export const updateOrderStatus = async (id, status) => {
  return patch(`/admin/orders/${id}/status`, { status })
}

export const deleteAdminOrder = async (id) => {
  return del(`/admin/orders/${id}`)
}

// ============================================
// PRODUCTS API
// ============================================
export const getAdminProducts = async (params) => {
  return get('/admin/products', params)
}

export const getAdminProductById = async (id) => {
  return get(`/admin/products/${id}`)
}

export const createAdminProduct = async (data) => {
  return post('/admin/products', data)
}

export const updateAdminProduct = async (id, data) => {
  return put(`/admin/products/${id}`, data)
}

export const deleteAdminProduct = async (id) => {
  return del(`/admin/products/${id}`)
}

export const syncProducts = async () => {
  return post('/admin/products/sync')
}

export const bulkUpdateProducts = async (filters, updates, productIds) => {
  return post('/admin/products/bulk-update', { filters, updates, productIds })
}

// ============================================
// DASHBOARD API
// ============================================
export const getDashboardStats = async () => {
  return get('/admin/dashboard/stats')
}

export const getRecentInquiries = async (limit = 5) => {
  return get('/admin/dashboard/recent-inquiries', { limit })
}

export const getRecentOrders = async (limit = 5) => {
  return get('/admin/dashboard/recent-orders', { limit })
}

export const getSalesReport = async (params) => {
  return get('/admin/reports/sales', params)
}

export const getRevenueReport = async (params) => {
  return get('/admin/reports/revenue', params)
}

// ============================================
// NOTIFICATIONS API
// ============================================
export const getAdminNotifications = async () => {
  return get('/admin/notifications')
}

export const markNotificationRead = async (id) => {
  return patch(`/admin/notifications/${id}/read`)
}

export const markAllNotificationsRead = async () => {
  return patch('/admin/notifications/read-all')
}

// ============================================
// BRANDS API
// ============================================
export const getBrands = async (params) => {
  return get('/admin/brands', params)
}

export const getBrandById = async (id) => {
  return get(`/admin/brands/${id}`)
}

export const getDistinctBrandsFromProducts = async () => {
  return get('/admin/brands/distinct')
}

export const createBrand = async (data) => {
  return post('/admin/brands', data)
}

export const updateBrand = async (id, data) => {
  return put(`/admin/brands/${id}`, data)
}

export const deleteBrand = async (id) => {
  return del(`/admin/brands/${id}`)
}

export const addCategoryToBrand = async (brandId, data) => {
  return post(`/admin/brands/${brandId}/categories`, data)
}

export const updateBrandCategory = async (brandId, categoryId, data) => {
  return put(`/admin/brands/${brandId}/categories/${categoryId}`, data)
}

export const deleteBrandCategory = async (brandId, categoryId) => {
  return del(`/admin/brands/${brandId}/categories/${categoryId}`)
}

export const addSubcategoryToCategory = async (brandId, categoryId, data) => {
  return post(`/admin/brands/${brandId}/categories/${categoryId}/subcategories`, data)
}

export const updateBrandSubcategory = async (brandId, categoryId, subcategoryId, data) => {
  return put(`/admin/brands/${brandId}/categories/${categoryId}/subcategories/${subcategoryId}`, data)
}

export const deleteBrandSubcategory = async (brandId, categoryId, subcategoryId) => {
  return del(`/admin/brands/${brandId}/categories/${categoryId}/subcategories/${subcategoryId}`)
}

export const importBrandsFromProducts = async (brands) => {
  return post('/admin/brands/import-from-products', { brands })
}

// ============================================
// CATEGORIES API
// ============================================
export const getCategories = async (params) => {
  return get('/categories', params)
}

export const getCategoryById = async (id) => {
  return get(`/categories/${id}`)
}

export const createCategory = async (data) => {
  return post('/categories', data)
}

export const updateCategory = async (id, data) => {
  return put(`/categories/${id}`, data)
}

export const deleteCategory = async (id) => {
  return del(`/categories/${id}`)
}

export const getCategorySubcategories = async (id) => {
  return get(`/categories/${id}/subcategories`)
}

export const getCategorySeries = async (id) => {
  return get(`/categories/${id}/series`)
}

// ============================================
// SUBCATEGORIES API
// ============================================
export const getSubcategories = async (params) => {
  return get('/subcategories', params)
}

export const getSubcategoryById = async (id) => {
  return get(`/subcategories/${id}`)
}

export const createSubcategory = async (data) => {
  return post('/subcategories', data)
}

export const updateSubcategory = async (id, data) => {
  return put(`/subcategories/${id}`, data)
}

export const deleteSubcategory = async (id) => {
  return del(`/subcategories/${id}`)
}

// ============================================
// SERIES API
// ============================================
export const getSeries = async (params) => {
  return get('/series', params)
}

export const getSeriesById = async (id) => {
  return get(`/series/${id}`)
}

export const createSeries = async (data) => {
  return post('/series', data)
}

export const updateSeries = async (id, data) => {
  return put(`/series/${id}`, data)
}

export const deleteSeries = async (id) => {
  return del(`/series/${id}`)
}

// Sub-Series API
export const addSubSeries = async (seriesId, data) => {
  return post(`/series/${seriesId}/subseries`, data)
}

export const updateSubSeries = async (seriesId, subSeriesId, data) => {
  return put(`/series/${seriesId}/subseries/${subSeriesId}`, data)
}

export const deleteSubSeries = async (seriesId, subSeriesId) => {
  return del(`/series/${seriesId}/subseries/${subSeriesId}`)
}

// ============================================
// CONTACTS API
// ============================================
export const getContacts = async (params) => {
  return get('/admin/contacts', params)
}

export const getContactById = async (id) => {
  return get(`/admin/contacts/${id}`)
}

export const createContact = async (data) => {
  return post('/admin/contacts', data)
}

export const updateContact = async (id, data) => {
  return put(`/admin/contacts/${id}`, data)
}

export const deleteContact = async (id) => {
  return del(`/admin/contacts/${id}`)
}

export const getContactDesignations = async () => {
  return get('/admin/contacts/designations')
}

export const getCustomerContacts = async (customerId) => {
  return get(`/admin/customers/${customerId}/contacts`)
}

// ============================================
// BUSINESS CATEGORIES API
// ============================================
export const getBusinessCategories = async (params) => {
  return get('/business-categories', params)
}

export const getBusinessCategoryById = async (id) => {
  return get(`/business-categories/${id}`)
}

export const createBusinessCategory = async (data) => {
  return post('/business-categories', data)
}

export const updateBusinessCategory = async (id, data) => {
  return put(`/business-categories/${id}`, data)
}

export const deleteBusinessCategory = async (id) => {
  return del(`/business-categories/${id}`)
}

// ============================================
// BRAND CATEGORY ENTITY API (separate from brand management)
// ============================================
export const getBrandCategoryList = async (params) => {
  return get('/brand-categories', params)
}

export const getBrandCategoryEntityById = async (id) => {
  return get(`/brand-categories/${id}`)
}

export const createBrandCategoryEntity = async (data) => {
  return post('/brand-categories', data)
}

export const updateBrandCategoryEntity = async (id, data) => {
  return put(`/brand-categories/${id}`, data)
}

export const deleteBrandCategoryEntity = async (id) => {
  return del(`/brand-categories/${id}`)
}

// ============================================
// ENQUIRIES API
// ============================================
export const getEnquiries = async (params) => {
  return get('/enquiries', params)
}

export const getEnquiryById = async (id) => {
  return get(`/enquiries/${id}`)
}

export const createEnquiry = async (data) => {
  return post('/enquiries', data)
}

export const updateEnquiry = async (id, data) => {
  return patch(`/enquiries/${id}`, data)
}

export const deleteEnquiry = async (id) => {
  return del(`/enquiries/${id}`)
}

export const linkQuotation = async (enquiryId, quotationId) => {
  return post(`/enquiries/${enquiryId}/link-quotation`, { quotationId })
}

export const getEnquiryCounts = async () => {
  return get('/enquiries/counts')
}

export default {
  // Auth
  adminLogin,
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
  // Users
  getSalesUsers,
  getSalesUserById,
  createSalesUser,
  updateSalesUser,
  deleteSalesUser,
  toggleUserStatus,
  // Customers
  getAdminCustomers,
  getAdminCustomerById,
  createAdminCustomer,
  updateAdminCustomer,
  deleteAdminCustomer,
  // Inquiries
  getAdminInquiries,
  getAdminInquiryById,
  updateInquiryStatus,
  deleteAdminInquiry,
  convertInquiryToOrder,
  assignInquiryAdmin,
  getUsersForAssignmentAdmin,
  // Orders
  getAdminOrders,
  getAdminOrderById,
  updateOrderStatus,
  deleteAdminOrder,
  // Products
  getAdminProducts,
  getAdminProductById,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  syncProducts,
  bulkUpdateProducts,
  // Dashboard
  getDashboardStats,
  getRecentInquiries,
  getRecentOrders,
  // Reports
  getSalesReport,
  getRevenueReport,
  // Notifications
  getAdminNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  // Brands
  getBrands,
  getBrandById,
  getDistinctBrandsFromProducts,
  createBrand,
  updateBrand,
  deleteBrand,
  addCategoryToBrand,
  updateBrandCategory,
  deleteBrandCategory,
  addSubcategoryToCategory,
  updateBrandSubcategory,
  deleteBrandSubcategory,
  importBrandsFromProducts,
  // Categories
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategorySubcategories,
  getCategorySeries,
  // Subcategories
  getSubcategories,
  getSubcategoryById,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  // Series
  getSeries,
  getSeriesById,
  createSeries,
  updateSeries,
  deleteSeries,
  addSubSeries,
  updateSubSeries,
  deleteSubSeries,
  // Contacts
  getContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  getContactDesignations,
  // Business Categories
  getBusinessCategories,
  getBusinessCategoryById,
  createBusinessCategory,
  updateBusinessCategory,
  deleteBusinessCategory,
  // Brand Category Entity (separate from brand management)
  getBrandCategoryList,
  getBrandCategoryEntityById,
  createBrandCategoryEntity,
  updateBrandCategoryEntity,
  deleteBrandCategoryEntity,
  // Enquiries
  getEnquiries,
  getEnquiryById,
  createEnquiry,
  updateEnquiry,
  deleteEnquiry,
  linkQuotation,
  getEnquiryCounts,
}