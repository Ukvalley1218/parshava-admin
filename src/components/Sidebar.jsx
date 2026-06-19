import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, UserCircle, FileText, ShoppingBag,
  Package, BarChart3, Settings, LogOut, ChevronLeft, ChevronRight, X, Menu, Tag,
  FolderTree, FolderOpen, Layers, Mail, Briefcase, Award,
  BracesIcon
} from 'lucide-react'
import { useState } from 'react'
import { useAdminAuth } from '../context/AdminAuthContext'

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/admin/users', label: 'Sales Users', icon: Users },
  { path: '/admin/firms', label: 'Firms', icon: UserCircle },
  { path: '/admin/contacts', label: 'Contacts', icon: Mail },
  { path: '/admin/inquiries', label: 'Inquiries', icon: FileText },
  { path: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { path: '/admin/products', label: 'Products', icon: Package },
  { path: '/admin/brands', label: 'Brands', icon: Tag },
  { path: '/admin/categories', label: 'Categories', icon: FolderTree },
  { path: '/admin/subcategories', label: 'Subcategories', icon: FolderOpen },
  { path: '/admin/series', label: 'Series', icon: Layers },
  { path: '/admin/business-categories', label: 'Business Categories', icon: Briefcase },
  { path: '/admin/brand-categories', label: 'Brand Categories', icon: BracesIcon },
  // { path: '/admin/reports', label: 'Reports', icon: BarChart3 },
  // { path: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ isOpen, onClose, isMobile, collapsed = false, onCollapsedChange }) {
  const { logout, admin } = useAdminAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  const toggleCollapsed = () => {
    if (onCollapsedChange) {
      onCollapsedChange(!collapsed)
    }
  }

  // Mobile sidebar (drawer)
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />
        )}

        {/* Mobile Sidebar */}
        <aside
          className={`fixed left-0 top-0 h-screen w-64 bg-[#1F3A5F] flex flex-col z-50 transform transition-transform duration-300 lg:hidden ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Logo */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-[#1F3A5F] font-bold text-lg">P</span>
              </div>
              <div className="overflow-hidden">
                <h1 className="text-white font-bold text-lg leading-tight">Paarshva</h1>
                <p className="text-gray-400 text-xs">Admin Panel</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-hide">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                onClick={onClose}
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* User Section */}
          <div className="p-3 border-t border-white/10">
            {admin && (
              <div className="mb-3 px-2">
                <p className="text-white text-sm font-medium truncate">{admin.name}</p>
                <p className="text-gray-400 text-xs truncate">{admin.email}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="nav-item nav-item-inactive w-full"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </aside>
      </>
    )
  }

  // Desktop sidebar (fixed)
  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-[#1F3A5F] flex flex-col transition-all duration-300 z-40 hidden lg:flex ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-[#1F3A5F] font-bold text-lg">P</span>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-white font-bold text-lg leading-tight">Admin Panel</h1>
              {/* <p className="text-gray-400 text-xs">Admin Panel</p> */}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'} ${
                collapsed ? 'justify-center px-3' : ''
              }`
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User Section */}
      <div className="p-3 border-t border-white/10">
        {!collapsed && admin && (
          <div className="mb-3 px-2">
            <p className="text-white text-sm font-medium truncate">{admin.name}</p>
            <p className="text-gray-400 text-xs truncate">{admin.email}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`nav-item nav-item-inactive w-full ${collapsed ? 'justify-center px-3' : ''}`}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Collapse Button */}
      <button
        onClick={toggleCollapsed}
        className="absolute -right-3 top-20 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center border border-gray-200 hover:bg-gray-50 transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4 text-gray-600" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        )}
      </button>
    </aside>
  )
}