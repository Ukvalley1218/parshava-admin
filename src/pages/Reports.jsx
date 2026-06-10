import { useState, useEffect } from 'react'
import { Calendar, TrendingUp, DollarSign, ShoppingBag, Users, FileText, Loader, Download } from 'lucide-react'
import { getSalesReport, getRevenueReport } from '../services/adminApi'

// Format currency
const fmt = (n) => '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })

// Stat Card Component
function StatCard({ title, value, icon: Icon, change, color }) {
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
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
          {change !== undefined && (
            <p className={`text-sm mt-2 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '+' : ''}{change}% from last period
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}

export default function Reports() {
  const [dateRange, setDateRange] = useState('7d')
  const [loading, setLoading] = useState(true)
  const [salesData, setSalesData] = useState([])
  const [revenueData, setRevenueData] = useState([])
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalOrders: 0,
    totalInquiries: 0,
  })

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [salesRes, revenueRes] = await Promise.all([
          getSalesReport({ period: dateRange }).catch(() => ({ data: [] })),
          getRevenueReport({ period: dateRange }).catch(() => ({ data: [] })),
        ])

        if (salesRes.success !== false) {
          setSalesData(salesRes.data || [])
          const totalSales = (salesRes.data || []).reduce((sum, s) => sum + (s.amount || 0), 0)
          const totalOrders = (salesRes.data || []).reduce((sum, s) => sum + (s.orders || 0), 0)
          setSummary((prev) => ({ ...prev, totalSales, totalOrders }))
        }

        if (revenueRes.success !== false) {
          setRevenueData(revenueRes.data || [])
          const totalRevenue = (revenueRes.data || []).reduce((sum, r) => sum + (r.amount || 0), 0)
          const totalInquiries = (revenueRes.data || []).reduce((sum, r) => sum + (r.inquiries || 0), 0)
          setSummary((prev) => ({ ...prev, totalRevenue, totalInquiries }))
        }
      } catch (err) {
        console.error('Error fetching reports:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [dateRange])

  const handleExport = () => {
    // Generate CSV export
    const csvContent = [
      'Date,Sales,Revenue,Orders,Inquiries',
      ...(salesData.length > 0 ? salesData.map((s, i) =>
        `${s.date || ''},${s.amount || 0},${revenueData[i]?.amount || 0},${s.orders || 0},${revenueData[i]?.inquiries || 0}`
      ) : ['No data available'])
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader className="w-8 h-8 animate-spin text-gray-400" /></div>
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 mt-1">Analyze your business performance</p>
        </div>
        <div className="flex gap-3">
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Sales" value={fmt(summary.totalSales)} icon={DollarSign} change={12} color="green" />
        <StatCard title="Total Revenue" value={fmt(summary.totalRevenue)} icon={TrendingUp} change={8} color="blue" />
        <StatCard title="Total Orders" value={summary.totalOrders} icon={ShoppingBag} change={15} color="amber" />
        <StatCard title="Total Inquiries" value={summary.totalInquiries} icon={FileText} change={5} color="purple" />
      </div>

      {/* Sales Chart Placeholder */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Sales Overview</h3>
        {salesData.length > 0 ? (
          <div className="h-64 flex items-end justify-between gap-2">
            {salesData.map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-blue-500 rounded-t-lg transition-all hover:bg-blue-600"
                  style={{ height: `${(item.amount / Math.max(...salesData.map(s => s.amount || 0))) * 200}px`, minHeight: '10px' }}
                  title={`₹${(item.amount || 0).toLocaleString('en-IN')}`}
                />
                <span className="text-xs text-gray-500">{item.label || `Day ${idx + 1}`}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No sales data available</p>
            </div>
          </div>
        )}
      </div>

      {/* Revenue Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Revenue Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[400px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Date</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Revenue</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Orders</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Inquiries</th>
              </tr>
            </thead>
            <tbody>
              {revenueData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-400">No data available</td>
                </tr>
              ) : (
                revenueData.map((item, idx) => (
                  <tr key={idx} className="border-t border-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{item.date}</td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">{fmt(item.amount || 0)}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-600">{item.orders || 0}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-600">{item.inquiries || 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}