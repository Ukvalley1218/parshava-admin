import { useState } from 'react'
import { User, Mail, Lock, Bell, Shield, Palette, Save, Loader } from 'lucide-react'
import { useAdminAuth } from '../context/AdminAuthContext'
import { updateAdminProfile, changeAdminPassword } from '../services/adminApi'

export default function Settings() {
  const { admin } = useAdminAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // Profile form state
  const [profile, setProfile] = useState({
    name: admin?.name || '',
    email: admin?.email || '',
    phone: admin?.phone || '',
  })

  // Password form state
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    orderNotifications: true,
    inquiryNotifications: true,
    reportNotifications: false,
  })

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })
    try {
      const response = await updateAdminProfile(profile)
      if (response.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' })
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to update profile' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update profile' })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordUpdate = async (e) => {
    e.preventDefault()
    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }
    setLoading(true)
    setMessage({ type: '', text: '' })
    try {
      const response = await changeAdminPassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      })
      if (response.success) {
        setMessage({ type: 'success', text: 'Password updated successfully!' })
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to update password' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update password' })
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { key: 'profile', label: 'Profile', icon: User },
    // { key: 'security', label: 'Security', icon: Lock },
    // { key: 'notifications', label: 'Notifications', icon: Bell },
  ]

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account settings and preferences</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.key
                  ? 'border-[#1F3A5F] text-[#1F3A5F]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-xl ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Profile Information</h3>
          <form onSubmit={handleProfileUpdate} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </form>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Change Password</h3>
          <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input type="password" value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input type="password" value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                required minLength={6}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input type="password" value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              <Lock className="w-4 h-4" />
              Update Password
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Account Security</h3>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
              </div>
              <button className="btn-secondary">Enable</button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Notification Preferences</h3>
          <div className="space-y-4">
            {[
              { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
              { key: 'orderNotifications', label: 'Order Notifications', desc: 'Get notified when orders are placed' },
              { key: 'inquiryNotifications', label: 'Quotation Notifications', desc: 'Get notified when quotations are submitted' },
              { key: 'reportNotifications', label: 'Report Notifications', desc: 'Receive weekly report summaries' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium text-gray-900">{item.label}</p>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={notifications[item.key]}
                    onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                    className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
          <button className="btn-primary mt-6">Save Preferences</button>
        </div>
      )}
    </div>
  )
}