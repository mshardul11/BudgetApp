import React, { useState, useEffect } from 'react'
import { useBudget } from '../context/BudgetContext'
import { useAuth } from '../context/AuthContext'

interface SyncStatusProps {
  className?: string
}

export const SyncStatus: React.FC<SyncStatusProps> = ({ className = '' }) => {
  const { getOnlineStatus, forceSync } = useBudget()
  const { currentUser } = useAuth()
  const [isOnline, setIsOnline] = useState(getOnlineStatus())
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

  useEffect(() => {
    const checkOnlineStatus = () => {
      setIsOnline(getOnlineStatus())
    }

    // Check online status periodically
    const interval = setInterval(checkOnlineStatus, 5000)
    
    // Listen for online/offline events
    window.addEventListener('online', checkOnlineStatus)
    window.addEventListener('offline', checkOnlineStatus)

    return () => {
      clearInterval(interval)
      window.removeEventListener('online', checkOnlineStatus)
      window.removeEventListener('offline', checkOnlineStatus)
    }
  }, [getOnlineStatus])

  useEffect(() => {
    // Get last sync time from localStorage
    const syncTimestamp = localStorage.getItem('budget-app-sync-timestamp')
    if (syncTimestamp) {
      setLastSyncTime(new Date(parseInt(syncTimestamp)))
    }
  }, [])

  const handleForceSync = async () => {
    if (!currentUser || isSyncing) return

    setIsSyncing(true)
    try {
      await forceSync()
      setLastSyncTime(new Date())
    } catch (error) {
      console.error('Force sync failed:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  const formatLastSync = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    
    const days = Math.floor(hours / 24)
    return `${days} day${days > 1 ? 's' : ''} ago`
  }

  if (!currentUser) {
    return null // Don't show sync status for non-authenticated users
  }

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      {/* Online/Offline Status */}
      <div className="flex items-center gap-1">
        <div 
          className={`w-2 h-2 rounded-full ${
            isOnline ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        <span className={isOnline ? 'text-green-700' : 'text-red-700'}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      {/* Sync Status */}
      <div className="flex items-center gap-1">
        {isSyncing ? (
          <>
            <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-blue-700">Syncing...</span>
          </>
        ) : (
          <>
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <span className="text-gray-600">Synced</span>
          </>
        )}
      </div>

      {/* Last Sync Time */}
      {lastSyncTime && (
        <span className="text-gray-500 text-xs">
          {formatLastSync(lastSyncTime)}
        </span>
      )}

      {/* Force Sync Button */}
      <button
        onClick={handleForceSync}
        disabled={!isOnline || isSyncing}
        className={`px-2 py-1 text-xs rounded ${
          isOnline && !isSyncing
            ? 'bg-blue-500 text-white hover:bg-blue-600'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        } transition-colors`}
        title="Force sync with server"
      >
        {isSyncing ? 'Syncing...' : 'Sync'}
      </button>
    </div>
  )
} 