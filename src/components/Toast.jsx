import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

const ToastContext = createContext(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

const TOAST_STYLES = {
  success: {
    bg: 'bg-green-50 border-green-200',
    icon: <CheckCircle className="w-5 h-5 text-green-600" />,
    text: 'text-green-800'
  },
  error: {
    bg: 'bg-red-50 border-red-200',
    icon: <AlertCircle className="w-5 h-5 text-red-600" />,
    text: 'text-red-800'
  },
  info: {
    bg: 'bg-blue-50 border-blue-200',
    icon: <Info className="w-5 h-5 text-blue-600" />,
    text: 'text-blue-800'
  }
}

function Toast({ id, message, type, onClose }) {
  const style = TOAST_STYLES[type] || TOAST_STYLES.info

  useEffect(() => {
    const timer = setTimeout(() => onClose(id), 4000)
    return () => clearTimeout(timer)
  }, [id, onClose])

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg animate-fadeIn ${style.bg}`}>
      {style.icon}
      <p className={`text-sm font-medium flex-1 ${style.text}`}>{message}</p>
      <button onClick={() => onClose(id)} className="p-1 hover:opacity-70 transition-opacity">
        <X className={`w-4 h-4 ${style.text}`} />
      </button>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback({
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    info: (msg) => addToast(msg, 'info'),
  }, [addToast])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-80">
        {toasts.map(t => (
          <Toast key={t.id} id={t.id} message={t.message} type={t.type} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}