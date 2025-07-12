'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { adminFetch } from '@/lib/utils'

interface AuditLog {
  id: number
  admin_id: number
  action: string
  created_at: string
  admin?: {
    username: string
  }
}

export default function LogsPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [adminFilter, setAdminFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showClearModal, setShowClearModal] = useState(false)
  const [clearConfirmText, setClearConfirmText] = useState('')
  const logsPerPage = 20

  useEffect(() => {
    fetchLogs()
  }, [currentPage, adminFilter])

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: logsPerPage.toString(),
        ...(adminFilter && { admin: adminFilter })
      })

      const response = await adminFetch(`/api/admin/logs?${params}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('获取操作日志失败:', errorData)
        alert('获取操作日志失败: ' + (errorData.error || '服务器错误'))
        return
      }
      
      const data = await response.json()
      
      if (data.success) {
        setLogs(data.logs)
        setTotalPages(Math.ceil(data.total / logsPerPage))
      } else {
        console.error('获取操作日志失败:', data)
        alert('获取操作日志失败: ' + (data.error || '未知错误'))
      }
    } catch (error) {
      console.error('获取操作日志失败:', error)
      alert('获取操作日志失败，请检查网络连接')
    } finally {
      setLoading(false)
    }
  }

const handleSearch = () => {
    setCurrentPage(1)
    fetchLogs()
  }

  const handleClearFilters = () => {
    setAdminFilter('')
    setCurrentPage(1)
    fetchLogs()
  }

  const handleClearAllLogs = async () => {
    if (clearConfirmText !== '确定清除') {
      alert('请输入正确的确认文字：确定清除')
      return
    }

    try {
      const response = await adminFetch('/api/admin/logs/clear', {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('所有操作日志已清除')
         setShowClearModal(false)
         setClearConfirmText('')
         setCurrentPage(1)
         fetchLogs()
      } else {
        const error = await response.json()
        alert(`清除失败: ${error.message}`)
      }
    } catch (error) {
      console.error('清除日志失败:', error)
      alert('清除日志失败，请重试')
    }
  }

  const getActionTypeColor = (action: string) => {
    if (action.includes('删除')) return 'text-red-600 bg-red-50'
    if (action.includes('添加') || action.includes('创建')) return 'text-green-600 bg-green-50'
    if (action.includes('编辑') || action.includes('更新') || action.includes('修改')) return 'text-blue-600 bg-blue-50'
    if (action.includes('封禁') || action.includes('禁用')) return 'text-orange-600 bg-orange-50'
    return 'text-gray-600 bg-gray-50'
  }

  const filteredLogs = logs

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
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 sm:h-16">
            <div className="flex items-center">
              <Link href="/admin/dashboard" className="text-blue-600 hover:text-blue-800 text-sm sm:text-base">
                ← 返回仪表板
              </Link>
              <h1 className="ml-3 sm:ml-4 text-lg sm:text-xl font-semibold text-gray-900">操作日志</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-6 lg:px-8">
        {/* 统计信息 */}
        <div className="mb-4 sm:mb-6 bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-blue-600">{logs.length}</div>
              <div className="text-xs sm:text-sm text-gray-600">当前页日志</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-green-600">{totalPages}</div>
              <div className="text-xs sm:text-sm text-gray-600">总页数</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-purple-600">{currentPage}</div>
              <div className="text-xs sm:text-sm text-gray-600">当前页</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-orange-600">
                {logs.filter(log => log.action.includes('删除')).length}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">删除操作</div>
            </div>
          </div>
        </div>

        {/* 筛选栏 */}
        <div className="mb-4 sm:mb-6 bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                管理员筛选
              </label>
              <input
                type="text"
                placeholder="管理员用户名..."
                value={adminFilter}
                onChange={(e) => setAdminFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              <button
                onClick={handleSearch}
                className="bg-blue-600 text-white px-3 sm:px-4 py-2 text-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                搜索
              </button>
              <button
                onClick={handleClearFilters}
                className="bg-gray-200 text-gray-700 px-3 sm:px-4 py-2 text-sm rounded-md hover:bg-gray-300 transition-colors"
              >
                <span className="hidden sm:inline">清空筛选条件</span>
                <span className="sm:hidden">清空筛选</span>
              </button>
              <button
                onClick={() => setShowClearModal(true)}
                className="bg-red-600 text-white px-3 sm:px-4 py-2 text-sm rounded-md hover:bg-red-700 transition-colors"
              >
                <span className="hidden sm:inline">清除所有日志</span>
                <span className="sm:hidden">清除日志</span>
              </button>
            </div>
          </div>
        </div>

        {/* 日志列表 */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    管理员
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作内容
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    操作时间
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-medium text-gray-900">#{log.id}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                      <div className="text-xs sm:text-sm text-gray-900">
                        {log.admin?.username || `管理员ID: ${log.admin_id}`}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="space-y-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getActionTypeColor(log.action)}`}>
                          {log.action}
                        </span>
                        <div className="sm:hidden text-xs text-gray-500">
                          {log.admin?.username || `管理员ID: ${log.admin_id}`}
                        </div>
                        <div className="md:hidden text-xs text-gray-500">
                          {new Date(log.created_at).toLocaleString('zh-CN')}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-xs sm:text-sm text-gray-900">
                        {new Date(log.created_at).toLocaleString('zh-CN')}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredLogs.length === 0 && (
            <div className="text-center py-8 sm:py-12">
              <div className="text-sm sm:text-base text-gray-500">暂无操作日志</div>
            </div>
          )}
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="bg-white px-3 sm:px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
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
                  显示第 <span className="font-medium">{(currentPage - 1) * logsPerPage + 1}</span> 到{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * logsPerPage, logs.length)}
                  </span>{' '}
                  条，共 <span className="font-medium">{logs.length}</span> 条记录
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

      {/* 清除所有日志确认模态框 */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">清除所有操作日志</h3>
            <p className="text-gray-600 mb-4">
              此操作将永久删除所有操作日志，无法恢复。请输入 <strong>"确定清除"</strong> 来确认操作。
            </p>
            <input
              type="text"
              placeholder="请输入：确定清除"
              value={clearConfirmText}
              onChange={(e) => setClearConfirmText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowClearModal(false)
                  setClearConfirmText('')
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleClearAllLogs}
                disabled={clearConfirmText !== '确定清除'}
                className="flex-1 px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                确认清除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}