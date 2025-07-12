'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { adminFetch } from '@/lib/utils'
import {
  TrophyIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  HeartIcon,
  StarIcon,
  UserIcon,
} from '@heroicons/react/24/outline'

interface Contributor {
  id: number
  nickname: string
  avatar_url: string
  points: number
  likes_count: number
  created_at: string
}

interface ContributorForm {
  nickname: string
  avatar_url: string
  points: number
}

export default function ContributorsManagement() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [contributors, setContributors] = useState<Contributor[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingContributor, setEditingContributor] = useState<Contributor | null>(null)
  const [formData, setFormData] = useState<ContributorForm>({
    nickname: '',
    avatar_url: '',
    points: 0
  })
  const [formLoading, setFormLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  useEffect(() => {
    // 检查管理员登录状态
    const adminData = localStorage.getItem('admin')
    if (!adminData) {
      router.push('/admin/login')
      return
    }

    // 检查是否需要打开添加弹窗
    if (searchParams.get('action') === 'add') {
      setShowModal(true)
    }

    fetchContributors()
  }, [])

  const fetchContributors = async () => {
    try {
      const response = await adminFetch('/api/admin/contributors')
      const result = await response.json()
      
      if (result.success) {
        setContributors(result.contributors)
      } else {
        toast.error('获取贡献者列表失败')
      }
    } catch (error) {
      toast.error('获取贡献者列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.nickname.trim()) {
      toast.error('请输入贡献者昵称')
      return
    }

    if (!formData.avatar_url.trim()) {
      toast.error('请输入头像URL')
      return
    }

    setFormLoading(true)
    try {
      const url = editingContributor 
        ? '/api/admin/contributors/edit'
        : '/api/admin/contributors'
      
      const method = editingContributor ? 'PUT' : 'POST'
      
      const requestBody = editingContributor 
        ? { ...formData, id: editingContributor.id }
        : formData
      
      const response = await adminFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })
      
      const result = await response.json()
      if (result.success) {
        toast.success(editingContributor ? '贡献者信息已更新' : '贡献者已添加')
        setShowModal(false)
        setEditingContributor(null)
        setFormData({ nickname: '', avatar_url: '', points: 0 })
        fetchContributors()
      } else {
        toast.error(result.error || '操作失败')
      }
    } catch (error) {
      toast.error('操作失败')
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = (contributor: Contributor) => {
    setEditingContributor(contributor)
    setFormData({
      nickname: contributor.nickname,
      avatar_url: contributor.avatar_url,
      points: contributor.points
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    try {
      const response = await adminFetch(`/api/admin/contributors/${id}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      if (result.success) {
        toast.success('贡献者已删除')
        setDeleteConfirm(null)
        fetchContributors()
      } else {
        toast.error(result.error || '删除失败')
      }
    } catch (error) {
      toast.error('删除失败')
    }
  }

  const handlePointsAdjust = async (id: number, adjustment: number) => {
    try {
      const response = await adminFetch(`/api/admin/contributors/${id}/points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adjustment })
      })
      
      const result = await response.json()
      if (result.success) {
        toast.success(`积分已${adjustment > 0 ? '增加' : '减少'} ${Math.abs(adjustment)}`)
        fetchContributors()
      } else {
        toast.error(result.error || '操作失败')
      }
    } catch (error) {
      toast.error('操作失败')
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingContributor(null)
    setFormData({ nickname: '', avatar_url: '', points: 0 })
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                <span>返回控制台</span>
              </button>
              <div className="h-6 border-l border-gray-300"></div>
              <div className="flex items-center space-x-3">
                <TrophyIcon className="w-6 h-6 text-purple-600" />
                <h1 className="text-xl font-semibold text-gray-900">贡献排行榜管理</h1>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                <span>添加贡献者</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 贡献者列表 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">贡献者列表</h3>
            <p className="mt-1 text-sm text-gray-500">共 {contributors.length} 位贡献者</p>
          </div>
          
          {contributors.length === 0 ? (
            <div className="text-center py-12">
              <TrophyIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">暂无贡献者</h3>
              <p className="mt-1 text-sm text-gray-500">点击上方按钮添加第一位贡献者</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {contributors
                .sort((a, b) => b.points - a.points)
                .map((contributor, index) => (
                <div key={contributor.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        {contributor.avatar_url ? (
                          <img
                            src={contributor.avatar_url}
                            alt={contributor.nickname}
                            className="w-12 h-12 rounded-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              target.nextElementSibling?.classList.remove('hidden')
                            }}
                          />
                        ) : null}
                        <div className={`w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center ${contributor.avatar_url ? 'hidden' : ''}`}>
                          <UserIcon className="w-6 h-6 text-gray-400" />
                        </div>
                        {index < 3 && (
                          <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                            index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                          }`}>
                            {index + 1}
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{contributor.nickname}</h4>
                        <div className="flex items-center space-x-4 mt-1">
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <StarIcon className="w-4 h-4 text-yellow-500" />
                            <span>{contributor.points} 积分</span>
                          </div>
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <HeartIcon className="w-4 h-4 text-red-500" />
                            <span>{contributor.likes_count} 点赞</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePointsAdjust(contributor.id, 10)}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200 transition-colors"
                      >
                        +10
                      </button>
                      <button
                        onClick={() => handlePointsAdjust(contributor.id, -10)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition-colors"
                      >
                        -10
                      </button>
                      <button
                        onClick={() => handleEdit(contributor)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(contributor.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 添加/编辑贡献者弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingContributor ? '编辑贡献者' : '添加贡献者'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    昵称
                  </label>
                  <input
                    type="text"
                    value={formData.nickname}
                    onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="请输入贡献者昵称"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    头像URL
                  </label>
                  <input
                    type="url"
                    value={formData.avatar_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, avatar_url: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    初始积分
                  </label>
                  <input
                    type="number"
                    value={formData.points}
                    onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    min="0"
                  />
                </div>
                {formData.avatar_url && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      头像预览
                    </label>
                    <img
                      src={formData.avatar_url}
                      alt="头像预览"
                      className="w-16 h-16 rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={formLoading}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
                >
                  {formLoading ? '保存中...' : (editingContributor ? '更新' : '添加')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <TrashIcon className="mx-auto h-16 w-16 text-red-500" />
              <h3 className="text-lg font-medium text-gray-900 mt-4">确认删除</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  确定要删除这位贡献者吗？此操作不可恢复！
                </p>
              </div>
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  确认删除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}