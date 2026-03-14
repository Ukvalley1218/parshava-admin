import { useState, useRef, useEffect } from 'react'
import { Bell, Search, User, ChevronDown, Menu } from 'lucide-react'
import { useAdminAuth } from '../context/AdminAuthContext'
import { useNavigate } from 'react-router-dom'

export default function Navbar({ onMenuClick, isMobile }) {
 const { admin, logout } = useAdminAuth()
const navigate = useNavigate()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const notifRef = useRef(null)
  const profileRef = useRef(null)

  

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false)
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
  logout()
  navigate('/admin/login')
}

  // // Mock notifications
  // const notifications = [
  //   { id: 1, title: 'New Inquiry', message: 'A new inquiry has been submitted', time: '5 min ago', unread: true },
  //   { id: 2, title: 'Order Placed', message: 'Order #1234 has been placed', time: '1 hour ago', unread: true },
  //   { id: 3, title: 'New User', message: 'New sales user registered', time: '2 hours ago', unread: false },
  // ]

  // const unreadCount = notifications.filter(n => n.unread).length

  return (
    <header className="bg-white border-b border-gray-100 px-4 md:px-6 py-3 sticky top-0 z-30">
      <div className="flex items-center justify-between">
        {/* Left - Hamburger + Search */}
        <div className="flex items-center gap-3 flex-1">
          {/* Mobile Menu Button */}
          {isMobile && (
            <button
              onClick={onMenuClick}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors lg:hidden"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
          )}

          {/* Search */}
          <div className="flex-1 max-w-md hidden sm:block">
            <div className="relative">
              {/* <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              /> */}
              <h3 className='font-bold text-2xl'>Paarshva Infotech</h3>
            </div>
          </div>
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Mobile Search Button */}
          <button className="p-2 rounded-xl hover:bg-gray-100 transition-colors sm:hidden">
            {/* <Search className="w-5 h-5 text-gray-600" /> */}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            {/* <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button> */}

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-fadeIn">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">
                      Mark all as read
                    </span>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${
                          notif.unread ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{notif.title}</p>
                            <p className="text-gray-500 text-xs mt-0.5">{notif.message}</p>
                          </div>
                          {notif.unread && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-gray-400 text-xs mt-1">{notif.time}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="px-4 py-2 border-t border-gray-100">
                  <button className="w-full text-center text-sm text-blue-600 font-medium hover:underline">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2 p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 bg-[#1F3A5F] rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">{admin?.name || 'Admin'}</p>
                <p className="text-xs text-gray-500">{admin?.role || 'Administrator'}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400 hidden md:block" />
            </button>

            {/* Profile Dropdown */}
            {showProfile && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-fadeIn">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="font-medium text-gray-900 text-sm">{admin?.name}</p>
                  <p className="text-gray-500 text-xs">{admin?.email}</p>
                </div>
                <div className="p-1">
                  <a
                    href="/admin/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-xl"
                  >
                    Profile Settings
                  </a>
                  <button onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}