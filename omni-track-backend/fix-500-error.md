# 修复500错误指南

## 问题诊断

1. **路径正确性**
   - ✅ 正确路径: `https://api.timeweave.xyz/api/auth/send-verification-code`
   - ❌ 错误路径: `https://api.timeweave.xyz/auth/send-verification-code` (缺少/api前缀)

2. **500错误可能原因**
   - CORS配置问题（最可能）
   - 环境变量未加载
   - 数据库连接问题
   - 邮件服务配置问题

## 立即修复步骤

### 1. 检查PM2日志
```bash
pm2 logs --lines 100
# 或查看具体应用
pm2 logs omni-track-backend --lines 100
```

### 2. 检查环境变量状态
```bash
# 在服务器上运行
curl http://localhost:3001/api/auth/test-credentials
```

### 3. 临时修复CORS（在服务器上）
编辑 `src/main.ts`:
```typescript
// 临时允许所有源（仅测试用）
app.enableCors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
});
```

然后重新构建和启动：
```bash
npm run build
pm2 restart omni-track-backend
```

### 4. 更新Nginx配置
在 `/etc/nginx/sites-available/api.timeweave.xyz` 中添加：

```nginx
location /api {
    # CORS Headers
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Accept,Authorization,Cache-Control,Content-Type,DNT,If-Modified-Since,Keep-Alive,Origin,User-Agent,X-Requested-With' always;
        add_header 'Access-Control-Max-Age' 1728000;
        add_header 'Content-Type' 'text/plain charset=UTF-8';
        add_header 'Content-Length' 0;
        return 204;
    }
    
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Accept,Authorization,Cache-Control,Content-Type,DNT,If-Modified-Since,Keep-Alive,Origin,User-Agent,X-Requested-With' always;
    
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

重载Nginx：
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 5. 测试修复效果
```bash
# 运行测试脚本
./test-email-endpoint.sh
```

## 永久解决方案

更新 `src/main.ts` 添加所有需要的域名：
```typescript
app.enableCors({
  origin: [
    'http://localhost:3000',
    'http://localhost:8081',
    'http://localhost:19006',
    'http://localhost:19000',
    'http://localhost',
    'capacitor://localhost',
    'https://app.timeweave.xyz',
    'https://timeweave.xyz',
    /^http:\/\/localhost:\d+$/, // 匹配所有localhost端口
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
});
```

## 调试命令汇总
```bash
# 查看实时日志
pm2 logs --lines 100

# 测试本地API
curl -X POST http://localhost:3001/api/auth/send-verification-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# 测试远程API
curl -X POST https://api.timeweave.xyz/api/auth/send-verification-code \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8081" \
  -d '{"email":"test@example.com"}'

# 查看Nginx错误日志
sudo tail -f /var/log/nginx/error.log
```