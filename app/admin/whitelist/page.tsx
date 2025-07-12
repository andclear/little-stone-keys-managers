'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { adminFetch } from '@/lib/utils'

// 用户明确要求：白名单页面只显示QQ号和创建时间，不需要其他任何字段
// 不要添加id或其他数据库字段，只保留qq_number和created_at
interface WhitelistUser {
  qq_number: number
  created_at: string
}

export default function WhitelistPage() {
  const router = useRouter()
  const [whitelistUsers, setWhitelistUsers] = useState<WhitelistUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showBatchAddModal, setShowBatchAddModal] = useState(false)
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false)
  const [showCompareModal, setShowCompareModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<WhitelistUser | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]) // 存储qq_number而不是id
  const [newQQ, setNewQQ] = useState('')
  const [batchQQs, setBatchQQs] = useState('')
  const [batchDeleteQQs, setBatchDeleteQQs] = useState('')
  const [compareQQs, setCompareQQs] = useState('')
  const [compareResult, setCompareResult] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchWhitelistUsers()
  }, [])

  // 监听 whitelistUsers 状态变化
  useEffect(() => {
    console.log('🔍 [DEBUG] whitelistUsers 状态已更新，当前长度:', whitelistUsers.length)
    console.log('🔍 [DEBUG] whitelistUsers 内容:', whitelistUsers)
  }, [whitelistUsers])

  const fetchWhitelistUsers = async () => {
    try {
      console.log('🔍 [DEBUG] 开始获取白名单数据...')
      const timestamp = Date.now()
      const url = `/api/admin/whitelist?t=${timestamp}`
      console.log('🔍 [DEBUG] 请求URL:', url)
      
      const startTime = performance.now()
      const response = await adminFetch(url)
      const endTime = performance.now()
      console.log(`🔍 [DEBUG] API请求耗时: ${(endTime - startTime).toFixed(2)}ms`)
      console.log('🔍 [DEBUG] 响应状态:', response.status, response.statusText)
      
      const data = await response.json()
      console.log('🔍 [DEBUG] 响应数据:', data)
      
      if (data.success) {
        console.log('🔍 [DEBUG] 成功获取白名单用户数量:', data.users?.length || 0)
        setWhitelistUsers(data.users)
        console.log('🔍 [DEBUG] 状态更新后，当前whitelistUsers长度应该是:', data.users?.length || 0)
      } else {
        console.error('🔍 [DEBUG] 获取白名单失败:', data.error)
        toast.error('获取白名单失败: ' + data.error)
      }
    } catch (error) {
      console.error('🔍 [DEBUG] 获取白名单异常:', error)
      toast.error('获取白名单失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async () => {
    console.log('🔍 [DEBUG] 开始添加用户，QQ号:', newQQ)
    
    if (!newQQ.trim()) {
      console.log('🔍 [DEBUG] QQ号为空')
      toast.error('QQ号不能为空')
      return
    }

    // 验证QQ号格式
    if (!/^[1-9][0-9]{4,10}$/.test(newQQ)) {
      console.log('🔍 [DEBUG] QQ号格式无效:', newQQ)
      toast.error('请输入有效的QQ号')
      return
    }

    setSubmitting(true)
    try {
      console.log('🔍 [DEBUG] 发送添加请求...')
      const startTime = performance.now()
      
      const response = await adminFetch('/api/admin/whitelist/add', {
        method: 'POST',
        body: JSON.stringify({ 
          qq: newQQ 
        }),
      })
      
      const endTime = performance.now()
      console.log(`🔍 [DEBUG] 添加API请求耗时: ${(endTime - startTime).toFixed(2)}ms`)
      console.log('🔍 [DEBUG] 添加响应状态:', response.status, response.statusText)
      
      const data = await response.json()
      console.log('🔍 [DEBUG] 添加响应数据:', data)
      
      if (data.success) {
        console.log('🔍 [DEBUG] 添加成功，准备刷新列表')
        toast.success('添加白名单用户成功')
        setShowAddModal(false)
        setNewQQ('')
        await fetchWhitelistUsers()
        console.log('🔍 [DEBUG] 列表刷新完成')
      } else {
        console.error('🔍 [DEBUG] 添加失败:', data.error)
        toast.error('添加失败: ' + data.error)
      }
    } catch (error) {
      console.error('🔍 [DEBUG] 添加异常:', error)
      toast.error('添加失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleBatchAddUsers = async () => {
    console.log('🔍 [DEBUG] 开始批量添加用户')
    
    if (!batchQQs.trim()) {
      console.log('🔍 [DEBUG] 批量QQ号列表为空')
      toast.error('请输入QQ号列表')
      return
    }

    const qqList = batchQQs.split('\n').map(qq => qq.trim()).filter(qq => qq)
    console.log('🔍 [DEBUG] 解析的QQ号列表:', qqList)
    
    const invalidQQs = qqList.filter(qq => !/^[1-9][0-9]{4,10}$/.test(qq))
    console.log('🔍 [DEBUG] 无效QQ号:', invalidQQs)
    
    if (invalidQQs.length > 0) {
      console.log('🔍 [DEBUG] 存在无效QQ号，停止操作')
      toast.error(`以下QQ号格式无效：${invalidQQs.join(', ')}`)
      return
    }

    setSubmitting(true)
    try {
      console.log('🔍 [DEBUG] 发送批量添加请求...')
      const startTime = performance.now()
      
      const response = await adminFetch('/api/admin/whitelist/batch-add', {
        method: 'POST',
        body: JSON.stringify({ qqList }),
      })
      
      const endTime = performance.now()
      console.log(`🔍 [DEBUG] 批量添加API请求耗时: ${(endTime - startTime).toFixed(2)}ms`)
      console.log('🔍 [DEBUG] 批量添加响应状态:', response.status, response.statusText)
      
      const data = await response.json()
      console.log('🔍 [DEBUG] 批量添加响应数据:', data)
      
      if (data.success) {
        console.log('🔍 [DEBUG] 批量添加成功，准备刷新列表')
        let message = `成功添加 ${data.addedCount} 个用户到白名单`
        
        if (data.duplicateQQs && data.duplicateQQs.length > 0) {
          message += `\n跳过 ${data.duplicateQQs.length} 个重复QQ号: ${data.duplicateQQs.join(', ')}`
        }
        
        if (data.invalidQQs && data.invalidQQs.length > 0) {
          message += `\n跳过 ${data.invalidQQs.length} 个无效QQ号: ${data.invalidQQs.join(', ')}`
        }
        
        toast.success(message)
        setShowBatchAddModal(false)
        setBatchQQs('')
        await fetchWhitelistUsers()
        console.log('🔍 [DEBUG] 批量添加后列表刷新完成')
      } else {
        console.error('🔍 [DEBUG] 批量添加失败:', data.error)
        let errorMessage = '批量添加失败: ' + data.error
        
        if (data.duplicateQQs && data.duplicateQQs.length > 0) {
          errorMessage += `\n重复QQ号: ${data.duplicateQQs.join(', ')}`
        }
        
        if (data.invalidQQs && data.invalidQQs.length > 0) {
          errorMessage += `\n无效QQ号: ${data.invalidQQs.join(', ')}`
        }
        
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error('🔍 [DEBUG] 批量添加异常:', error)
      toast.error('批量添加失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCompareUsers = async () => {
    if (!compareQQs.trim()) {
      toast.error('请输入要对比的QQ号列表')
      return
    }

    const qqList = compareQQs.split('\n').map(qq => qq.trim()).filter(qq => qq)
    const invalidQQs = qqList.filter(qq => !/^[1-9][0-9]{4,10}$/.test(qq))
    
    if (invalidQQs.length > 0) {
      toast.error(`以下QQ号格式无效：${invalidQQs.join(', ')}`)
      return
    }

    setSubmitting(true)
    try {
      const response = await adminFetch('/api/admin/whitelist/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qqList }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setCompareResult(data.result)
      } else {
        toast.error('对比失败: ' + data.error)
      }
    } catch (error) {
      console.error('对比失败:', error)
      toast.error('对比失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) {
      console.log('🔍 [DEBUG] 没有选中的用户')
      return
    }

    console.log('🔍 [DEBUG] 开始删除用户，QQ号:', selectedUser.qq_number)
    setSubmitting(true)
    
    try {
      console.log('🔍 [DEBUG] 发送删除请求...')
      const startTime = performance.now()
      
      const response = await adminFetch('/api/admin/whitelist/delete', {
        method: 'DELETE',
        body: JSON.stringify({ qq_number: selectedUser.qq_number }),
      })
      
      const endTime = performance.now()
      console.log(`🔍 [DEBUG] 删除API请求耗时: ${(endTime - startTime).toFixed(2)}ms`)
      console.log('🔍 [DEBUG] 删除响应状态:', response.status, response.statusText)
      
      const data = await response.json()
      console.log('🔍 [DEBUG] 删除响应数据:', data)
      
      if (data.success) {
        console.log('🔍 [DEBUG] 删除成功，准备刷新列表')
        toast.success('删除白名单用户成功')
        setShowDeleteModal(false)
        setSelectedUser(null)
        await fetchWhitelistUsers()
        console.log('🔍 [DEBUG] 删除后列表刷新完成')
      } else {
        console.error('🔍 [DEBUG] 删除失败:', data.error)
        toast.error('删除失败: ' + data.error)
      }
    } catch (error) {
      console.error('🔍 [DEBUG] 删除异常:', error)
      toast.error('删除失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleBatchDeleteSelected = async () => {
    console.log('🔍 [DEBUG] 开始批量删除选中用户，数量:', selectedUsers.length)
    console.log('🔍 [DEBUG] 选中的QQ号列表:', selectedUsers)
    
    if (selectedUsers.length === 0) {
      console.log('🔍 [DEBUG] 没有选中任何用户')
      toast.error('请选择要删除的用户')
      return
    }

    if (!confirm(`确定要删除选中的 ${selectedUsers.length} 个用户吗？此操作不可撤销。`)) {
      console.log('🔍 [DEBUG] 用户取消了批量删除操作')
      return
    }

    setSubmitting(true)
    try {
      console.log('🔍 [DEBUG] 发送批量删除请求...')
      const startTime = performance.now()
      
      const response = await adminFetch('/api/admin/whitelist/batch-delete', {
        method: 'DELETE',
        body: JSON.stringify({ qqList: selectedUsers }),
      })
      
      const endTime = performance.now()
      console.log(`🔍 [DEBUG] 批量删除API请求耗时: ${(endTime - startTime).toFixed(2)}ms`)
      console.log('🔍 [DEBUG] 批量删除响应状态:', response.status, response.statusText)
      
      const data = await response.json()
      console.log('🔍 [DEBUG] 批量删除响应数据:', data)
      
      if (data.success) {
        console.log('🔍 [DEBUG] 批量删除成功，准备刷新列表')
        toast.success(`成功删除 ${data.deletedCount} 个白名单用户`)
        setSelectedUsers([])
        await fetchWhitelistUsers()
        console.log('🔍 [DEBUG] 批量删除后列表刷新完成')
      } else {
        console.error('🔍 [DEBUG] 批量删除失败:', data.error)
        toast.error('批量删除失败: ' + data.error)
      }
    } catch (error) {
      console.error('🔍 [DEBUG] 批量删除异常:', error)
      toast.error('批量删除失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleBatchDeleteByQQ = async () => {
    if (!batchDeleteQQs.trim()) {
      toast.error('请输入要删除的QQ号列表')
      return
    }

    const qqList = batchDeleteQQs.split('\n').map(qq => qq.trim()).filter(qq => qq)
    const invalidQQs = qqList.filter(qq => !/^[1-9][0-9]{4,10}$/.test(qq))
    
    if (invalidQQs.length > 0) {
      toast.error(`以下QQ号格式无效：${invalidQQs.join(', ')}`)
      return
    }

    if (!confirm(`确定要删除 ${qqList.length} 个QQ号吗？此操作不可撤销。`)) {
      return
    }

    setSubmitting(true)
    try {
      const response = await adminFetch('/api/admin/whitelist/batch-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qqList }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success(`成功删除 ${data.deletedCount} 个白名单用户`)
        setShowBatchDeleteModal(false)
        setBatchDeleteQQs('')
        fetchWhitelistUsers()
      } else {
        toast.error('批量删除失败: ' + data.error)
      }
    } catch (error) {
      console.error('批量删除失败:', error)
      toast.error('批量删除失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSelectUser = (qqNumber: number) => {
    if (!qqNumber) return
    setSelectedUsers(prev => 
      prev.includes(qqNumber) 
        ? prev.filter(qq => qq !== qqNumber)
        : [...prev, qqNumber]
    )
  }

  const handleSelectAll = () => {
    const filteredQQNumbers = filteredUsers.map(user => user.qq_number)
    
    const allFilteredSelected = filteredQQNumbers.length > 0 && filteredQQNumbers.every(qq => selectedUsers.includes(qq))
    
    if (allFilteredSelected) {
      // 取消选择当前过滤的用户
      setSelectedUsers(prev => prev.filter(qq => !filteredQQNumbers.includes(qq)))
    } else {
      // 选择当前过滤的所有用户
      setSelectedUsers(prev => {
        const newSelected = [...prev]
        filteredQQNumbers.forEach(qq => {
          if (!newSelected.includes(qq)) {
            newSelected.push(qq)
          }
        })
        return newSelected
      })
    }
  }

  const filteredUsers = whitelistUsers.filter(user =>
    user.qq_number.toString().includes(searchTerm)
  )

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
              <h1 className="ml-4 text-xl font-semibold text-gray-900">白名单管理</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* 统计信息 */}
        <div className="mb-6 bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{whitelistUsers.length}</div>
            <div className="text-gray-600">总白名单用户</div>
          </div>
        </div>

        {/* 操作栏 */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="搜索QQ号..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              添加QQ号
            </button>
            <button
              onClick={() => setShowBatchAddModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              批量添加
            </button>
            <button
              onClick={() => setShowBatchDeleteModal(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              批量删除
            </button>
            <button
              onClick={() => setShowCompareModal(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              对比功能
            </button>
            {selectedUsers.length > 0 && (
              <button
                onClick={handleBatchDeleteSelected}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                disabled={submitting}
              >
                删除选中 ({selectedUsers.length})
              </button>
            )}
          </div>
        </div>

        {/* 白名单列表 */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={filteredUsers.length > 0 && filteredUsers.every(user => selectedUsers.includes(user.qq_number))}
                      onChange={(e) => {
                        e.stopPropagation()
                        handleSelectAll()
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    QQ号
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    添加时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user, index) => (
                  <tr key={user.qq_number || `user-${index}`} className={`hover:bg-gray-50 ${selectedUsers.includes(user.qq_number) ? 'bg-blue-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.qq_number)}
                        onChange={(e) => {
                          e.stopPropagation()
                          handleSelectUser(user.qq_number)
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.qq_number}</div>
                      </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(user.created_at).toLocaleString('zh-CN')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedUser(user)
                          setShowDeleteModal(true)
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">暂无白名单用户</div>
            </div>
          )}
        </div>
      </div>

      {/* 添加用户模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">添加QQ号到白名单</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  QQ号 *
                </label>
                <input
                  type="text"
                  value={newQQ}
                  onChange={(e) => setNewQQ(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入QQ号"
                />
                <p className="text-sm text-gray-500 mt-1">系统将自动生成对应的QQ邮箱</p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setNewQQ('')
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                disabled={submitting}
              >
                取消
              </button>
              <button
                onClick={handleAddUser}
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {submitting ? '添加中...' : '添加'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 批量添加模态框 */}
      {showBatchAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">批量添加QQ号到白名单</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  QQ号列表 *
                </label>
                <textarea
                  value={batchQQs}
                  onChange={(e) => setBatchQQs(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入QQ号，每行一个\n例如：\n123456789\n987654321\n555666777"
                  rows={8}
                />
                <p className="text-sm text-gray-500 mt-1">每行输入一个QQ号，系统将自动生成对应的QQ邮箱</p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowBatchAddModal(false)
                  setBatchQQs('')
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                disabled={submitting}
              >
                取消
              </button>
              <button
                onClick={handleBatchAddUsers}
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {submitting ? '批量添加中...' : '批量添加'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 对比功能模态框 */}
      {showCompareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">QQ号白名单对比</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  待对比的QQ号列表 *
                </label>
                <textarea
                  value={compareQQs}
                  onChange={(e) => setCompareQQs(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入QQ号，每行一个\n例如：\n123456789\n987654321\n555666777"
                  rows={12}
                />
                <p className="text-sm text-gray-500 mt-1">每行输入一个QQ号</p>
                
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleCompareUsers}
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {submitting ? '对比中...' : '开始对比'}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  对比结果
                </label>
                <div className="border border-gray-300 rounded-md p-3 h-96 overflow-y-auto bg-gray-50">
                  {compareResult ? (
                    <div className="space-y-4">
                      {/* 统计摘要 */}
                      {compareResult.summary && (
                        <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                          <h4 className="font-medium text-blue-800 mb-2">📊 对比统计</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
                            {[
                              { key: 'totalProvided', label: '提供列表', value: compareResult.summary.totalProvided },
                              { key: 'totalInWhitelist', label: '白名单总数', value: compareResult.summary.totalInWhitelist },
                              { key: 'matchCount', label: '匹配数量', value: compareResult.summary.matchCount },
                              { key: 'missingFromWhitelist', label: '缺失数量', value: compareResult.summary.missingFromWhitelist },
                              { key: 'extraInWhitelist', label: '多余数量', value: compareResult.summary.extraInWhitelist },
                              { key: 'invalid', label: '无效格式', value: compareResult.invalid.length }
                            ].map(item => (
                              <div key={item.key}>{item.label}: {item.value}个</div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {compareResult.inWhitelist.length > 0 && (
                        <div>
                          <h4 className="font-medium text-green-700 mb-2">✓ 已在白名单中 ({compareResult.inWhitelist.length}个)</h4>
                          <div className="text-sm text-green-600 space-y-1 max-h-32 overflow-y-auto">
                             {compareResult.inWhitelist.map((qq: string, index: number) => (
                               <div key={`in-whitelist-${qq}-${index}`} className="bg-green-50 px-2 py-1 rounded">{qq}</div>
                             ))}
                           </div>
                        </div>
                      )}
                      
                      {compareResult.notInWhitelist.length > 0 && (
                        <div>
                          <h4 className="font-medium text-blue-700 mb-2">? 可能新增成员 ({compareResult.notInWhitelist.length}个)</h4>
                          <div className="text-sm text-blue-600 space-y-1 max-h-32 overflow-y-auto">
                             {compareResult.notInWhitelist.map((qq: string, index: number) => (
                               <div key={`not-in-whitelist-${qq}-${index}`} className="bg-blue-50 px-2 py-1 rounded">{qq}</div>
                             ))}
                           </div>
                        </div>
                      )}
                      
                      {compareResult.inWhitelistButNotInList && compareResult.inWhitelistButNotInList.length > 0 && (
                        <div>
                          <h4 className="font-medium text-red-700 mb-2">! 可能已退群 ({compareResult.inWhitelistButNotInList.length}个)</h4>
                          <div className="text-sm text-red-600 space-y-1 max-h-32 overflow-y-auto">
                             {compareResult.inWhitelistButNotInList.map((qq: string, index: number) => (
                               <div key={`in-whitelist-not-in-list-${qq}-${index}`} className="bg-red-50 px-2 py-1 rounded">{qq}</div>
                             ))}
                           </div>
                        </div>
                      )}
                      
                      {compareResult.invalid.length > 0 && (
                        <div>
                          <h4 className="font-medium text-yellow-700 mb-2">⚠ 格式错误 ({compareResult.invalid.length}个)</h4>
                          <div className="text-sm text-yellow-600 space-y-1 max-h-32 overflow-y-auto">
                             {compareResult.invalid.map((qq: string, index: number) => (
                               <div key={`invalid-${qq}-${index}`} className="bg-yellow-50 px-2 py-1 rounded">{qq}</div>
                             ))}
                           </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">请输入QQ号并点击"开始对比"查看结果</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCompareModal(false)
                  setCompareQQs('')
                  setCompareResult(null)
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 批量删除模态框 */}
      {showBatchDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">批量删除QQ号</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  要删除的QQ号列表 *
                </label>
                <textarea
                  value={batchDeleteQQs}
                  onChange={(e) => setBatchDeleteQQs(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="请输入要删除的QQ号，每行一个\n例如：\n123456789\n987654321\n555666777"
                  rows={8}
                />
                <p className="text-sm text-gray-500 mt-1">每行输入一个QQ号</p>
                <p className="text-sm text-red-600 mt-1">⚠️ 删除操作不可撤销，请谨慎操作</p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowBatchDeleteModal(false)
                  setBatchDeleteQQs('')
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                disabled={submitting}
              >
                取消
              </button>
              <button
                onClick={handleBatchDeleteByQQ}
                disabled={submitting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {submitting ? '删除中...' : '批量删除'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认模态框 */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">确认删除</h3>
            <p className="text-gray-600 mb-6">
              确定要删除白名单用户 <span className="font-medium">{selectedUser.qq_number}</span> 吗？
              <br />
              此操作不可撤销。
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedUser(null)
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                disabled={submitting}
              >
                取消
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={submitting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {submitting ? '删除中...' : '删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}