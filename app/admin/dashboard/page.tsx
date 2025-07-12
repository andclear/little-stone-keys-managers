'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { adminFetch } from '@/lib/utils'
import {
  UsersIcon,
  KeyIcon,
  TrophyIcon,
  ClipboardDocumentListIcon,
  ListBulletIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

interface Admin {
  id: number
  username: string
  created_at: string
}

interface DashboardStats {
  totalUsers: number
  bannedUsers: number
  totalKeys: number
  unclaimedKeys: number
  claimedKeys: number
  voidKeys: number
  totalContributors: number
  totalLikes: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 检查管理员登录状态
    const adminData = localStorage.getItem('admin')
    if (!adminData) {
      router.push('/admin/login')
      return
    }

    try {
      const parsedAdmin = JSON.parse(adminData)
      setAdmin(parsedAdmin)
      fetchDashboardStats()
    } catch (error) {
      console.error('Invalid admin data:', error)
      router.push('/admin/login')
    }
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await adminFetch('/api/admin/dashboard/stats')
      const result = await response.json()
      
      if (result.success) {
        setStats(result.stats)
      } else {
        toast.error('获取统计数据失败')
      }
    } catch (error) {
      toast.error('获取统计数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin')
    toast.success('已退出登录')
    router.push('/admin/login')
  }

  const navigateTo = (path: string) => {
    router.push(path)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 sm:h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Cog6ToothIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                  管理后台
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">
                欢迎，{admin?.username}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-2 text-gray-600 hover:text-red-600 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                <span className="text-sm sm:text-base">退出</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* 统计卡片 */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-white rounded-lg shadow p-3 sm:p-6">
              <div className="flex items-center">
                <div className="p-1 sm:p-2 bg-blue-100 rounded-lg">
                  <UsersIcon className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div className="ml-2 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">总用户数</p>
                  <p className="text-lg sm:text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
                </div>
              </div>
              {stats.bannedUsers > 0 && (
                <div className="mt-1 sm:mt-2 flex items-center text-xs sm:text-sm text-red-600">
                  <ExclamationTriangleIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  {stats.bannedUsers} 个被封禁
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-3 sm:p-6">
              <div className="flex items-center">
                <div className="p-1 sm:p-2 bg-green-100 rounded-lg">
                  <KeyIcon className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <div className="ml-2 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">密钥总数</p>
                  <p className="text-lg sm:text-2xl font-semibold text-gray-900">{stats.totalKeys}</p>
                </div>
              </div>
              <div className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">
                未领取: {stats.unclaimedKeys} | 已领取: {stats.claimedKeys} | 失效: {stats.voidKeys}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-3 sm:p-6">
              <div className="flex items-center">
                <div className="p-1 sm:p-2 bg-purple-100 rounded-lg">
                  <TrophyIcon className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" />
                </div>
                <div className="ml-2 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">贡献者</p>
                  <p className="text-lg sm:text-2xl font-semibold text-gray-900">{stats.totalContributors}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-3 sm:p-6">
              <div className="flex items-center">
                <div className="p-1 sm:p-2 bg-red-100 rounded-lg">
                  <ChartBarIcon className="w-4 h-4 sm:w-6 sm:h-6 text-red-600" />
                </div>
                <div className="ml-2 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">总点赞数</p>
                  <p className="text-lg sm:text-2xl font-semibold text-gray-900">{stats.totalLikes}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 功能菜单 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          <div
            onClick={() => navigateTo('/admin/users')}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-4 sm:p-6 group"
          >
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <UsersIcon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">用户管理</h3>
                <p className="text-sm sm:text-base text-gray-600">管理用户账户、封禁状态</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => navigateTo('/admin/keys')}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-4 sm:p-6 group"
          >
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="p-2 sm:p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                <KeyIcon className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">密钥管理</h3>
                <p className="text-sm sm:text-base text-gray-600">添加、查看密钥状态</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => navigateTo('/admin/contributors')}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-4 sm:p-6 group"
          >
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="p-2 sm:p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <TrophyIcon className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">贡献排行榜</h3>
                <p className="text-sm sm:text-base text-gray-600">管理贡献者信息</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => navigateTo('/admin/whitelist')}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-4 sm:p-6 group"
          >
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="p-2 sm:p-3 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition-colors">
                <ListBulletIcon className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">白名单管理</h3>
                <p className="text-sm sm:text-base text-gray-600">管理白名单、对比工具</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => navigateTo('/admin/logs')}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-4 sm:p-6 group"
          >
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="p-2 sm:p-3 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                <ClipboardDocumentListIcon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">操作日志</h3>
                <p className="text-sm sm:text-base text-gray-600">查看系统操作记录</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => navigateTo('/admin/settings')}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-4 sm:p-6 group"
          >
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="p-2 sm:p-3 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                <Cog6ToothIcon className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">系统设置</h3>
                <p className="text-sm sm:text-base text-gray-600">管理员账户、系统配置</p>
              </div>
            </div>
          </div>
        </div>


      </div>
    </div>
  )
}