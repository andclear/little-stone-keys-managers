-- 清除所有点赞数据和粉丝牌发放数据的SQL脚本
-- 执行此脚本后，粉丝牌编号将重新从001开始

-- 开始事务
BEGIN;

-- 1. 清除所有点赞记录（包括粉丝牌数据）
DELETE FROM likes;

-- 2. 重置所有贡献者的点赞数为0
UPDATE contributors SET likes_count = 0;

-- 3. 重置序列（如果有的话）
-- 注意：likes表使用复合主键，没有自增序列需要重置

-- 提交事务
COMMIT;

-- 验证清理结果
SELECT 
    'likes表记录数' as table_name, 
    COUNT(*) as record_count 
FROM likes
UNION ALL
SELECT 
    'contributors表点赞数总和' as table_name, 
    SUM(likes_count) as record_count 
FROM contributors;

-- 显示清理完成信息
SELECT '数据清理完成，下次点赞将从粉丝牌编号001开始' as status;