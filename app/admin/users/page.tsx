'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import {
  UsersIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  ArrowLeftIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline'

interface User {
  id: number
  nickname: string
  email: string
  is_banned: boolean
  created_at: string
  claimed_key?: string
}

interface FilterState {
  status: 'all' | 'normal' | 'banned'
  search: string
}

export default function UsersManagement() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterState>({ status: 'all', search: '' })
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  useEffect(() => {
    // 检查管理员登录状态
    const adminData = localStorage.getItem('admin')
    if (!adminData) {
      router.push('/admin/login')
      return
    }
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      const result = await response.json()
      
      if (result.success) {
        setUsers(result.users)
      } else {
        toast.error('获取用户列表失败')
      }
    } catch (error) {
      toast.error('获取用户列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleBanToggle = async (userId: number, currentBanStatus: boolean) => {
    setActionLoading(userId)
    try {
      const response = await fetch('/api/admin/users/ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ban: !currentBanStatus })
      })
      
      const result = await response.json()
      if (result.success) {
        toast.success(currentBanStatus ? '用户已解封' : '用户已封禁')
        fetchUsers()
      } else {
        toast.error(result.error || '操作失败')
      }
    } catch (error) {
      toast.error('操作失败')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (userId: number) => {
    setActionLoading(userId)
    try {
      const response = await fetch('/api/admin/users/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })
      
      const result = await response.json()
      if (result.success) {
        toast.success('用户已删除')
        setShowDeleteModal(null)
        fetchUsers()
      } else {
        toast.error(result.error || '删除失败')
      }
    } catch (error) {
      toast.error('删除失败')
    } finally {
      setActionLoading(null)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesStatus = filter.status === 'all' || 
      (filter.status === 'banned' && user.is_banned) ||
      (filter.status === 'normal' && !user.is_banned)
    
    const matchesSearch = !filter.search || 
      user.nickname.toLowerCase().includes(filter.search.toLowerCase()) ||
      user.email.toLowerCase().includes(filter.search.toLowerCase()) ||
      user.id.toString().includes(filter.search)
    
    return matchesStatus && matchesSearch
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="flex items-center space-x-1 sm:space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeftIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">返回控制台</span>
              </button>
              <div className="h-4 sm:h-6 border-l border-gray-300"></div>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <UsersIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">用户管理</h1>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* 筛选和搜索 */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <select
                value={filter.status}
                onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value as FilterState['status'] }))}
                className="border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">全部用户</option>
                <option value="normal">正常用户</option>
                <option value="banned">已封禁用户</option>
              </select>
            </div>
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索用户名、邮箱或QQ号..."
                value={filter.search}
                onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600">
            共找到 {filteredUsers.length} 个用户
          </div>
        </div>

        {/* 用户列表 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    用户信息
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    密钥
                  </th>
                  <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    注册时间
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.nickname}</div>
                        <div className="text-xs sm:text-sm text-gray-500 truncate">{user.email}</div>
                        <div className="text-xs text-gray-400">ID: {user.id}</div>
                        {/* 在移动端显示密钥和注册时间 */}
                        <div className="sm:hidden mt-1 space-y-1">
                          <div className="text-xs text-gray-500">
                            密钥: {user.claimed_key ? (
                              <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">
                                {user.claimed_key.substring(0, 8)}...
                              </span>
                            ) : (
                              <span className="text-gray-400">未领取</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 md:hidden">
                            注册: {new Date(user.created_at).toLocaleDateString('zh-CN')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      {user.is_banned ? (
                        <span className="inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircleIcon className="w-3 h-3 mr-0.5 sm:mr-1" />
                          <span className="hidden sm:inline">已封禁</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircleIcon className="w-3 h-3 mr-0.5 sm:mr-1" />
                          <span className="hidden sm:inline">正常</span>
                        </span>
                      )}
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.claimed_key ? (
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                          {user.claimed_key}
                        </span>
                      ) : (
                        <span className="text-gray-400">未领取</span>
                      )}
                    </td>
                    <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-1 sm:space-x-2">
                        <button
                          onClick={() => handleBanToggle(user.id, user.is_banned)}
                          disabled={actionLoading === user.id}
                          className={`px-2 sm:px-3 py-1 rounded text-xs font-medium transition-colors ${
                            user.is_banned
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          } disabled:opacity-50`}
                        >
                          {actionLoading === user.id ? '处理中...' : (user.is_banned ? '解封' : '封禁')}
                        </button>
                        <button
                          onClick={() => setShowDeleteModal(user.id)}
                          disabled={actionLoading === user.id}
                          className="px-2 sm:px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition-colors disabled:opacity-50"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 sm:py-12">
              <UsersIcon className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">没有找到用户</h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-500">请尝试调整筛选条件</p>
            </div>
          )}
        </div>
      </div>

      {/* 删除确认弹窗 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 px-4">
          <div className="relative top-20 mx-auto p-4 sm:p-5 border w-full max-w-sm sm:max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <ExclamationTriangleIcon className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-red-500" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mt-3 sm:mt-4">危险操作！</h3>
              <div className="mt-2 px-2 sm:px-7 py-2 sm:py-3">
                <p className="text-xs sm:text-sm text-gray-500">
                  请确认是否真的要删除该用户？此操作不可恢复！
                </p>
              </div>
              <div className="flex justify-center space-x-3 sm:space-x-4 mt-4">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="px-3 sm:px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm"
                >
                  取消
                </button>
                <button
                  onClick={() => handleDelete(showDeleteModal)}
                  disabled={actionLoading === showDeleteModal}
                  className="px-3 sm:px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 text-sm"
                >
                  {actionLoading === showDeleteModal ? '删除中...' : '确认删除'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}