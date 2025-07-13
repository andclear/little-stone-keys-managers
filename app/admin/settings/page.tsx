'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { adminFetch } from '@/lib/utils'

interface Admin {
  id: number
  username: string
  created_at: string
}

interface SystemStats {
  totalUsers: number
  totalKeys: number
  totalContributors: number
  totalLogs: number
}

export default function SettingsPage() {
  const router = useRouter()
  const [admins, setAdmins] = useState<Admin[]>([])
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddAdminModal, setShowAddAdminModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const [showApiUrlModal, setShowApiUrlModal] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null)
  const [newAdmin, setNewAdmin] = useState({ username: '', password: '' })
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [apiBaseUrl, setApiBaseUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchAdmins()
    fetchStats()
    fetchApiBaseUrl()
  }, [])

  const fetchAdmins = async () => {
    try {
      // 添加时间戳防止缓存
      const timestamp = new Date().getTime()
      const response = await adminFetch(`/api/admin/settings/admins?t=${timestamp}`)
      const data = await response.json()
      
      if (data.success) {
        console.log('获取到管理员列表:', data.admins)
        setAdmins(data.admins)
      } else {
        console.error('获取管理员列表失败:', data.error)
        alert('获取管理员列表失败: ' + data.error)
      }
    } catch (error) {
      console.error('获取管理员列表失败:', error)
      alert('获取管理员列表失败')
    }
  }

  const fetchStats = async () => {
    try {
      const response = await adminFetch('/api/admin/dashboard/stats')
      const data = await response.json()
      
      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('获取统计信息失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchApiBaseUrl = async () => {
    try {
      const response = await adminFetch('/api/admin/settings/api-url')
      const data = await response.json()
      
      if (data.success) {
        setApiBaseUrl(data.apiBaseUrl)
      }
    } catch (error) {
      console.error('获取API基础URL失败:', error)
    }
  }

  const handleAddAdmin = async () => {
    if (!newAdmin.username.trim() || !newAdmin.password.trim()) {
      alert('用户名和密码不能为空')
      return
    }

    if (newAdmin.password.length < 6) {
      alert('密码长度不能少于6位')
      return
    }

    setSubmitting(true)
    try {
      const response = await adminFetch('/api/admin/settings/admins/add', {
        method: 'POST',
        body: JSON.stringify(newAdmin),
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('添加管理员成功')
        setShowAddAdminModal(false)
        setNewAdmin({ username: '', password: '' })
        // 延迟刷新确保数据库操作完成
        setTimeout(() => {
          fetchAdmins()
        }, 500)
      } else {
        alert('添加失败: ' + data.error)
      }
    } catch (error) {
      console.error('添加管理员失败:', error)
      alert('添加失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteAdmin = async () => {
    if (!selectedAdmin) return

    setSubmitting(true)
    try {
      const response = await adminFetch('/api/admin/settings/admins/delete', {
        method: 'DELETE',
        body: JSON.stringify({ id: selectedAdmin.id }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('删除管理员成功')
        setShowDeleteModal(false)
        setSelectedAdmin(null)
        // 延迟刷新确保数据库操作完成
        setTimeout(() => {
          fetchAdmins()
        }, 500)
      } else {
        alert('删除失败: ' + data.error)
      }
    } catch (error) {
      console.error('删除管理员失败:', error)
      alert('删除失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      alert('所有密码字段都不能为空')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('新密码和确认密码不匹配')
      return
    }

    if (passwordData.newPassword.length < 6) {
      alert('新密码长度不能少于6位')
      return
    }

    setSubmitting(true)
    try {
      const response = await adminFetch('/api/admin/settings/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('密码修改成功')
        setShowChangePasswordModal(false)
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        alert('密码修改失败: ' + data.error)
      }
    } catch (error) {
      console.error('密码修改失败:', error)
      alert('密码修改失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateApiUrl = async () => {
    if (!apiBaseUrl.trim()) {
      alert('API调用地址不能为空')
      return
    }

    // 简单的URL格式验证
    try {
      new URL(apiBaseUrl)
    } catch {
      alert('请输入有效的URL格式')
      return
    }

    setSubmitting(true)
    try {
      const response = await adminFetch('/api/admin/settings/api-url', {
        method: 'PUT',
        body: JSON.stringify({ apiBaseUrl }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('API调用地址更新成功')
        setShowApiUrlModal(false)
      } else {
        alert('更新失败: ' + data.error)
      }
    } catch (error) {
      console.error('更新API调用地址失败:', error)
      alert('更新失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/admin/dashboard" className="text-blue-600 hover:text-blue-800">
                ← 返回仪表板
              </Link>
              <h1 className="ml-4 text-xl font-semibold text-gray-900">系统设置</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* 系统统计 */}
        {stats && (
          <div className="mb-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">系统概览</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
                <div className="text-gray-600">总用户数</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.totalKeys}</div>
                <div className="text-gray-600">总密钥数</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stats.totalContributors}</div>
                <div className="text-gray-600">贡献者数</div>
              </div>
            </div>
            
            {/* API调用地址设置 */}
            <div className="border-t pt-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                <div className="flex-1">
                  <h3 className="text-md font-medium text-gray-900">API调用地址</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    当前地址: <code className="bg-gray-100 px-2 py-1 rounded text-xs sm:text-sm break-all">{apiBaseUrl || '未设置'}</code>
                  </p>
                </div>
                <button
                  onClick={() => setShowApiUrlModal(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors w-full sm:w-auto"
                >
                  修改地址
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 管理员管理 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
              <h2 className="text-lg font-medium text-gray-900">管理员账户管理</h2>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => setShowChangePasswordModal(true)}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors w-full sm:w-auto"
                >
                  修改密码
                </button>
                <button
                  onClick={() => setShowAddAdminModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
                >
                  添加管理员
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    用户名
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    创建时间
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-medium text-gray-900">#{admin.id}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="text-xs sm:text-sm font-medium text-gray-900">{admin.username}</div>
                        <div className="md:hidden text-xs text-gray-500">
                          {new Date(admin.created_at).toLocaleString('zh-CN')}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-xs sm:text-sm text-gray-900">
                        {new Date(admin.created_at).toLocaleString('zh-CN')}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                      {admins.length > 1 && (
                        <button
                          onClick={() => {
                            setSelectedAdmin(admin)
                            setShowDeleteModal(true)
                          }}
                          className="text-red-600 hover:text-red-900 px-2 py-1 rounded"
                        >
                          删除
                        </button>
                      )}
                      {admins.length === 1 && (
                        <span className="text-gray-400 text-xs">最后管理员</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 添加管理员模态框 */}
      {showAddAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">添加管理员</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  用户名 *
                </label>
                <input
                  type="text"
                  value={newAdmin.username}
                  onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="请输入用户名"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  密码 *
                </label>
                <input
                  type="password"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="请输入密码（至少6位）"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddAdminModal(false)
                  setNewAdmin({ username: '', password: '' })
                }}
                className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors text-sm"
                disabled={submitting}
              >
                取消
              </button>
              <button
                onClick={handleAddAdmin}
                disabled={submitting}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
              >
                {submitting ? '添加中...' : '添加'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认模态框 */}
      {showDeleteModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">确认删除</h3>
            <p className="text-gray-600 mb-6 text-sm sm:text-base">
              确定要删除管理员 <span className="font-medium">{selectedAdmin.username}</span> 吗？
              <br />
              此操作不可撤销。
            </p>
            
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedAdmin(null)
                }}
                className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors text-sm"
                disabled={submitting}
              >
                取消
              </button>
              <button
                onClick={handleDeleteAdmin}
                disabled={submitting}
                className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 text-sm"
              >
                {submitting ? '删除中...' : '删除'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 修改密码模态框 */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">修改密码</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  当前密码 *
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="请输入当前密码"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  新密码 *
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="请输入新密码（至少6位）"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  确认新密码 *
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="请再次输入新密码"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowChangePasswordModal(false)
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
                }}
                className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors text-sm"
                disabled={submitting}
              >
                取消
              </button>
              <button
                onClick={handleChangePassword}
                disabled={submitting}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
              >
                {submitting ? '修改中...' : '修改密码'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 修改API调用地址模态框 */}
      {showApiUrlModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">修改API调用地址</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API调用地址 *
                </label>
                <input
                  type="text"
                  value={apiBaseUrl}
                  onChange={(e) => setApiBaseUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="例如: https://api.xiaoshizi.com/v1"
                />
                <p className="mt-2 text-xs text-gray-500">
                  请输入完整的API调用地址，包括协议和路径
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowApiUrlModal(false)
                  fetchApiBaseUrl() // 重新获取原始值
                }}
                className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors text-sm"
                disabled={submitting}
              >
                取消
              </button>
              <button
                onClick={handleUpdateApiUrl}
                disabled={submitting}
                className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 text-sm"
              >
                {submitting ? '更新中...' : '更新地址'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}