import { useState, useEffect } from 'react'
import {
  Users, UserCircle, FileText, ShoppingBag, TrendingUp,
  DollarSign, Clock, ArrowUpRight, ArrowDownRight, Loader
} from 'lucide-react'
import { getDashboardStats, getRecentInquiries, getRecentOrders } from '../services/adminApi'

// Stat Card Component
function StatCard({ title, value, icon: Icon, change, changeType, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 mt-1 truncate max-w-[150px]">
  {value}
</h3>
         
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}

// Recent Activity Card
function RecentActivityCard({ title, items, type, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-center h-40">
          <Loader className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <a href={`/admin/${type}`} className="text-sm text-blue-600 hover:underline">
          View all
        </a>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No recent {type}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={item._id || index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  type === 'inquiries' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'
                }`}>
                  {type === 'inquiries' ? (
                    <FileText className="w-5 h-5" />
                  ) : (
                    <ShoppingBag className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {item.customerDetails?.name || item.customer?.name || 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {item.items?.length || 0} items • ₹{(item.grandTotal || 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                  item.status === 'draft' ? 'bg-amber-100 text-amber-700' :
                  item.status === 'converted' ? 'bg-green-100 text-green-700' :
                  item.status === 'pending' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {item.status}
                </span>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(item.createdAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalInquiries: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalUsers: 0,
    totalRevenue: 0,
  })
  const [recentInquiries, setRecentInquiries] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const [statsRes, inquiriesRes, ordersRes] = await Promise.all([
          getDashboardStats().catch(() => ({ data: {} })),
          getRecentInquiries(5).catch(() => ({ data: [] })),
          getRecentOrders(5).catch(() => ({ data: [] })),
        ])

        if (statsRes.success !== false) {
          setStats(statsRes.data || statsRes || {
            totalInquiries: 0,
            totalOrders: 0,
            totalCustomers: 0,
            totalUsers: 0,
            totalRevenue: 0,
          })
        }

        if (inquiriesRes.success !== false) {
          setRecentInquiries(inquiriesRes.data || inquiriesRes || [])
        }

        if (ordersRes.success !== false) {
          setRecentOrders(ordersRes.data || ordersRes || [])
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#1F3A5F] text-white rounded-xl"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
         <StatCard
  title="Total Revenue"
  value={`₹${Math.floor(stats.totalRevenue || 0).toLocaleString('en-IN')}`}
  icon={DollarSign}
  change={2}
  changeType="up"
  color="purple"
/>
        <StatCard
          title="Total Inquiries"
          value={stats.totalInquiries || 0}
          icon={FileText}
          change={12}
          changeType="up"
          color="amber"
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders || 0}
          icon={ShoppingBag}
          change={8}
          changeType="up"
          color="green"
        />
        <StatCard
          title="Customers"
          value={stats.totalCustomers || 0}
          icon={UserCircle}
          change={5}
          changeType="up"
          color="blue"
        />
        <StatCard
          title="Sales Users"
          value={stats.totalUsers || 0}
          icon={Users}
          change={2}
          changeType="up"
          color="purple"
        />
      
      </div>

      

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivityCard
          title="Recent Inquiries"
          items={recentInquiries}
          type="inquiries"
          loading={loading}
        />
        <RecentActivityCard
          title="Recent Orders"
          items={recentOrders}
          type="orders"
          loading={loading}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <a
            href="/admin/users"
            className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <Users className="w-6 h-6 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Add User</span>
          </a>
          <a
            href="/admin/customers"
            className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <UserCircle className="w-6 h-6 text-green-600" />
            <span className="text-sm font-medium text-gray-700">Add Customer</span>
          </a>
          <a
            href="/admin/inquiries"
            className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <FileText className="w-6 h-6 text-amber-600" />
            <span className="text-sm font-medium text-gray-700">View Inquiries</span>
          </a>
          
        </div>
      </div>
    </div>
  )
}