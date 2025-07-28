const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://wcmoon:wcn4911.@1.15.151.100:30002/timeweave'
});

const defaultUserId = '550e8400-e29b-41d4-a716-446655440000';

async function seedData() {
  try {
    await client.connect();
    console.log('Connected to database');

    // 清理现有数据
    await client.query('DELETE FROM tasks WHERE "userId" = $1', [defaultUserId]);
    await client.query('DELETE FROM logs WHERE "userId" = $1', [defaultUserId]);
    
    // 创建测试用户（如果不存在）
    await client.query(`
      INSERT INTO users (id, name, email, password, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO NOTHING
    `, [defaultUserId, '测试用户', 'test@example.com', 'hashedpassword', new Date(), new Date()]);
    
    // 插入测试任务
    const tasks = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        description: '完成项目报告',
        status: 'completed',
        priority: 'high',
        estimatedDuration: 120,
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 昨天（已完成）
        tags: '工作,报告',
        userId: defaultUserId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002', 
        description: '学习新技能',
        status: 'in_progress',
        priority: 'medium',
        estimatedDuration: 60,
        dueDate: new Date(), // 今天
        tags: '学习,技能',
        userId: defaultUserId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        description: '运动锻炼',
        status: 'pending',
        priority: 'low',
        estimatedDuration: 30,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 明天
        tags: '健康,运动',
        userId: defaultUserId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        description: '没有设置时间的任务',
        status: 'pending',
        priority: 'medium',
        estimatedDuration: 45,
        dueDate: null,
        tags: '其他',
        userId: defaultUserId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const task of tasks) {
      await client.query(`
        INSERT INTO tasks (id, description, status, priority, "estimatedDuration", "dueDate", tags, "userId", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [task.id, task.description, task.status, task.priority, task.estimatedDuration, task.dueDate, task.tags, task.userId, task.createdAt, task.updatedAt]);
    }

    // 插入测试日志
    const logs = [
      {
        id: '550e8400-e29b-41d4-a716-446655440101',
        content: '完成了项目报告，感觉非常有成就感！',
        type: '任务完成',
        tags: '工作,成就,任务完成',
        mood: 'good',
        energy: 'high',
        userId: defaultUserId,
        relatedTaskId: '550e8400-e29b-41d4-a716-446655440001',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440102',
        content: '学习了新的编程技巧',
        type: '学习',
        tags: '学习,编程',
        mood: 'good',
        energy: 'medium',
        userId: defaultUserId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440103',
        content: '今天的学习进展不错，掌握了新的概念',
        type: '学习进展',
        tags: '学习,进展',
        mood: 'good',
        energy: 'medium',
        userId: defaultUserId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const log of logs) {
      await client.query(`
        INSERT INTO logs (id, content, type, tags, mood, energy, "userId", "relatedTaskId", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [log.id, log.content, log.type, log.tags, log.mood, log.energy, log.userId, log.relatedTaskId || null, log.createdAt, log.updatedAt]);
    }

    console.log('Seed data inserted successfully');
    console.log(`Tasks created: ${tasks.length}`);
    console.log(`Logs created: ${logs.length}`);
    
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await client.end();
  }
}

seedData();