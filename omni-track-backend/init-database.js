/**
 * 数据库初始化脚本
 * 用于创建数据库表结构
 * 使用方法: node init-database.js
 */

// 加载环境变量
try {
  require('dotenv').config();
  console.log('📄 已加载 .env 文件');
} catch (e) {
  // 如果没有dotenv，尝试手动加载
  const fs = require('fs');
  const path = require('path');
  const envFile = path.join(__dirname, '.env');
  if (fs.existsSync(envFile)) {
    const envContent = fs.readFileSync(envFile, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        const value = valueParts.join('=').trim();
        if (key && value) {
          process.env[key.trim()] = value;
        }
      }
    });
    console.log('📄 手动加载 .env 文件成功');
  }
}

const { Pool } = require('pg');

// 数据库连接配置
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ 错误: DATABASE_URL 环境变量未设置');
  process.exit(1);
}

console.log('🔗 数据库连接字符串:', DATABASE_URL.replace(/\/\/.*:.*@/, '//***:***@'));

// 创建数据库连接
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// SQL 创建表语句
const createTablesSQL = `
-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    "subscriptionTier" VARCHAR(50) DEFAULT 'free',
    "subscriptionStartDate" TIMESTAMP,
    "subscriptionEndDate" TIMESTAMP,
    "maxProjects" INTEGER DEFAULT 5,
    "maxLogEntries" INTEGER DEFAULT 1000,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 项目表
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6366f1',
    "isActive" BOOLEAN DEFAULT true,
    "userId" INTEGER REFERENCES users(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 任务表
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'medium',
    "dueDate" TIMESTAMP,
    "estimatedTime" INTEGER,
    "actualTime" INTEGER,
    tags TEXT[],
    "aiGenerated" BOOLEAN DEFAULT false,
    "parentTaskId" INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
    "projectId" INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    "userId" INTEGER REFERENCES users(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 日志表
CREATE TABLE IF NOT EXISTS logs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    content TEXT NOT NULL,
    category VARCHAR(100),
    mood VARCHAR(50),
    tags TEXT[],
    "isPrivate" BOOLEAN DEFAULT false,
    "projectId" INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    "userId" INTEGER REFERENCES users(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 日志条目表
CREATE TABLE IF NOT EXISTS log_entries (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    "logId" INTEGER REFERENCES logs(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI交互表
CREATE TABLE IF NOT EXISTS ai_interactions (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER REFERENCES users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    response TEXT NOT NULL,
    "modelUsed" VARCHAR(100),
    "tokensUsed" INTEGER DEFAULT 0,
    "responseTime" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 订阅等级表
CREATE TABLE IF NOT EXISTS subscription_tiers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    "maxProjects" INTEGER DEFAULT 5,
    "maxLogEntries" INTEGER DEFAULT 1000,
    "aiRequestsPerDay" INTEGER DEFAULT 10,
    "storageLimit" BIGINT DEFAULT 1048576,
    features TEXT[],
    "monthlyPrice" DECIMAL(10,2) DEFAULT 0,
    "yearlyPrice" DECIMAL(10,2) DEFAULT 0,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户订阅表
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER REFERENCES users(id) ON DELETE CASCADE,
    "subscriptionTierId" INTEGER REFERENCES subscription_tiers(id),
    "startDate" TIMESTAMP NOT NULL,
    "endDate" TIMESTAMP,
    "isActive" BOOLEAN DEFAULT true,
    "paymentMethod" VARCHAR(100),
    "paymentId" VARCHAR(255),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 使用配额表
CREATE TABLE IF NOT EXISTS usage_quotas (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER REFERENCES users(id) ON DELETE CASCADE,
    "quotaType" VARCHAR(100) NOT NULL,
    "usedAmount" INTEGER DEFAULT 0,
    "limitAmount" INTEGER NOT NULL,
    "resetDate" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 分析队列表
CREATE TABLE IF NOT EXISTS analysis_queues (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER REFERENCES users(id) ON DELETE CASCADE,
    "itemType" VARCHAR(100) NOT NULL,
    "itemId" INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    "analysisType" VARCHAR(100) NOT NULL,
    result JSONB,
    error TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects("userId");
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks("userId");
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks("projectId");
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs("userId");
CREATE INDEX IF NOT EXISTS idx_logs_project_id ON logs("projectId");
CREATE INDEX IF NOT EXISTS idx_log_entries_log_id ON log_entries("logId");
CREATE INDEX IF NOT EXISTS idx_ai_interactions_user_id ON ai_interactions("userId");
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions("userId");
CREATE INDEX IF NOT EXISTS idx_usage_quotas_user_id ON usage_quotas("userId");
CREATE INDEX IF NOT EXISTS idx_analysis_queues_user_id ON analysis_queues("userId");
`;

// 初始数据插入
const insertInitialDataSQL = `
-- 插入默认订阅等级
INSERT INTO subscription_tiers (name, "maxProjects", "maxLogEntries", "aiRequestsPerDay", "storageLimit", features, "monthlyPrice", "yearlyPrice")
VALUES 
    ('free', 5, 1000, 10, 1048576, ARRAY['基础功能', '邮件支持'], 0, 0),
    ('pro', 50, 10000, 100, 10485760, ARRAY['高级功能', 'AI智能分析', '优先支持'], 9.99, 99.99),
    ('enterprise', -1, -1, -1, -1, ARRAY['无限制功能', '定制开发', '专属支持'], 29.99, 299.99)
ON CONFLICT (name) DO NOTHING;

-- 插入测试用户（如果不存在）
INSERT INTO users (name, email, password, "subscriptionTier")
VALUES ('测试用户', 'wcy19960411@gmail.com', '$2b$10$hash', 'pro')
ON CONFLICT (email) DO NOTHING;
`;

async function initializeDatabase() {
  console.log('🚀 开始初始化数据库...\n');

  try {
    // 测试连接
    console.log('1️⃣ 测试数据库连接...');
    const client = await pool.connect();
    console.log('✅ 数据库连接成功');

    // 检查现有表
    console.log('\n2️⃣ 检查现有表...');
    const existingTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('现有表:', existingTables.rows.map(row => row.table_name));

    // 创建表
    console.log('\n3️⃣ 创建数据库表...');
    await client.query(createTablesSQL);
    console.log('✅ 数据库表创建完成');

    // 插入初始数据
    console.log('\n4️⃣ 插入初始数据...');
    await client.query(insertInitialDataSQL);
    console.log('✅ 初始数据插入完成');

    // 验证表创建
    console.log('\n5️⃣ 验证表创建...');
    const newTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('当前所有表:');
    newTables.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name}`);
    });

    // 检查用户表记录
    console.log('\n6️⃣ 检查用户表记录...');
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    console.log(`用户表记录数: ${userCount.rows[0].count}`);

    client.release();
    console.log('\n🎉 数据库初始化完成！');
    
  } catch (error) {
    console.error('\n❌ 数据库初始化失败:', error.message);
    console.error('详细错误:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// 运行初始化
initializeDatabase();