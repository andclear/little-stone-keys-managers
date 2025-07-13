'use client'

import { useState, useEffect } from 'react'
import { supabase, type User, type Contributor, type Like } from '@/lib/supabase'
import { isValidQQNumber, isValidPassword, copyToClipboard, formatDateTime } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  UserIcon,
  KeyIcon,
  HeartIcon,
  ClipboardDocumentIcon,
  ArrowRightOnRectangleIcon,
  EyeIcon,
  EyeSlashIcon,
  SparklesIcon,
  TrophyIcon,
  FireIcon,
  InformationCircleIcon,
  GlobeAltIcon,
  GiftIcon,
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'

interface UserWithKey extends User {
  key?: string
}

interface ContributorWithLiked extends Contributor {
  isLiked: boolean
}

export default function HomePage() {
  const [isLogin, setIsLogin] = useState(true)
  const [user, setUser] = useState<UserWithKey | null>(null)
  const [contributors, setContributors] = useState<ContributorWithLiked[]>([])
  const [userLikes, setUserLikes] = useState<Like[]>([])
  const [apiBaseUrl, setApiBaseUrl] = useState('https://api.xiaoshizi.com/v1')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // 表单数据
  const [formData, setFormData] = useState({
    qq: '',
    nickname: '',
    password: '',
    confirmPassword: '',
    verificationCode: '',
  })
  
  const [verificationSent, setVerificationSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [showApiTooltip, setShowApiTooltip] = useState(false)

  // 页面加载时检查本地存储的登录状态并验证用户是否仍然存在
  useEffect(() => {
    const validateUser = async () => {
      const savedUser = localStorage.getItem('user')
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser)
          
          // 通过API验证用户是否仍然存在于数据库中
          const response = await fetch('/api/users/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: userData.id })
          })
          
          const result = await response.json()
          
          if (result.success && result.user) {
            // 用户存在，更新本地用户数据，特别注意密钥状态的更新
            const updatedUser = { 
              ...userData, 
              ...result.user,
              // 确保密钥状态正确更新：如果API返回null，说明密钥已失效
              key: result.user.key || null
            }
            setUser(updatedUser)
            localStorage.setItem('user', JSON.stringify(updatedUser))
          } else if (result.userDeleted) {
            // 用户确实被删除，清除本地存储并提示
            localStorage.removeItem('user')
            setUser(null)
            toast.error('用户账户已被删除，请重新登录')
          } else {
            // 其他错误，静默处理，保持当前登录状态
            console.warn('用户验证失败，但保持登录状态:', result.error)
            setUser(userData)
          }
        } catch (error) {
          console.error('Failed to validate user:', error)
          // 网络错误等情况，保持当前登录状态，不强制退出
          const userData = JSON.parse(savedUser)
          setUser(userData)
        }
      }
    }
    
    validateUser()
  }, [])

  // 获取API基础URL
  useEffect(() => {
    fetchApiBaseUrl()
  }, [])

  // 获取贡献者列表
  useEffect(() => {
    fetchContributors()
  }, [user])

  const fetchApiBaseUrl = async () => {
    try {
      const { data } = await supabase
        .from('system_config')
        .select('value')
        .eq('key', 'api_base_url')
        .single()
      
      if (data?.value) {
        setApiBaseUrl(data.value)
      }
    } catch (error) {
      console.error('Failed to fetch API base URL:', error)
    }
  }

  const fetchContributors = async () => {
    try {
      const { data: contributorsData } = await supabase
        .from('contributors')
        .select('*')
        .order('points', { ascending: false })
      
      if (contributorsData) {
        let contributorsWithLiked = contributorsData.map(c => ({ ...c, isLiked: false }))
        
        if (user) {
          const { data: likesData } = await supabase
            .from('likes')
            .select('*')
            .eq('user_id', user.id)
          
          if (likesData) {
            setUserLikes(likesData)
            contributorsWithLiked = contributorsData.map(c => ({
              ...c,
              isLiked: likesData.some(like => like.contributor_id === c.id)
            }))
          }
        }
        
        setContributors(contributorsWithLiked)
      }
    } catch (error) {
      console.error('Failed to fetch contributors:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const sendVerificationCode = async () => {
    if (!formData.qq) {
      toast.error('请输入QQ号')
      return
    }
    
    if (!isValidQQNumber(formData.qq)) {
      toast.error('请输入有效的QQ号')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qq: formData.qq }),
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success('验证码已发送到您的QQ邮箱')
        setVerificationSent(true)
        setCountdown(60)
        
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        toast.error(result.message || '发送验证码失败')
      }
    } catch (error) {
      toast.error('发送验证码失败')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('注册表单提交', formData)
    
    if (!formData.qq || !formData.nickname || !formData.password || !formData.confirmPassword || !formData.verificationCode) {
      toast.error('请填写所有必填字段')
      return
    }
    
    if (!isValidQQNumber(formData.qq)) {
      toast.error('请输入有效的QQ号')
      return
    }
    
    if (!isValidPassword(formData.password)) {
      toast.error('密码最低6位')
      return
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('两次输入的密码不一致')
      return
    }

    setLoading(true)
    try {
      console.log('发送注册请求...')
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qq: formData.qq,
          nickname: formData.nickname,
          password: formData.password,
          verificationCode: formData.verificationCode,
        }),
      })

      console.log('注册响应状态:', response.status)
      const result = await response.json()
      console.log('注册响应结果:', result)
      
      if (result.success) {
        toast.success('注册成功！')
        setUser(result.user)
        localStorage.setItem('user', JSON.stringify(result.user))
        setFormData({ qq: '', nickname: '', password: '', confirmPassword: '', verificationCode: '' })
      } else {
        toast.error(result.message || '注册失败')
      }
    } catch (error) {
      console.error('注册错误:', error)
      toast.error('注册失败')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.qq || !formData.password) {
      toast.error('请输入QQ号和密码')
      return
    }
    
    if (!isValidQQNumber(formData.qq)) {
      toast.error('请输入有效的QQ号')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qq: formData.qq,
          password: formData.password,
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success('登录成功！')
        setUser(result.user)
        localStorage.setItem('user', JSON.stringify(result.user))
        setFormData({ qq: '', nickname: '', password: '', confirmPassword: '', verificationCode: '' })
      } else {
        toast.error(result.message || '登录失败')
      }
    } catch (error) {
      toast.error('登录失败')
    } finally {
      setLoading(false)
    }
  }

  const handleClaimKey = async () => {
    if (!user) return

    setLoading(true)
    try {
      const response = await fetch('/api/keys/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success('密钥领取成功！')
        const updatedUser = user ? { ...user, key: result.key } : null
        setUser(updatedUser)
        if (updatedUser) {
          localStorage.setItem('user', JSON.stringify(updatedUser))
        }
      } else {
        toast.error(result.message || '密钥领取失败')
      }
    } catch (error) {
      toast.error('密钥领取失败')
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (contributorId: number) => {
    if (!user) return

    try {
      const response = await fetch('/api/likes/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, contributorId }),
      })

      const result = await response.json()
      
      if (result.success) {
        if (result.fanBadgeNumber) {
          toast.success(`点赞成功！获得粉丝牌编号：${String(result.fanBadgeNumber).padStart(3, '0')}`)
        } else {
          toast.success('点赞成功！')
        }
        // 刷新贡献者列表和用户点赞数据
        fetchContributors()
        // 重新获取用户点赞数据以更新粉丝牌
        const userLikesResponse = await fetch(`/api/users/${user.id}/likes`)
        if (userLikesResponse.ok) {
          const userLikesData = await userLikesResponse.json()
          setUserLikes(userLikesData)
        }
      } else {
        toast.error(result.message || '操作失败')
      }
    } catch (error) {
      toast.error('操作失败')
    }
  }

  const handleCopy = async (text: string, type: string) => {
    const success = await copyToClipboard(text)
    if (success) {
      toast.success(`${type}已复制到剪贴板`)
    } else {
      toast.error('复制失败')
    }
  }

  const handleLogout = () => {
    setUser(null)
    setUserLikes([])
    localStorage.removeItem('user')
    setFormData({ qq: '', nickname: '', password: '', confirmPassword: '', verificationCode: '' })
    toast.success('已退出登录')
  }

  const getFanBadges = (): Array<Contributor & { badgeText: string }> => {
    if (!userLikes.length) return []
    
    const fanBadges = userLikes.map(like => {
      const contributor = contributors.find(c => c.id === like.contributor_id)
      if (!contributor) return null
      
      const badgeNumber = like.fan_badge_number ? String(like.fan_badge_number).padStart(3, '0') : '001'
      return {
        ...contributor,
        badgeText: `${contributor.nickname}${badgeNumber}`
      }
    }).filter((badge): badge is NonNullable<typeof badge> => badge !== null)
    
    return fanBadges.sort((a, b) => b.points - a.points).slice(0, 10)
  }

  return (
    <div className="min-h-screen">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 max-w-4xl">
        {/* 头部标题 */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full mb-4 sm:mb-6 animate-pulse-slow" style={{backgroundImage: 'linear-gradient(to top, #9795f0 0%, #fbc8d4 100%)'}}>
            <GiftIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2 sm:mb-4 px-2">
            小石子 Keys 管理系统
          </h1>
          <p className="text-gray-600 text-base sm:text-lg px-4">
            专属的密钥分发与管理系统 v2.2
          </p>
        </div>

        {/* 主要内容区域 */}
        <div className="space-y-8">
          {!user ? (
            /* 未登录状态 - 注册/登录表单 */
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 card-hover">
              <div className="flex justify-center mb-6 sm:mb-8">
                <div className="flex bg-gray-100 rounded-lg p-1 w-full max-w-xs">
                  <button
                    onClick={() => setIsLogin(true)}
                    className={`flex-1 px-4 sm:px-6 py-2 rounded-md font-medium transition-all text-sm sm:text-base ${
                      isLogin
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    登录
                  </button>
                  <button
                    onClick={() => setIsLogin(false)}
                    className={`flex-1 px-4 sm:px-6 py-2 rounded-md font-medium transition-all text-sm sm:text-base ${
                      !isLogin
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    注册
                  </button>
                </div>
              </div>

              <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-4 sm:space-y-6">
                {/* QQ号输入 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    QQ号
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      name="qq"
                      value={formData.qq}
                      onChange={handleInputChange}
                      placeholder="请输入QQ号"
                      className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                    <div className="px-2 sm:px-4 py-2 sm:py-3 bg-gray-50 border border-l-0 border-gray-300 rounded-r-lg text-gray-600 text-sm sm:text-base">
                      @qq.com
                    </div>
                  </div>
                  {!isLogin && (
                    <p className="mt-2 text-xs sm:text-sm text-orange-600 font-medium">
                      请务必输入你加入群聊的QQ号码，否则将无法获取密钥。
                    </p>
                  )}
                </div>

                {/* 注册专用字段 */}
                {!isLogin && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        自定义用户名（支持中文）
                      </label>
                      <input
                        type="text"
                        name="nickname"
                        value={formData.nickname}
                        onChange={handleInputChange}
                        placeholder="请输入用户名"
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        邮箱验证码
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <input
                          type="text"
                          name="verificationCode"
                          value={formData.verificationCode}
                          onChange={handleInputChange}
                          placeholder="请输入验证码"
                          className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          required
                        />
                        <button
                          type="button"
                          onClick={sendVerificationCode}
                          disabled={countdown > 0 || loading}
                          className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all btn-animate whitespace-nowrap"
                        >
                          {countdown > 0 ? `${countdown}s` : '获取验证码'}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* 密码输入 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    密码
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="请输入密码"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      ) : (
                        <EyeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                    </button>
                  </div>
                  {!isLogin && (
                    <p className="mt-2 text-xs sm:text-sm text-red-600 font-medium">
                      请不要使用你的QQ密码，密码最低6位
                    </p>
                  )}
                </div>

                {/* 确认密码 - 仅注册时显示 */}
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      确认密码
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="请再次输入密码"
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                      >
                        {showConfirmPassword ? (
                          <EyeSlashIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        ) : (
                          <EyeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 sm:py-4 text-sm sm:text-base bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all btn-animate"
                >
                  {loading ? '处理中...' : isLogin ? '登录' : '注册'}
                </button>
              </form>
            </div>
          ) : (
            /* 已登录状态 - 用户信息面板 */
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 card-hover">
              {user.is_banned ? (
                /* 封禁用户提示 */
                <div className="text-center py-8 sm:py-12">
                  <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full mb-3 sm:mb-4">
                    <UserIcon className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-red-600 mb-2">
                    账户已被封禁
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base px-4">
                    您的账户已被封禁，请联系管理员。
                  </p>
                </div>
              ) : (
                <div className="space-y-6 sm:space-y-8">
                  {/* 用户基本信息 */}
                  <div className="relative">
                    {/* 移动端退出按钮 - 右上角 */}
                    <button
                      onClick={handleLogout}
                      className="absolute top-0 right-0 sm:hidden flex items-center space-x-1 px-2 py-1 text-gray-600 hover:text-red-600 transition-colors text-sm"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4" />
                      <span>退出</span>
                    </button>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                      <div className="flex items-center space-x-3 sm:space-x-4 pr-16 sm:pr-0">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-gray-200 bg-white flex-shrink-0">
                          <img
                            src={`https://api.dicebear.com/9.x/notionists/svg?seed=${user.id}`}
                            alt={`${user.nickname}的头像`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h2 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{user.nickname}</h2>
                          <p className="text-gray-600 text-sm sm:text-base">ID: {user.id}</p>
                        </div>
                      </div>
                      {/* 桌面端退出按钮 */}
                      <button
                        onClick={handleLogout}
                        className="hidden sm:flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 text-gray-600 hover:text-red-600 transition-colors text-sm sm:text-base"
                      >
                        <ArrowRightOnRectangleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>退出账号</span>
                      </button>
                    </div>
                  </div>

                  {/* 粉丝牌区域 */}
                  {getFanBadges().length > 0 && (
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-yellow-500" />
                        我的粉丝牌
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {getFanBadges().map((badge, index) => {
                          const badgeNumber = badge.badgeText.match(/\d{3}$/)?.[0] || '001'
                          const badgeName = badge.badgeText.replace(/\d{3}$/, '')
                          
                          return (
                            <div
                              key={badge.id}
                              className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                                index === 0
                                  ? 'bg-gradient-to-r from-gray-900 to-black text-yellow-400'
                                  : index === 1
                                  ? 'bg-gradient-to-r from-purple-200 to-purple-400 text-purple-900'
                                  : index === 2
                                  ? 'bg-gradient-to-r from-blue-200 to-blue-400 text-blue-900'
                                  : 'bg-gradient-to-r from-green-200 to-green-400 text-black'
                              }`}
                            >
                              <span className="mr-1">{badgeName}</span>
                              <span className={`inline-flex items-center justify-center min-w-[1.5rem] sm:min-w-[2rem] h-4 sm:h-5 px-1 sm:px-1.5 rounded text-xs font-bold ${
                                index === 0
                                  ? 'bg-yellow-400/30 text-yellow-400'
                                  : index === 1
                                  ? 'bg-white/40 text-purple-900'
                                  : index === 2
                                  ? 'bg-white/40 text-blue-900'
                                  : 'bg-white/50 text-black'
                              }`}>
                                {badgeNumber}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* API调用地址 */}
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <GlobeAltIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-500" />
                      API调用地址
                      <div className="relative ml-2">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 cursor-pointer transition-colors">
                           <InformationCircleIcon 
                             className="w-3 h-3 sm:w-4 sm:h-4 text-white"
                             onClick={() => setShowApiTooltip(!showApiTooltip)}
                             onMouseEnter={() => setShowApiTooltip(true)}
                             onMouseLeave={() => setShowApiTooltip(false)}
                           />
                         </div>
                        {showApiTooltip && (
                          <div className="absolute left-0 top-6 z-50 w-72 sm:w-80 p-2 sm:p-3 bg-black text-white text-xs sm:text-sm rounded-lg shadow-lg font-normal">
                             <div className="space-y-1">
                               在酒馆中使用，请不要忽略 <span className="text-green-400 font-semibold">/v1</span>，如果你使用该调用地址和密钥，无法获取模型链接，或者无法使用，请检查你的<span className="text-green-400 font-semibold">酒馆后端是否断开</span>，安卓本地酒馆请<span className="text-green-400 font-semibold">重启酒馆</span>，然后<span className="text-green-400 font-semibold">把Termux挂小窗</span>，然后再进行尝试
                             </div>
                           </div>
                        )}
                      </div>
                    </h3>
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3 sm:p-4">
                      <div className="flex items-start sm:items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm text-gray-600 mb-1">BaseURL:</p>
                          <code className="text-blue-600 font-mono text-sm sm:text-lg break-all">
                            {apiBaseUrl}
                          </code>
                        </div>
                        <button
                          onClick={() => handleCopy(apiBaseUrl, 'API地址')}
                          className="ml-2 sm:ml-4 p-2 sm:p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors btn-animate flex-shrink-0"
                        >
                          <ClipboardDocumentIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        在不同的平台或客户端中使用，可能需要去掉 <span className="bg-yellow-200 px-1 rounded font-mono">/v1</span>
                      </p>
                    </div>
                  </div>

                  {/* 密钥区域 */}
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <KeyIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-500" />
                      我的专属密钥
                    </h3>
                    {user.key ? (
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-3 sm:p-4">
                        <div className="flex items-start sm:items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm text-gray-600 mb-1">密钥值:</p>
                            <code className="text-green-600 font-mono text-sm sm:text-lg break-all">
                              {user.key}
                            </code>
                          </div>
                          <button
                            onClick={() => handleCopy(user.key!, '密钥')}
                            className="ml-2 sm:ml-4 p-2 sm:p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors btn-animate flex-shrink-0"
                          >
                            <ClipboardDocumentIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={handleClaimKey}
                        disabled={loading}
                        className="w-full py-3 sm:py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white font-medium rounded-lg hover:from-green-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all btn-animate text-sm sm:text-base"
                      >
                        {loading ? '领取中...' : '领取我的专属密钥'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 贡献排行榜 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center justify-center mb-4 sm:mb-6">
              <TrophyIcon className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 mr-2" />
              <h2 className="text-lg sm:text-2xl font-bold text-gray-800">
                贡献排行榜
              </h2>
            </div>

            {contributors.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <TrophyIcon className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm sm:text-base">暂无贡献者数据</p>
              </div>
            ) : (
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                {/* 表头 */}
                <div className={`bg-gray-50 grid gap-1 sm:gap-4 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 ${
                  user 
                    ? 'grid-cols-[35px_minmax(120px,1fr)_45px_35px] sm:grid-cols-[60px_1fr_100px_80px_80px]' 
                    : 'grid-cols-[35px_minmax(120px,1fr)_45px_45px] sm:grid-cols-[60px_1fr_100px_80px]'
                }`}>
                  <div className="text-left">排名</div>
                  <div className="text-left">贡献者</div>
                  <div className="hidden sm:block text-center">贡献积分</div>
                  <div className="text-center">点赞数</div>
                  {user && <div className="text-center">点赞</div>}
                </div>
                
                {/* 贡献者列表 */}
                <div className="divide-y divide-gray-200">
                  {contributors.map((contributor, index) => (
                    <div
                      key={contributor.id}
                      className={`grid gap-1 sm:gap-4 px-2 sm:px-4 py-3 sm:py-4 items-center hover:opacity-90 transition-all ${
                        index === 0 ? 'bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-white' :
                        index === 1 ? 'bg-gradient-to-r from-purple-50 to-purple-100' :
                        index === 2 ? 'bg-gradient-to-r from-blue-50 to-blue-100' :
                        index >= 3 ? 'bg-gradient-to-r from-green-50 to-green-100' : 'bg-white'
                      } ${
                        user 
                          ? 'grid-cols-[35px_minmax(120px,1fr)_45px_35px] sm:grid-cols-[60px_1fr_100px_80px_80px]' 
                          : 'grid-cols-[35px_minmax(120px,1fr)_45px_45px] sm:grid-cols-[60px_1fr_100px_80px]'
                      }`}
                    >
                      {/* 排名 */}
                      <div className="flex justify-center">
                        <div className={`flex items-center justify-center w-4 h-4 sm:w-8 sm:h-8 rounded-full font-bold text-xs sm:text-sm ${
                          index === 0 ? 'bg-white/20 text-white shadow-lg' :
                          index === 1 ? 'bg-white/30 text-purple-900' :
                          index === 2 ? 'bg-white/30 text-blue-900' :
                          'bg-white/30 text-green-900'
                        }`}>
                          {index + 1}
                        </div>
                      </div>

                      {/* 贡献者信息 */}
                      <div className="flex items-center space-x-1 sm:space-x-3 min-w-0">
                        <div className={`w-5 h-5 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 flex-shrink-0 ${
                          index === 0 ? 'border-white/30' : 'border-gray-200'
                        }`}>
                          <img
                            src={contributor.avatar_url || '/default-avatar.png'}
                            alt={contributor.nickname}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(contributor.nickname)}&background=random&color=fff&size=40`
                            }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className={`font-medium text-xs sm:text-base truncate ${
                            index === 0 ? 'text-white' : 'text-gray-900'
                          }`}>
                            {contributor.nickname}
                          </h3>
                          {/* 移动端显示积分 */}
                          <div className="sm:hidden flex items-center mt-0.5">
                            <div className="flex items-center space-x-0.5">
                              <span className={`text-xs font-bold ${
                                index === 0 ? 'text-white' : 'text-blue-600'
                              }`}>{contributor.points}</span>
                              <span className={`text-xs ${
                                index === 0 ? 'text-blue-100' : 'text-gray-500'
                              }`}>分</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 贡献积分 - 桌面端显示 */}
                      <div className="hidden sm:flex flex-col items-center">
                        <span className={`text-lg sm:text-2xl font-bold ${
                          index === 0 ? 'text-white' : 'text-blue-600'
                        }`}>
                          {contributor.points}
                        </span>
                        <div className={`text-xs ${
                          index === 0 ? 'text-blue-100' : 'text-gray-500'
                        }`}>积分</div>
                      </div>

                      {/* 点赞数 */}
                      <div className="flex flex-col items-center">
                        <span className={`text-xs sm:text-lg md:text-2xl font-bold ${
                          index === 0 ? 'text-white' : 'text-red-500'
                        }`}>
                          {contributor.likes_count}
                        </span>
                        <div className={`text-xs hidden sm:block ${
                          index === 0 ? 'text-blue-100' : 'text-gray-500'
                        }`}>点赞</div>
                      </div>

                      {/* 点赞按钮 */}
                      {user && (
                        <div className="flex justify-center">
                          {!user.is_banned && (
                            <button
                              onClick={() => handleLike(contributor.id)}
                              disabled={contributor.isLiked}
                              className={`inline-flex items-center justify-center w-5 h-5 sm:w-auto sm:h-auto sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                                contributor.isLiked
                                  ? 'bg-white/30 text-gray-600 cursor-not-allowed'
                                  : index === 0 
                                    ? 'bg-white/20 text-white hover:bg-white/30'
                                    : 'bg-white/50 text-red-600 hover:bg-white/70'
                              }`}
                            >
                              {contributor.isLiked ? (
                                <HeartSolidIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                              ) : (
                                <HeartIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                              )}
                              <span className="hidden sm:inline sm:ml-1">{contributor.isLiked ? '已赞' : '点赞'}</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 网站搭建者信息卡片 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-4 sm:p-6 mt-6">
            <div className="text-center">

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
                <p className="text-gray-700 text-sm sm:text-base mb-2">
                  该网页由 <span className="font-semibold text-purple-600">"老婆宝"</span> 搭建
                </p>
                <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
                  <span>小红书账号：<span className="font-medium text-pink-600">老婆宝</span></span>
                  <span className="hidden sm:inline">|</span>
                  <span className="sm:inline block">小红书号：<span className="font-medium text-pink-600">laopobao</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}