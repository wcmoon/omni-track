/**
 * 数据库重置和初始化脚本
 * 一步完成：清除所有表 -> 重新创建表结构 -> 插入初始数据
 * 使用方法: node reset-database.js
 */

// 加载环境变量
try {
  require('dotenv').config();
  console.log('📄 已加载 .env 文件');
} catch (e) {
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

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ 错误: DATABASE_URL 环境变量未设置');
  process.exit(1);
}

console.log('🔗 数据库连接:', DATABASE_URL.replace(/\/\/.*:.*@/, '//***:***@'));

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function resetDatabase() {
  console.log('🔥 开始重置数据库...\n');

  const client = await pool.connect();

  try {
    // 1. 清除所有表
    console.log('1️⃣ 清除现有表...');
    await client.query(`
      DROP TABLE IF EXISTS analysis_queues CASCADE;
      DROP TABLE IF EXISTS usage_quotas CASCADE;
      DROP TABLE IF EXISTS user_subscriptions CASCADE;
      DROP TABLE IF EXISTS subscription_tiers CASCADE;
      DROP TABLE IF EXISTS ai_interactions CASCADE;
      DROP TABLE IF EXISTS log_entries CASCADE;
      DROP TABLE IF EXISTS logs CASCADE;
      DROP TABLE IF EXISTS tasks CASCADE;
      DROP TABLE IF EXISTS projects CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);
    console.log('✅ 所有表已清除');

    // 2. 创建完整的表结构（基于实体定义）
    console.log('\n2️⃣ 创建新的表结构...');
    
    // 用户表
    await client.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
      )
    `);
    console.log('  ✅ users 表');

    // 项目表
    await client.query(`
      CREATE TABLE projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        color VARCHAR(7) DEFAULT '#6366f1',
        "isActive" BOOLEAN DEFAULT true,
        "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✅ projects 表');

    // 任务表（基于实体定义的完整字段）
    await client.query(`
      CREATE TABLE tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        description TEXT NOT NULL,
        title VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
        priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
        "completionTime" TIMESTAMP,
        "dueDate" TIMESTAMP,
        "endTime" VARCHAR(10),
        "estimatedDuration" INTEGER,
        "actualDuration" INTEGER,
        tags TEXT[],
        "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "projectId" UUID REFERENCES projects(id) ON DELETE SET NULL,
        "parentTaskId" UUID REFERENCES tasks(id) ON DELETE SET NULL,
        "isRecurring" BOOLEAN DEFAULT false,
        "recurrencePattern" JSONB,
        "aiGenerated" BOOLEAN DEFAULT false,
        "aiContext" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "completedAt" TIMESTAMP
      )
    `);
    console.log('  ✅ tasks 表');

    // 日志表
    await client.query(`
      CREATE TABLE logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255),
        content TEXT NOT NULL,
        category VARCHAR(100),
        mood VARCHAR(50),
        tags TEXT[],
        "isPrivate" BOOLEAN DEFAULT false,
        "projectId" UUID REFERENCES projects(id) ON DELETE SET NULL,
        "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✅ logs 表');

    // 日志条目表
    await client.query(`
      CREATE TABLE log_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content TEXT NOT NULL,
        "logId" UUID REFERENCES logs(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✅ log_entries 表');

    // AI交互表
    await client.query(`
      CREATE TABLE ai_interactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
        query TEXT NOT NULL,
        response TEXT NOT NULL,
        "modelUsed" VARCHAR(100),
        "tokensUsed" INTEGER DEFAULT 0,
        "responseTime" INTEGER DEFAULT 0,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✅ ai_interactions 表');

    // 订阅等级表
    await client.query(`
      CREATE TABLE subscription_tiers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL UNIQUE,
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
      )
    `);
    console.log('  ✅ subscription_tiers 表');

    // 用户订阅表
    await client.query(`
      CREATE TABLE user_subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
        "subscriptionTierId" UUID REFERENCES subscription_tiers(id),
        "startDate" TIMESTAMP NOT NULL,
        "endDate" TIMESTAMP,
        "isActive" BOOLEAN DEFAULT true,
        "paymentMethod" VARCHAR(100),
        "paymentId" VARCHAR(255),
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✅ user_subscriptions 表');

    // 使用配额表
    await client.query(`
      CREATE TABLE usage_quotas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
        "quotaType" VARCHAR(100) NOT NULL,
        "usedAmount" INTEGER DEFAULT 0,
        "limitAmount" INTEGER NOT NULL,
        "resetDate" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✅ usage_quotas 表');

    // 分析队列表
    await client.query(`
      CREATE TABLE analysis_queues (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
        "itemType" VARCHAR(100) NOT NULL,
        "itemId" UUID NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        "analysisType" VARCHAR(100) NOT NULL,
        result JSONB,
        error TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✅ analysis_queues 表');

    // 3. 创建索引
    console.log('\n3️⃣ 创建索引...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects("userId")',
      'CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks("userId")',
      'CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks("projectId")',
      'CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)',
      'CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs("userId")',
      'CREATE INDEX IF NOT EXISTS idx_logs_project_id ON logs("projectId")',
      'CREATE INDEX IF NOT EXISTS idx_log_entries_log_id ON log_entries("logId")',
      'CREATE INDEX IF NOT EXISTS idx_ai_interactions_user_id ON ai_interactions("userId")',
      'CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions("userId")',
      'CREATE INDEX IF NOT EXISTS idx_usage_quotas_user_id ON usage_quotas("userId")',
      'CREATE INDEX IF NOT EXISTS idx_analysis_queues_user_id ON analysis_queues("userId")'
    ];

    for (const indexSQL of indexes) {
      await client.query(indexSQL);
    }
    console.log('✅ 索引创建完成');

    // 4. 插入初始数据
    console.log('\n4️⃣ 插入初始数据...');
    
    // 插入订阅等级
    await client.query(`
      INSERT INTO subscription_tiers (name, "maxProjects", "maxLogEntries", "aiRequestsPerDay", "storageLimit", features, "monthlyPrice", "yearlyPrice")
      VALUES 
        ('free', 5, 1000, 10, 1048576, ARRAY['基础功能', '邮件支持'], 0, 0),
        ('pro', 50, 10000, 100, 10485760, ARRAY['高级功能', 'AI智能分析', '优先支持'], 9.99, 99.99),
        ('enterprise', -1, -1, -1, -1, ARRAY['无限制功能', '定制开发', '专属支持'], 29.99, 299.99)
    `);
    console.log('✅ 订阅等级数据');

    // 5. 验证
    console.log('\n5️⃣ 验证表创建...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log(`已创建 ${tables.rows.length} 个表:`);
    tables.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name}`);
    });

    // 检查订阅等级数据
    const tierCount = await client.query('SELECT COUNT(*) FROM subscription_tiers');
    console.log(`\n📊 订阅等级数量: ${tierCount.rows[0].count}`);

    console.log('\n🎉 数据库重置完成！');

  } catch (error) {
    console.error('\n❌ 数据库重置失败:', error.message);
    console.error('详细错误:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// 运行重置
resetDatabase();