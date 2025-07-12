-- 小石子 Keys 管理系统数据库初始化脚本
-- 请在Supabase SQL编辑器中执行此脚本

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY, -- QQ号作为主键
    nickname VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_banned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建密钥表
CREATE TABLE IF NOT EXISTS keys (
    id SERIAL PRIMARY KEY,
    key_value VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'unclaimed' CHECK (status IN ('unclaimed', 'claimed', 'void')),
    claimed_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    claimed_at TIMESTAMPTZ
);

-- 创建贡献者表
CREATE TABLE IF NOT EXISTS contributors (
    id SERIAL PRIMARY KEY,
    nickname VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(255),
    points INT DEFAULT 0,
    likes_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建点赞记录表
CREATE TABLE IF NOT EXISTS likes (
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    contributor_id INT REFERENCES contributors(id) ON DELETE CASCADE,
    fan_badge_number INT, -- 粉丝牌编号 (001-999)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, contributor_id)
);

-- 创建管理员表
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建操作日志表
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    admin_id INT REFERENCES admins(id),
    action TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建白名单表
CREATE TABLE IF NOT EXISTS whitelist (
    id SERIAL PRIMARY KEY,
    qq_number BIGINT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建系统配置表
CREATE TABLE IF NOT EXISTS system_config (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建验证码表
CREATE TABLE IF NOT EXISTS verification_codes (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_banned ON users(is_banned);
CREATE INDEX IF NOT EXISTS idx_keys_status ON keys(status);
CREATE INDEX IF NOT EXISTS idx_keys_claimed_by_user_id ON keys(claimed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_contributors_points ON contributors(points DESC);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_contributor_id ON likes(contributor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at ON verification_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_verification_codes_used ON verification_codes(used);

-- 创建函数：增加点赞数
CREATE OR REPLACE FUNCTION increment_likes_count(contributor_id INT)
RETURNS VOID AS $$
BEGIN
    UPDATE contributors 
    SET likes_count = likes_count + 1 
    WHERE id = contributor_id;
END;
$$ LANGUAGE plpgsql;

-- 创建函数：减少点赞数
CREATE OR REPLACE FUNCTION decrement_likes_count(contributor_id INT)
RETURNS VOID AS $$
BEGIN
    UPDATE contributors 
    SET likes_count = GREATEST(likes_count - 1, 0) 
    WHERE id = contributor_id;
END;
$$ LANGUAGE plpgsql;

-- 创建函数：清理过期的验证码
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS VOID AS $$
BEGIN
    DELETE FROM verification_codes 
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 创建触发器函数：在插入新验证码时清理该邮箱的过期验证码
CREATE OR REPLACE FUNCTION cleanup_user_expired_codes()
RETURNS TRIGGER AS $$
BEGIN
    -- 清理该邮箱的过期验证码
    DELETE FROM verification_codes 
    WHERE email = NEW.email AND expires_at < NOW();
    
    -- 限制每个邮箱最多保留5个未使用的验证码（防止恶意请求）
    DELETE FROM verification_codes 
    WHERE email = NEW.email 
    AND used = false 
    AND id NOT IN (
        SELECT id FROM verification_codes 
        WHERE email = NEW.email AND used = false 
        ORDER BY created_at DESC 
        LIMIT 5
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器：当用户被封禁或删除时，自动将其密钥设为失效
CREATE OR REPLACE FUNCTION invalidate_user_keys()
RETURNS TRIGGER AS $$
BEGIN
    -- 如果用户被封禁
    IF TG_OP = 'UPDATE' AND OLD.is_banned = FALSE AND NEW.is_banned = TRUE THEN
        UPDATE keys 
        SET status = 'void' 
        WHERE claimed_by_user_id = NEW.id AND status = 'claimed';
    END IF;
    
    -- 如果用户被删除
    IF TG_OP = 'DELETE' THEN
        UPDATE keys 
        SET status = 'void' 
        WHERE claimed_by_user_id = OLD.id AND status = 'claimed';
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS trigger_invalidate_user_keys_update ON users;
CREATE TRIGGER trigger_invalidate_user_keys_update
    AFTER UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION invalidate_user_keys();

DROP TRIGGER IF EXISTS trigger_invalidate_user_keys_delete ON users;
CREATE TRIGGER trigger_invalidate_user_keys_delete
    BEFORE DELETE ON users
    FOR EACH ROW
    EXECUTE FUNCTION invalidate_user_keys();

-- 创建触发器：在插入新验证码时自动清理
DROP TRIGGER IF EXISTS trigger_cleanup_expired_codes ON verification_codes;
CREATE TRIGGER trigger_cleanup_expired_codes
    AFTER INSERT ON verification_codes
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_user_expired_codes();

-- 插入默认系统配置
INSERT INTO system_config (key, value) VALUES 
('api_base_url', 'https://api.xiaoshizi.com/v1')
ON CONFLICT (key) DO NOTHING;

-- 插入默认管理员账户（密码：admin123，已加密）
-- 注意：这里使用的是bcrypt加密后的密码哈希值
-- 实际部署时应该通过API创建管理员账户
INSERT INTO admins (username, password_hash) VALUES 
('admin', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO.6')
ON CONFLICT (username) DO NOTHING;

-- 插入示例贡献者数据（可选）
INSERT INTO contributors (nickname, avatar_url, points) VALUES 
('小石子', 'https://ui-avatars.com/api/?name=小石子&background=667eea&color=fff&size=64', 1000),
('开发者A', 'https://ui-avatars.com/api/?name=开发者A&background=764ba2&color=fff&size=64', 800),
('贡献者B', 'https://ui-avatars.com/api/?name=贡献者B&background=f093fb&color=fff&size=64', 600)
ON CONFLICT DO NOTHING;

-- 插入示例密钥数据（可选）
INSERT INTO keys (key_value) VALUES 
('DEMO-KEY-001-ABCDEFGHIJKLMNOP'),
('DEMO-KEY-002-QRSTUVWXYZ123456'),
('DEMO-KEY-003-789ABCDEF0123456')
ON CONFLICT (key_value) DO NOTHING;

-- 设置RLS（行级安全）策略（可选，根据需要启用）
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE keys ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE contributors ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE whitelist ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- 创建视图：用户密钥信息
CREATE OR REPLACE VIEW user_key_info AS
SELECT 
    u.id,
    u.nickname,
    u.email,
    u.is_banned,
    u.created_at,
    k.key_value,
    k.status as key_status,
    k.claimed_at
FROM users u
LEFT JOIN keys k ON u.id = k.claimed_by_user_id AND k.status = 'claimed';

-- 创建视图：贡献者排行榜
CREATE OR REPLACE VIEW contributor_leaderboard AS
SELECT 
    c.*,
    ROW_NUMBER() OVER (ORDER BY c.points DESC, c.likes_count DESC) as rank
FROM contributors c
ORDER BY c.points DESC, c.likes_count DESC;

COMMIT;