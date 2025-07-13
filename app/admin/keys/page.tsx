'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { adminFetch } from '@/lib/utils'
import {
  KeyIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowLeftIcon,
  FunnelIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'

interface Key {
  id: number
  key_value: string
  status: 'unclaimed' | 'claimed' | 'void'
  claimed_by_user_id?: number
  claimed_at?: string
  user?: {
    nickname: string
    email: string
  }
}

interface FilterState {
  status: 'all' | 'unclaimed' | 'claimed' | 'void'
  search: string
}

export default function KeysManagement() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [keys, setKeys] = useState<Key[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterState>({ status: 'all', search: '' })
  const [showAddModal, setShowAddModal] = useState(false)
  const [newKeys, setNewKeys] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [selectedKeys, setSelectedKeys] = useState<number[]>([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalKeys, setTotalKeys] = useState(0)
  const keysPerPage = 100

  useEffect(() => {
    // 检查管理员登录状态
    const adminData = localStorage.getItem('admin')
    if (!adminData) {
      router.push('/admin/login')
      return
    }

    // 检查是否需要打开添加弹窗
    if (searchParams.get('action') === 'add') {
      setShowAddModal(true)
    }

    fetchKeys()
  }, [currentPage])

  const fetchKeys = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: keysPerPage.toString()
      })
      
      const response = await adminFetch(`/api/admin/keys?${params}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('获取密钥列表失败:', errorData)
        alert('获取密钥列表失败: ' + (errorData.error || '服务器错误'))
        return
      }
      
      const data = await response.json()
      
      if (data.success) {
        setKeys(data.keys)
        setTotalKeys(data.total)
        setTotalPages(Math.ceil(data.total / keysPerPage))
      } else {
        console.error('获取密钥列表失败:', data)
        alert('获取密钥列表失败: ' + (data.error || '未知错误'))
      }
    } catch (error) {
      console.error('获取密钥列表失败:', error)
      alert('获取密钥列表失败，请检查网络连接')
    } finally {
      setLoading(false)
    }
  }

  const handleAddKeys = async () => {
    if (!newKeys.trim()) {
      toast.error('请输入密钥')
      return
    }

    setAddLoading(true)
    try {
      const keyList = newKeys.split('\n').filter(key => key.trim()).map(key => key.trim())
      
      const response = await adminFetch('/api/admin/keys/add', {
        method: 'POST',
        body: JSON.stringify({ keys: keyList })
      })
      
      const result = await response.json()
      if (result.success) {
        toast.success(`成功添加 ${result.addedCount} 个密钥`)
        if (result.duplicateCount > 0) {
          toast.error(`${result.duplicateCount} 个密钥已存在，已跳过`)
        }
        setNewKeys('')
        setShowAddModal(false)
        fetchKeys()
      } else {
        toast.error(result.error || '添加密钥失败')
      }
    } catch (error) {
      toast.error('添加密钥失败')
    } finally {
      setAddLoading(false)
    }
  }

  const handleDeleteKeys = async () => {
    if (selectedKeys.length === 0) {
      toast.error('请选择要删除的密钥')
      return
    }

    setDeleteLoading(true)
    try {
      const response = await adminFetch('/api/admin/keys', {
        method: 'DELETE',
        body: JSON.stringify({ keyIds: selectedKeys })
      })
      
      const result = await response.json()
      if (result.success) {
        toast.success(result.message)
        setSelectedKeys([])
        setShowDeleteModal(false)
        fetchKeys()
      } else {
        toast.error(result.error || '删除密钥失败')
      }
    } catch (error) {
      toast.error('删除密钥失败')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleSelectKey = (keyId: number) => {
    setSelectedKeys(prev => 
      prev.includes(keyId) 
        ? prev.filter(id => id !== keyId)
        : [...prev, keyId]
    )
  }

  const handleSelectAll = () => {
    if (selectedKeys.length === filteredKeys.length) {
      setSelectedKeys([])
    } else {
      setSelectedKeys(filteredKeys.map(key => key.id))
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('已复制到剪贴板')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'unclaimed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <ClockIcon className="w-3 h-3 mr-1" />
            未领取
          </span>
        )
      case 'claimed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="w-3 h-3 mr-1" />
            已领取
          </span>
        )
      case 'void':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="w-3 h-3 mr-1" />
            已失效
          </span>
        )
      default:
        return null
    }
  }

  const filteredKeys = keys.filter(key => {
    const matchesStatus = filter.status === 'all' || key.status === filter.status
    const matchesSearch = !filter.search || 
      key.key_value.toLowerCase().includes(filter.search.toLowerCase()) ||
      (key.user?.nickname && key.user.nickname.toLowerCase().includes(filter.search.toLowerCase())) ||
      (key.user?.email && key.user.email.toLowerCase().includes(filter.search.toLowerCase())) ||
      (key.claimed_by_user_id && key.claimed_by_user_id.toString().includes(filter.search))
    
    return matchesStatus && matchesSearch
  })

  const stats = {
    total: keys.length,
    unclaimed: keys.filter(k => k.status === 'unclaimed').length,
    claimed: keys.filter(k => k.status === 'claimed').length,
    void: keys.filter(k => k.status === 'void').length,
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
                <KeyIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">密钥管理</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              {selectedKeys.length > 0 && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                >
                  <TrashIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">删除选中 ({selectedKeys.length})</span>
                  <span className="sm:hidden">删除 ({selectedKeys.length})</span>
                </button>
              )}
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                <PlusIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">添加密钥</span>
                <span className="sm:hidden">添加</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-3 sm:p-6">
            <div className="flex items-center">
              <div className="p-1.5 sm:p-2 bg-gray-100 rounded-lg">
                <KeyIcon className="w-4 h-4 sm:w-6 sm:h-6 text-gray-600" />
              </div>
              <div className="ml-2 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">总密钥数</p>
                <p className="text-lg sm:text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-3 sm:p-6">
            <div className="flex items-center">
              <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                <ClockIcon className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div className="ml-2 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">未领取</p>
                <p className="text-lg sm:text-2xl font-semibold text-gray-900">{stats.unclaimed}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-3 sm:p-6">
            <div className="flex items-center">
              <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div className="ml-2 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">已领取</p>
                <p className="text-lg sm:text-2xl font-semibold text-gray-900">{stats.claimed}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-3 sm:p-6">
            <div className="flex items-center">
              <div className="p-1.5 sm:p-2 bg-red-100 rounded-lg">
                <XCircleIcon className="w-4 h-4 sm:w-6 sm:h-6 text-red-600" />
              </div>
              <div className="ml-2 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">已失效</p>
                <p className="text-lg sm:text-2xl font-semibold text-gray-900">{stats.void}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 筛选和搜索 */}
        <div className="bg-white rounded-lg shadow p-3 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <select
                value={filter.status}
                onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value as FilterState['status'] }))}
                className="border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">全部密钥</option>
                <option value="unclaimed">未领取</option>
                <option value="claimed">已领取</option>
                <option value="void">已失效</option>
              </select>
            </div>
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索密钥值、领取人信息..."
                value={filter.search}
                onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
          <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600">
            共找到 {filteredKeys.length} 个密钥
          </div>
        </div>

        {/* 密钥列表 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={filteredKeys.length > 0 && selectedKeys.length === filteredKeys.length}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    密钥值
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="hidden md:table-cell px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    领取人
                  </th>
                  <th className="hidden lg:table-cell px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    领取时间
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredKeys.map((key) => (
                  <tr key={key.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedKeys.includes(key.id)}
                        onChange={() => handleSelectKey(key.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs sm:text-sm bg-gray-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded truncate max-w-[120px] sm:max-w-none">
                            {key.key_value}
                          </span>
                          <button
                            onClick={() => copyToClipboard(key.key_value)}
                            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                          >
                            <DocumentDuplicateIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                        {/* 移动端显示领取人和时间 */}
                        <div className="md:hidden">
                          {key.user && (
                            <div className="text-xs text-gray-500">
                              领取人: {key.user.nickname}
                            </div>
                          )}
                          {key.claimed_at && (
                            <div className="text-xs text-gray-400">
                              {new Date(key.claimed_at).toLocaleDateString('zh-CN')}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      {getStatusBadge(key.status)}
                    </td>
                    <td className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      {key.user ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900 truncate max-w-[120px]">{key.user.nickname}</div>
                          <div className="text-sm text-gray-500 truncate max-w-[150px]">{key.user.email}</div>
                          <div className="text-xs text-gray-400">ID: {key.claimed_by_user_id}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="hidden lg:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-500">
                      {key.claimed_at ? (
                        new Date(key.claimed_at).toLocaleString('zh-CN')
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => copyToClipboard(key.key_value)}
                        className="text-blue-600 hover:text-blue-900 transition-colors text-xs sm:text-sm"
                      >
                        复制
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredKeys.length === 0 && (
            <div className="text-center py-8 sm:py-12">
              <KeyIcon className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">没有找到密钥</h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-500">请尝试调整筛选条件</p>
            </div>
          )}
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="bg-white px-3 sm:px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-lg shadow">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              <span className="text-xs text-gray-700 flex items-center">
                {currentPage}/{totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  显示第 <span className="font-medium">{(currentPage - 1) * keysPerPage + 1}</span> 到{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * keysPerPage, totalKeys)}
                  </span>{' '}
                  条，共 <span className="font-medium">{totalKeys}</span> 条记录
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">上一页</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let page;
                    if (totalPages <= 5) {
                      page = i + 1;
                    } else if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === currentPage
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">下一页</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 添加密钥弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 px-4">
          <div className="relative top-10 sm:top-20 mx-auto p-4 sm:p-5 border w-full max-w-sm sm:max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">批量添加密钥</h3>
              <div className="mb-4">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  密钥列表（每行一个）
                </label>
                <textarea
                  value={newKeys}
                  onChange={(e) => setNewKeys(e.target.value)}
                  placeholder="请输入密钥，每行一个...\n例如：\nkey1\nkey2\nkey3"
                  rows={6}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-xs sm:text-sm"
                />
              </div>
              <div className="flex justify-end space-x-3 sm:space-x-4">
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setNewKeys('')
                  }}
                  className="px-3 sm:px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm"
                >
                  取消
                </button>
                <button
                  onClick={handleAddKeys}
                  disabled={addLoading || !newKeys.trim()}
                  className="px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 text-sm"
                >
                  {addLoading ? '添加中...' : '添加密钥'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 px-4">
          <div className="relative top-20 mx-auto p-4 sm:p-5 border w-full max-w-sm sm:max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="flex-shrink-0">
                  <TrashIcon className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                </div>
                <div className="ml-2 sm:ml-3">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900">确认删除密钥</h3>
                </div>
              </div>
              <div className="mb-4">
                <p className="text-xs sm:text-sm text-gray-500">
                  您确定要删除选中的 <span className="font-medium text-red-600">{selectedKeys.length}</span> 个密钥吗？
                </p>
                <p className="text-xs sm:text-sm text-red-600 mt-2">
                  ⚠️ 此操作不可撤销，请谨慎操作！
                </p>
              </div>
              <div className="flex justify-end space-x-3 sm:space-x-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-3 sm:px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm"
                >
                  取消
                </button>
                <button
                  onClick={handleDeleteKeys}
                  disabled={deleteLoading}
                  className="px-3 sm:px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 text-sm"
                >
                  {deleteLoading ? '删除中...' : '确认删除'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}