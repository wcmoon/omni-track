/**
 * 数据库状态检查脚本
 * 用于检查数据库连接和表结构
 * 使用方法: node check-database.js
 */

// 加载环境变量
try {
  require('dotenv').config();
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
  }
}

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ 错误: DATABASE_URL 环境变量未设置');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkDatabase() {
  console.log('🔍 检查数据库状态...\n');

  try {
    const client = await pool.connect();
    
    // 1. 测试连接
    console.log('1️⃣ 数据库连接状态:');
    const version = await client.query('SELECT version()');
    console.log('✅ PostgreSQL版本:', version.rows[0].version.split(' ')[0] + ' ' + version.rows[0].version.split(' ')[1]);
    
    // 2. 检查所有表
    console.log('\n2️⃣ 数据库表状态:');
    const tables = await client.query(`
      SELECT 
        schemaname,
        tablename,
        tableowner,
        hasindexes,
        hasrules,
        hastriggers
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    if (tables.rows.length === 0) {
      console.log('❌ 没有找到任何表');
    } else {
      tables.rows.forEach(table => {
        console.log(`✅ ${table.tablename}`);
      });
    }
    
    // 3. 检查必需的表
    console.log('\n3️⃣ 必需表检查:');
    const requiredTables = [
      'users', 'projects', 'tasks', 'logs', 'log_entries',
      'ai_interactions', 'subscription_tiers', 'user_subscriptions',
      'usage_quotas', 'analysis_queues'
    ];
    
    const existingTableNames = tables.rows.map(row => row.tablename);
    const missingTables = requiredTables.filter(table => !existingTableNames.includes(table));
    
    if (missingTables.length === 0) {
      console.log('✅ 所有必需的表都存在');
    } else {
      console.log('❌ 缺少以下表:');
      missingTables.forEach(table => {
        console.log(`   - ${table}`);
      });
    }
    
    // 4. 检查用户表数据
    if (existingTableNames.includes('users')) {
      console.log('\n4️⃣ 用户表数据:');
      const userCount = await client.query('SELECT COUNT(*) FROM users');
      console.log(`   用户总数: ${userCount.rows[0].count}`);
      
      if (parseInt(userCount.rows[0].count) > 0) {
        const users = await client.query('SELECT id, name, email, "subscriptionTier", "createdAt" FROM users LIMIT 5');
        console.log('   最近用户:');
        users.rows.forEach(user => {
          console.log(`   - ${user.email} (${user.subscriptionTier})`);
        });
      }
    }
    
    // 5. 检查TypeORM同步状态
    console.log('\n5️⃣ TypeORM配置检查:');
    console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
    
    const shouldSynchronize = process.env.NODE_ENV !== 'production';
    console.log(`   TypeORM同步: ${shouldSynchronize ? '✅ 启用' : '❌ 禁用'}`);
    
    if (!shouldSynchronize && missingTables.length > 0) {
      console.log('⚠️  生产环境下TypeORM同步已禁用，需要手动创建表');
    }
    
    client.release();
    
    // 6. 总结和建议
    console.log('\n📋 总结:');
    if (missingTables.length === 0) {
      console.log('✅ 数据库状态正常，所有表都存在');
    } else {
      console.log('❌ 数据库未完全初始化');
      console.log('\n💡 解决方案:');
      console.log('1. 运行初始化脚本: node init-database.js');
      console.log('2. 或重启应用让TypeORM自动同步（仅开发环境）');
      console.log('3. 或手动执行SQL创建表结构');
    }
    
  } catch (error) {
    console.error('\n❌ 数据库检查失败:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 数据库连接被拒绝，请检查:');
      console.log('   1. PostgreSQL服务是否运行');
      console.log('   2. DATABASE_URL配置是否正确');
      console.log('   3. 网络连接是否正常');
    } else if (error.code === '28P01') {
      console.log('💡 认证失败，请检查数据库用户名和密码');
    } else if (error.code === '3D000') {
      console.log('💡 数据库不存在，请先创建数据库');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

checkDatabase();