import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';

// 加载环境变量
try {
  const envFile = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
  } else {
    dotenv.config();
  }
} catch (error) {
  console.warn('加载环境变量时出错，将使用默认配置:', error.message);
}

// 创建数据源配置
const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_DATABASE || 'blog',
  entities: [__dirname + '/src/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/src/migration/*{.ts,.js}'],
  synchronize: false,
  logging: true,
  extra: {
    charset: 'utf8mb4_unicode_ci',
  },
});

// 使用路径与名称的对应关系进行修复
const pathToNameMap = {
  article: '博客管理',
  write: '发布文章',
  list: '文章列表',
  category: '分类管理',
  tag: '标签管理',
  'write/:articleId': '文章编辑',
  news: '消息管理',
  comment: '评论管理',
  message: '留言管理',
  system: '系统管理',
  menu: '菜单管理',
  role: '角色管理',
  user: '用户管理',
  file: '文件管理',
  api: '系统接口',
  log: '日志管理',
  operation: '操作日志',
  exception: '异常日志',
  visit: '访问日志',
  task: '任务日志',
  monitor: '系统监控',
  online: '在线用户',
  web: '网站管理',
  friend: '友链管理',
  talk: '说说管理',
  album: '相册管理',
  'photo/:albumId': '照片管理',
  site: '网站配置',
  carousel: '轮播图',
};

// 执行菜单名称修复
async function fixMenuNames() {
  try {
    console.log('正在初始化数据库连接...');
    await dataSource.initialize();
    console.log('数据库连接成功！');

    // 查询所有菜单
    const menus = await dataSource.query(
      'SELECT id, menu_name, path FROM t_menu WHERE path IS NOT NULL',
    );

    console.log(`找到 ${menus.length} 个带路径的菜单项`);

    // 遍历所有菜单，查找并修复乱码
    let updatedCount = 0;

    for (const menu of menus) {
      const menuId = menu.id;
      const menuName = menu.menu_name;
      const menuPath = menu.path;

      // 如果路径在映射表中存在且当前名称看起来像是乱码（包含问号或特殊字符），则进行修复
      if (
        menuPath &&
        pathToNameMap[menuPath] &&
        (menuName.includes('?') || /[^\u4e00-\u9fa5a-zA-Z0-9\s:_]/.test(menuName))
      ) {
        const correctName = pathToNameMap[menuPath];
        console.log(
          `修复菜单 ID: ${menuId}, 原名称: [${menuName}], 路径: [${menuPath}], 更新为: [${correctName}]`,
        );

        // 更新数据库
        await dataSource.query('UPDATE t_menu SET menu_name = ? WHERE id = ?', [
          correctName,
          menuId,
        ]);

        updatedCount++;
      }
    }

    // 根据ID修复特定的菜单
    const idToNameMap = {
      1: '博客管理',
      2: '发布文章',
      3: '分类管理',
      4: '标签管理',
      11: '系统管理',
      12: '菜单管理',
      13: '角色管理',
      14: '用户管理',
      21: '日志管理',
      22: '操作日志',
      23: '异常日志',
      26: '系统监控',
      27: '定时任务',
    };

    for (const [id, name] of Object.entries(idToNameMap)) {
      const result = await dataSource.query(
        'UPDATE t_menu SET menu_name = ? WHERE id = ? AND (menu_name LIKE "%??%" OR menu_name LIKE "%¦%")',
        [name, id],
      );

      if (result.affectedRows > 0) {
        console.log(`通过ID修复菜单，ID: ${id}, 名称: [${name}]`);
        updatedCount += result.affectedRows;
      }
    }

    console.log(`菜单修复完成！共修复 ${updatedCount} 个菜单名称。`);
  } catch (error) {
    console.error('菜单修复过程中出错:', error);
  } finally {
    // 关闭数据库连接
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('数据库连接已关闭');
    }
  }
}

// 执行脚本
fixMenuNames()
  .then(() => {
    console.log('菜单名称修复脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('菜单名称修复脚本执行失败:', error);
    process.exit(1);
  });
