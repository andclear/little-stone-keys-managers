/**
 * 清除所有点赞数据和粉丝牌发放数据的脚本
 * 执行此脚本后，粉丝牌编号将重新从001开始
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// 创建Supabase客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function clearLikesData() {
  try {
    console.log('🚀 开始清除点赞数据和粉丝牌发放数据...')
    
    // 1. 获取清理前的统计信息
    const { data: beforeStats } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
    
    const { data: contributorsBeforeStats } = await supabase
      .from('contributors')
      .select('likes_count')
    
    const totalLikesBefore = contributorsBeforeStats?.reduce((sum, c) => sum + c.likes_count, 0) || 0
    
    console.log(`📊 清理前统计：`)
    console.log(`   - 点赞记录数：${beforeStats?.length || 0}`)
    console.log(`   - 贡献者总点赞数：${totalLikesBefore}`)
    
    // 2. 清除所有点赞记录
    console.log('🗑️  正在清除所有点赞记录...')
    const { error: deleteError } = await supabase
      .from('likes')
      .delete()
      .neq('user_id', 0) // 删除所有记录的技巧
    
    if (deleteError) {
      throw new Error(`删除点赞记录失败: ${deleteError.message}`)
    }
    
    // 3. 重置所有贡献者的点赞数为0
    console.log('🔄 正在重置贡献者点赞数...')
    const { error: updateError } = await supabase
      .from('contributors')
      .update({ likes_count: 0 })
      .neq('id', 0) // 更新所有记录的技巧
    
    if (updateError) {
      throw new Error(`重置贡献者点赞数失败: ${updateError.message}`)
    }
    
    // 4. 验证清理结果
    console.log('✅ 正在验证清理结果...')
    const { data: afterStats } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
    
    const { data: contributorsAfterStats } = await supabase
      .from('contributors')
      .select('likes_count')
    
    const totalLikesAfter = contributorsAfterStats?.reduce((sum, c) => sum + c.likes_count, 0) || 0
    
    console.log(`📊 清理后统计：`)
    console.log(`   - 点赞记录数：${afterStats?.length || 0}`)
    console.log(`   - 贡献者总点赞数：${totalLikesAfter}`)
    
    if ((afterStats?.length || 0) === 0 && totalLikesAfter === 0) {
      console.log('🎉 数据清理完成！下次点赞将从粉丝牌编号001开始')
    } else {
      console.log('⚠️  数据清理可能不完整，请检查结果')
    }
    
  } catch (error) {
    console.error('❌ 清理数据时发生错误:', error.message)
    process.exit(1)
  }
}

// 执行清理
clearLikesData()
  .then(() => {
    console.log('✨ 脚本执行完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ 脚本执行失败:', error)
    process.exit(1)
  })