/**
 * 更新CORS配置
 * 
 * 当前问题：
 * 1. CORS配置只包含localhost域名
 * 2. 需要添加生产环境域名和通配符支持
 */

console.log('📋 当前CORS配置问题：');
console.log('❌ 只允许了localhost源');
console.log('❌ 没有包含生产环境域名');
console.log('❌ 移动应用的capacitor://localhost未包含');

console.log('\n💡 建议修改 src/main.ts 中的CORS配置：');
console.log(`
// 启用CORS
app.enableCors({
  origin: [
    'http://localhost:3000',
    'http://localhost:8081', 
    'http://localhost:19006',
    'http://localhost:19000', // Expo
    'capacitor://localhost',  // Capacitor iOS/Android
    'http://localhost',       // 通用localhost
    'https://app.timeweave.xyz', // 生产环境Web应用
    'https://timeweave.xyz',     // 主域名
    // 或者使用函数动态判断
    // (origin, callback) => {
    //   // 允许所有localhost和生产域名
    //   if (!origin || origin.includes('localhost') || origin.includes('timeweave.xyz')) {
    //     callback(null, true);
    //   } else {
    //     callback(new Error('Not allowed by CORS'));
    //   }
    // }
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
});
`);

console.log('\n🔧 临时解决方案（开发测试用）：');
console.log('在main.ts中使用通配符允许所有源：');
console.log(`
app.enableCors({
  origin: true, // 允许所有源（仅用于开发测试！）
  credentials: true,
});
`);

console.log('\n📱 针对移动应用的特殊处理：');
console.log('React Native/Expo应用可能不发送Origin头');
console.log('建议在生产环境配置Nginx来处理CORS');

console.log('\n📝 Nginx配置示例（添加到server块）：');
console.log(`
# CORS配置
add_header 'Access-Control-Allow-Origin' '$http_origin' always;
add_header 'Access-Control-Allow-Credentials' 'true' always;
add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
add_header 'Access-Control-Allow-Headers' 'Accept,Authorization,Cache-Control,Content-Type,DNT,If-Modified-Since,Keep-Alive,Origin,User-Agent,X-Requested-With' always;

# 处理OPTIONS预检请求
if ($request_method = 'OPTIONS') {
    add_header 'Access-Control-Max-Age' 1728000;
    add_header 'Content-Type' 'text/plain charset=UTF-8';
    add_header 'Content-Length' 0;
    return 204;
}
`);