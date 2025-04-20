/*
 Navicat Premium Data Transfer

 Source Server         : localhost
 Source Server Type    : MySQL
 Source Server Version : 80035
 Source Host           : localhost:3306
 Source Schema         : blog

 Target Server Type    : MySQL
 Target Server Version : 80035
 File Encoding         : 65001

 Date: 06/11/2024 15:06:18
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for t_album
-- ----------------------------
DROP TABLE IF EXISTS `t_album`;
CREATE TABLE `t_album`  (
  `id` int(0) NOT NULL AUTO_INCREMENT COMMENT '相册id',
  `album_name` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '相册名',
  `album_cover` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '相册封面',
  `album_desc` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '相册描述',
  `status` tinyint(1) NOT NULL DEFAULT 1 COMMENT '状态 (1公开 2私密)',
  `create_time` datetime(0) NOT NULL COMMENT '创建时间',
  `update_time` datetime(0) NULL DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '-------相册表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of t_album
-- ----------------------------

-- ----------------------------
-- Table structure for t_article
-- ----------------------------
DROP TABLE IF EXISTS `t_article`;
CREATE TABLE `t_article`  (
  `id` int(0) NOT NULL AUTO_INCREMENT COMMENT '文章id',
  `user_id` int(0) NOT NULL COMMENT '作者id',
  `category_id` int(0) NOT NULL COMMENT '分类id',
  `article_cover` varchar(1024) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '缩略图',
  `article_title` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '文章标题',
  `article_desc` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '' COMMENT '文章摘要',
  `article_content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '文章内容',
  `article_type` tinyint(1) NOT NULL DEFAULT 1 COMMENT '类型 (1原创 2转载 3翻译)',
  `is_top` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否置顶 (0否 1是）',
  `is_delete` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否删除 (0否 1是)',
  `is_recommend` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否推荐 (0否 1是)',
  `status` tinyint(1) NOT NULL DEFAULT 1 COMMENT '状态 (1公开 2私密 3评论可见)',
  `create_time` datetime(0) NOT NULL COMMENT '发表时间',
  `update_time` datetime(0) NULL DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 73 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '-------文章表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of t_article
-- ----------------------------

-- ----------------------------
-- Table structure for t_article_tag
-- ----------------------------
DROP TABLE IF EXISTS `t_article_tag`;
CREATE TABLE `t_article_tag`  (
  `id` int(0) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `article_id` int(0) NOT NULL COMMENT '文章id',
  `tag_id` int(0) NOT NULL COMMENT '标签id',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 112 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '-------文章标签关联表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of t_article_tag
-- ----------------------------

-- ----------------------------
-- Table structure for t_blog_file
-- ----------------------------
DROP TABLE IF EXISTS `t_blog_file`;
CREATE TABLE `t_blog_file`  (
  `id` int(0) NOT NULL AUTO_INCREMENT COMMENT '文件id',
  `file_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '文件url',
  `file_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '文件名',
  `file_size` int(0) NOT NULL DEFAULT 0 COMMENT '文件大小',
  `extend_name` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '' COMMENT '文件类型',
  `file_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '文件路径',
  `is_dir` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否为目录 (0否 1是)',
  `create_time` datetime(0) NOT NULL COMMENT '创建时间',
  `update_time` datetime(0) NULL DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 129 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '-------文件表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of t_blog_file
-- ----------------------------

-- ----------------------------
-- Table structure for t_carousel
-- ----------------------------
DROP TABLE IF EXISTS `t_carousel`;
CREATE TABLE `t_carousel`  (
  `id` int(0) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `img_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '' COMMENT '轮播图地址',
  `status` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否显示 (0否 1是)',
  `remark` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '备注',
  `create_time` datetime(0) NOT NULL COMMENT '创建时间',
  `update_time` datetime(0) NULL DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '-------首页轮播图表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of t_carousel
-- ----------------------------

-- ----------------------------
-- Table structure for t_category
-- ----------------------------
DROP TABLE IF EXISTS `t_category`;
CREATE TABLE `t_category`  (
  `id` int(0) NOT NULL AUTO_INCREMENT COMMENT '分类id',
  `parent_id` int(0) NOT NULL DEFAULT 0 COMMENT '父级id',
  `category_name` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '分类名',
  `create_time` datetime(0) NOT NULL COMMENT '创建时间',
  `update_time` datetime(0) NULL DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 52 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '-------分类表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of t_category
-- ----------------------------

-- ----------------------------
-- Table structure for t_chat_record
-- ----------------------------
DROP TABLE IF EXISTS `t_chat_record`;
CREATE TABLE `t_chat_record`  (
  `id` int(0) NOT NULL AUTO_INCREMENT COMMENT '聊天记录id',
  `user_id` int(0) NULL DEFAULT NULL COMMENT '用户id',
  `nickname` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '用户昵称',
  `avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '头像',
  `content` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '聊天内容',
  `ip_address` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'ip地址',
  `ip_source` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'ip来源',
  `create_time` datetime(0) NOT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '-------聊天记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of t_chat_record
-- ----------------------------

-- ----------------------------
-- Table structure for t_comment
-- ----------------------------
DROP TABLE IF EXISTS `t_comment`;
CREATE TABLE `t_comment`  (
  `id` int(0) NOT NULL AUTO_INCREMENT COMMENT '评论id',
  `comment_type` tinyint(1) NOT NULL COMMENT '类型 (1文章 2友链 3说说)',
  `type_id` int(0) NULL DEFAULT NULL COMMENT '类型id (类型为友链则没有值)',
  `parent_id` int(0) NULL DEFAULT NULL COMMENT '父评论id',
  `reply_id` int(0) NULL DEFAULT NULL COMMENT '回复评论id',
  `comment_content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '评论内容',
  `from_uid` int(0) NOT NULL COMMENT '评论用户id',
  `to_uid` int(0) NULL DEFAULT NULL COMMENT '回复用户id',
  `is_check` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否通过 (0否 1是)',
  `create_time` datetime(0) NOT NULL COMMENT '评论时间',
  `update_time` datetime(0) NULL DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '-------评论表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of t_comment
-- ----------------------------

-- ----------------------------
-- Table structure for t_exception_log
-- ----------------------------
DROP TABLE IF EXISTS `t_exception_log`;
CREATE TABLE `t_exception_log`  (
  `id` int(0) NOT NULL AUTO_INCREMENT COMMENT '异常id',
  `module` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '异常模块',
  `uri` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '异常uri',
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '异常名称',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '操作描述',
  `error_method` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '异常方法',
  `message` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '异常信息',
  `params` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '请求参数',
  `request_method` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '请求方式',
  `ip_address` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '操作ip',
  `ip_source` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '操作地址',
  `os` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '操作系统',
  `browser` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '浏览器',
  `create_time` datetime(0) NOT NULL COMMENT '操作时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 287 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '-------异常日志表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of t_exception_log
-- ----------------------------

-- ----------------------------
-- Table structure for t_friend
-- ----------------------------
DROP TABLE IF EXISTS `t_friend`;
CREATE TABLE `t_friend`  (
  `id` int(0) NOT NULL AUTO_INCREMENT COMMENT '友链id',
  `name` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '友链名称',
  `color` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '友链颜色',
  `avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '友链头像',
  `url` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '友链地址',
  `introduction` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '友链介绍',
  `create_time` datetime(0) NOT NULL COMMENT '创建时间',
  `update_time` datetime(0) NULL DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `friend_user`(`name`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '-------友链表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of t_friend
-- ----------------------------

-- ----------------------------
-- Table structure for t_menu
-- ----------------------------
DROP TABLE IF EXISTS `t_menu`;
CREATE TABLE `t_menu`  (
  `id` int(0) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `parent_id` int(0) NOT NULL DEFAULT 0 COMMENT '父菜单id (paren_id为0且type为M则是一级菜单)',
  `menu_type` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '权限类型 (M目录 C菜单 B按钮)',
  `menu_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '名称',
  `path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '路由地址',
  `icon` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '菜单图标',
  `component` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '菜单组件',
  `perms` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '权限标识',
  `is_hidden` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否隐藏 (0否 1是)',
  `is_disable` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否禁用 (0否 1是)',
  `order_num` int(0) NOT NULL DEFAULT 1 COMMENT '排序',
  `create_time` datetime(0) NOT NULL COMMENT '创建时间',
  `update_time` datetime(0) NULL DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 135 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '-------菜单表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of t_menu
-- ----------------------------
INSERT INTO `t_menu` VALUES (1, 0, 'M', '文章管理', 'article', 'archives', '', '', 0, 0, 1, '2022-12-04 09:13:31', '2023-02-21 15:36:45');
INSERT INTO `t_menu` VALUES (3, 1, 'C', '分类管理', 'category', 'category', '/blog/category/index', 'blog:category:list', 0, 0, 3, '2022-12-04 09:22:20', '2023-02-21 15:21:19');
INSERT INTO `t_menu` VALUES (4, 1, 'C', '标签管理', 'tag', 'tag', '/blog/tag/index', 'blog:tag:list', 0, 0, 4, '2022-12-04 09:23:01', '2023-02-21 15:21:23');
INSERT INTO `t_menu` VALUES (5, 3, 'B', '添加分类', NULL, NULL, NULL, 'blog:category:add', 0, 0, 1, '2022-12-04 09:30:55', NULL);
INSERT INTO `t_menu` VALUES (6, 3, 'B', '删除分类', NULL, NULL, NULL, 'blog:category:delete', 0, 0, 2, '2022-12-04 09:32:15', '2022-12-26 15:39:20');
INSERT INTO `t_menu` VALUES (7, 3, 'B', '修改分类', NULL, NULL, NULL, 'blog:category:update', 0, 0, 3, '2022-12-04 09:33:52', NULL);
INSERT INTO `t_menu` VALUES (8, 4, 'B', '添加标签', NULL, NULL, '', 'blog:tag:add', 0, 0, 1, '2022-12-04 10:19:51', NULL);
INSERT INTO `t_menu` VALUES (9, 4, 'B', '删除标签', NULL, NULL, NULL, 'blog:tag:delete', 0, 0, 2, '2022-12-04 10:20:41', NULL);
INSERT INTO `t_menu` VALUES (10, 4, 'B', '修改标签', NULL, NULL, NULL, 'blog:tag:update', 0, 0, 3, '2022-12-04 10:21:32', NULL);
INSERT INTO `t_menu` VALUES (11, 0, 'M', '系统管理', 'system', 'system', '', '', 0, 0, 3, '2022-12-06 10:58:50', '2023-01-03 18:47:19');
INSERT INTO `t_menu` VALUES (12, 11, 'C', '菜单管理', 'menu', 'tree-table', '/system/menu/index', 'system:menu:list', 0, 0, 1, '2022-12-06 16:33:56', NULL);
INSERT INTO `t_menu` VALUES (13, 11, 'C', '角色管理', 'role', 'peoples', '/system/role/index', 'system:role:list', 0, 0, 2, '2022-12-06 17:09:55', NULL);
INSERT INTO `t_menu` VALUES (14, 11, 'C', '用户管理', 'user', 'user', '/system/user/index', 'system:user:list', 0, 0, 3, '2022-12-06 17:10:28', NULL);
INSERT INTO `t_menu` VALUES (15, 12, 'B', '添加菜单', NULL, '', NULL, 'system:menu:add', 0, 0, 1, '2022-12-07 10:50:22', NULL);
INSERT INTO `t_menu` VALUES (16, 12, 'B', '删除菜单', NULL, '', NULL, 'system:menu:delete', 0, 0, 2, '2022-12-07 10:50:54', NULL);
INSERT INTO `t_menu` VALUES (17, 12, 'B', '修改菜单', NULL, '', NULL, 'system:menu:update', 0, 0, 3, '2022-12-07 10:55:21', NULL);
INSERT INTO `t_menu` VALUES (18, 13, 'B', '添加角色', NULL, NULL, NULL, 'system:role:add', 0, 0, 1, '2022-12-07 10:56:24', NULL);
INSERT INTO `t_menu` VALUES (19, 13, 'B', '删除角色', NULL, NULL, NULL, 'system:role:delete', 0, 0, 2, '2022-12-07 10:56:50', NULL);
INSERT INTO `t_menu` VALUES (20, 13, 'B', '修改角色', NULL, NULL, NULL, 'system:role:update', 0, 0, 3, '2022-12-07 10:57:15', NULL);
INSERT INTO `t_menu` VALUES (21, 0, 'M', '日志管理', 'log', 'log', '', '', 0, 0, 4, '2022-12-21 17:36:39', '2023-02-21 15:20:13');
INSERT INTO `t_menu` VALUES (22, 21, 'C', '操作日志', 'operation', 'form', '/system/log/operation', 'log:operation:list', 0, 0, 1, '2022-12-21 20:14:01', NULL);
INSERT INTO `t_menu` VALUES (23, 21, 'C', '异常日志', 'exception', 'bug', '/system/log/exception', 'log:exception:list', 0, 0, 2, '2022-12-21 20:48:25', NULL);
INSERT INTO `t_menu` VALUES (24, 22, 'B', '删除操作日志', NULL, NULL, NULL, 'log:operation:delete', 0, 0, 1, '2022-12-26 16:43:00', NULL);
INSERT INTO `t_menu` VALUES (25, 23, 'B', '删除异常日志', NULL, NULL, NULL, 'log:exception:delete', 0, 0, 1, '2022-12-27 13:21:50', NULL);
INSERT INTO `t_menu` VALUES (26, 0, 'M', '系统监控', 'monitor', 'monitor', NULL, '', 0, 0, 5, '2022-12-27 13:23:29', '2023-01-03 18:47:27');
INSERT INTO `t_menu` VALUES (27, 26, 'C', '定时任务', 'task', 'job', '/monitor/task/index', 'monitor:task:list', 0, 0, 2, '2022-12-27 13:26:29', '2023-01-01 21:08:35');
INSERT INTO `t_menu` VALUES (28, 27, 'B', '添加任务', NULL, NULL, NULL, 'monitor:task:add', 0, 0, 1, '2022-12-27 13:32:42', NULL);
INSERT INTO `t_menu` VALUES (29, 27, 'B', '修改任务', NULL, NULL, NULL, 'monitor:task:update', 0, 0, 2, '2022-12-27 13:33:45', NULL);
INSERT INTO `t_menu` VALUES (30, 27, 'B', '删除任务', NULL, NULL, NULL, 'monitor:task:delete', 0, 0, 3, '2022-12-27 13:34:29', NULL);
INSERT INTO `t_menu` VALUES (31, 27, 'B', '修改任务状态', NULL, NULL, NULL, 'monitor:task:status', 0, 0, 4, '2022-12-27 13:43:24', NULL);
INSERT INTO `t_menu` VALUES (32, 27, 'B', '运行任务', NULL, NULL, NULL, 'monitor:task:run', 0, 0, 5, '2022-12-27 13:45:34', NULL);
INSERT INTO `t_menu` VALUES (33, 13, 'B', '修改角色状态', NULL, NULL, NULL, 'system:role:status', 0, 0, 4, '2022-12-27 13:46:39', NULL);
INSERT INTO `t_menu` VALUES (34, 0, 'M', '网站管理', 'web', 'international', NULL, '', 0, 0, 6, '2022-12-30 17:22:33', '2023-02-14 09:46:29');
INSERT INTO `t_menu` VALUES (35, 34, 'C', '友链管理', 'friend', 'friend', '/web/friend/index', 'web:friend:list', 0, 0, 1, '2022-12-30 17:33:15', NULL);
INSERT INTO `t_menu` VALUES (36, 0, 'M', '消息管理', 'news', 'email', NULL, '', 0, 0, 2, '2022-12-30 17:50:06', '2022-12-30 18:02:12');
INSERT INTO `t_menu` VALUES (37, 36, 'C', '留言管理', 'message', 'form', '/news/message/index', 'news:message:list', 0, 0, 2, '2022-12-30 17:58:25', '2022-12-30 18:01:47');
INSERT INTO `t_menu` VALUES (38, 36, 'C', '评论管理', 'comment', 'comment', '/news/comment/index', 'news:comment:list', 0, 0, 1, '2022-12-30 17:59:37', '2022-12-30 18:03:35');
INSERT INTO `t_menu` VALUES (39, 35, 'B', '添加友链', NULL, NULL, NULL, 'web:friend:add', 0, 0, 1, '2022-12-30 18:56:22', NULL);
INSERT INTO `t_menu` VALUES (40, 35, 'B', '删除友链', NULL, NULL, NULL, 'web:friend:delete', 0, 0, 2, '2022-12-30 18:56:42', NULL);
INSERT INTO `t_menu` VALUES (41, 35, 'B', '修改友链', NULL, NULL, NULL, 'web:friend:update', 0, 0, 3, '2022-12-30 18:57:08', NULL);
INSERT INTO `t_menu` VALUES (42, 37, 'B', '删除留言', NULL, NULL, NULL, 'news:message:delete', 0, 0, 1, '2022-12-30 22:05:53', NULL);
INSERT INTO `t_menu` VALUES (45, 37, 'B', '审核留言', NULL, NULL, NULL, 'news:message:pass', 0, 0, 2, '2022-12-30 22:29:24', NULL);
INSERT INTO `t_menu` VALUES (46, 34, 'C', '网站配置', 'site', 'example', '/web/site/index', 'web:site:list', 0, 0, 5, '2022-12-31 11:50:45', '2023-01-03 18:49:17');
INSERT INTO `t_menu` VALUES (51, 34, 'C', '相册管理', 'album', 'album', '/web/album/index', 'web:album:list', 0, 0, 3, '2023-01-01 18:16:40', '2023-01-03 18:49:06');
INSERT INTO `t_menu` VALUES (52, 34, 'C', '照片管理', 'photo/:albumId', 'photo', '/web/photo/index', 'web:photo:list', 1, 0, 4, '2023-01-01 18:18:11', '2023-01-01 18:39:22');
INSERT INTO `t_menu` VALUES (53, 26, 'C', '在线用户', 'online', 'online', '/monitor/online/index', 'monitor:online:list', 0, 0, 1, '2023-01-01 21:07:48', '2023-01-01 21:08:29');
INSERT INTO `t_menu` VALUES (54, 51, 'B', '添加相册', NULL, NULL, NULL, 'web:album:add', 0, 0, 1, '2023-01-02 19:01:33', NULL);
INSERT INTO `t_menu` VALUES (55, 51, 'B', '删除相册', NULL, NULL, NULL, 'web:album:delete', 0, 0, 2, '2023-01-02 19:02:03', NULL);
INSERT INTO `t_menu` VALUES (56, 51, 'B', '修改相册', NULL, NULL, NULL, 'web:album:update', 0, 0, 3, '2023-01-02 19:02:50', NULL);
INSERT INTO `t_menu` VALUES (57, 51, 'B', '编辑相册', NULL, NULL, NULL, 'web:album:edit', 0, 0, 4, '2023-01-02 19:03:40', NULL);
INSERT INTO `t_menu` VALUES (58, 51, 'B', '上传相册封面', NULL, NULL, NULL, 'web:album:upload', 0, 0, 5, '2023-01-02 19:04:38', NULL);
INSERT INTO `t_menu` VALUES (60, 12, 'B', '编辑菜单', NULL, NULL, NULL, 'system:menu:edit', 0, 0, 4, '2023-01-03 18:29:57', NULL);
INSERT INTO `t_menu` VALUES (61, 34, 'C', '说说管理', 'talk', 'talk', '/web/talk/index', 'web:talk:list', 0, 0, 2, '2023-01-03 18:48:28', '2023-01-03 18:48:41');
INSERT INTO `t_menu` VALUES (62, 61, 'B', '添加说说', NULL, NULL, NULL, 'web:talk:add', 0, 0, 1, '2023-01-05 19:16:42', NULL);
INSERT INTO `t_menu` VALUES (63, 61, 'B', '删除说说', NULL, NULL, NULL, 'web:talk:delete', 0, 0, 2, '2023-01-05 19:17:07', NULL);
INSERT INTO `t_menu` VALUES (64, 61, 'B', '修改说说', NULL, NULL, NULL, 'web:talk:update', 0, 0, 3, '2023-01-05 19:17:36', NULL);
INSERT INTO `t_menu` VALUES (65, 61, 'B', '编辑说说', NULL, NULL, NULL, 'web:talk:edit', 0, 0, 4, '2023-01-05 19:18:27', NULL);
INSERT INTO `t_menu` VALUES (66, 61, 'B', '上传说说图片', NULL, NULL, NULL, 'web:talk:upload', 0, 0, 5, '2023-01-05 19:18:52', NULL);
INSERT INTO `t_menu` VALUES (67, 46, 'B', '修改网站配置', NULL, NULL, NULL, 'web:site:update', 0, 0, 1, '2023-01-08 09:15:56', NULL);
INSERT INTO `t_menu` VALUES (68, 46, 'B', '上传网站配置图片', NULL, NULL, NULL, 'web:site:upload', 0, 0, 2, '2023-01-08 14:53:16', NULL);
INSERT INTO `t_menu` VALUES (69, 14, 'B', '修改用户', NULL, NULL, NULL, 'system:user:update', 0, 0, 1, '2023-01-09 17:03:18', NULL);
INSERT INTO `t_menu` VALUES (70, 14, 'B', '修改用户状态', NULL, NULL, NULL, 'system:user:status', 0, 0, 2, '2023-01-09 17:03:51', NULL);
INSERT INTO `t_menu` VALUES (71, 53, 'B', '下线用户', NULL, NULL, NULL, 'monitor:online:kick', 0, 0, 1, '2023-01-09 19:18:33', NULL);
INSERT INTO `t_menu` VALUES (73, 1, 'C', '文章列表', 'list', 'chart', '/blog/article/list', 'blog:article:list', 0, 0, 2, '2023-01-10 17:37:29', '2023-02-21 15:36:09');
INSERT INTO `t_menu` VALUES (76, 52, 'B', '添加照片', NULL, NULL, NULL, 'web:photo:add', 0, 0, 1, '2023-01-11 18:45:28', NULL);
INSERT INTO `t_menu` VALUES (77, 52, 'B', '删除照片', NULL, NULL, NULL, 'web:photo:delete', 0, 0, 2, '2023-01-11 18:45:51', NULL);
INSERT INTO `t_menu` VALUES (78, 52, 'B', '修改照片', NULL, NULL, NULL, 'web:photo:update', 0, 0, 3, '2023-01-11 18:46:12', NULL);
INSERT INTO `t_menu` VALUES (79, 52, 'B', '上传照片', NULL, NULL, NULL, 'web:photo:upload', 0, 0, 3, '2023-01-11 18:46:48', NULL);
INSERT INTO `t_menu` VALUES (80, 73, 'B', '添加文章', NULL, NULL, NULL, 'blog:article:add', 0, 0, 1, '2023-01-14 15:25:29', NULL);
INSERT INTO `t_menu` VALUES (81, 73, 'B', '物理删除文章', NULL, NULL, NULL, 'blog:article:delete', 0, 0, 2, '2023-01-14 15:26:44', NULL);
INSERT INTO `t_menu` VALUES (82, 73, 'B', '逻辑删除文章', NULL, NULL, NULL, 'blog:article:recycle', 0, 0, 3, '2023-01-14 15:28:32', NULL);
INSERT INTO `t_menu` VALUES (83, 73, 'B', '更新文章', NULL, NULL, NULL, 'blog:article:update', 0, 0, 4, '2023-01-14 15:30:11', NULL);
INSERT INTO `t_menu` VALUES (84, 73, 'B', '编辑文章', NULL, NULL, NULL, 'blog:article:edit', 0, 0, 5, '2023-01-14 15:32:34', '2023-01-14 15:32:54');
INSERT INTO `t_menu` VALUES (85, 73, 'B', '上传文章图片', NULL, NULL, NULL, 'blog:article:upload', 0, 0, 6, '2023-01-14 15:34:05', '2023-01-15 11:19:13');
INSERT INTO `t_menu` VALUES (86, 73, 'B', '置顶文章', NULL, NULL, NULL, 'blog:article:top', 0, 0, 7, '2023-01-14 15:35:33', NULL);
INSERT INTO `t_menu` VALUES (87, 73, 'B', '推荐文章', NULL, NULL, NULL, 'blog:article:recommend', 0, 0, 8, '2023-01-14 15:36:08', NULL);
INSERT INTO `t_menu` VALUES (88, 73, 'B', '点赞文章', NULL, NULL, NULL, 'blog:article:like', 0, 0, 9, '2023-01-14 15:36:39', NULL);
INSERT INTO `t_menu` VALUES (93, 21, 'C', '访问日志', 'visit', 'logininfor', '/system/log/visit', 'log:visit:list', 0, 0, 3, '2023-01-28 19:04:09', '2023-01-28 19:06:52');
INSERT INTO `t_menu` VALUES (94, 93, 'B', '删除访问日志', NULL, NULL, NULL, 'log:visit:delete', 0, 0, 1, '2023-01-28 19:05:31', NULL);
INSERT INTO `t_menu` VALUES (95, 14, 'B', '修改用户邮箱', NULL, NULL, NULL, 'user:email:update', 0, 0, 3, '2023-01-31 09:26:22', NULL);
INSERT INTO `t_menu` VALUES (96, 14, 'B', '修改用户头像', NULL, NULL, NULL, 'user:avatar:update', 0, 0, 4, '2023-01-31 09:27:03', NULL);
INSERT INTO `t_menu` VALUES (97, 14, 'B', '修改用户信息', NULL, NULL, NULL, 'user:info:update', 0, 0, 5, '2023-01-31 09:27:37', NULL);
INSERT INTO `t_menu` VALUES (98, 14, 'B', '修改用户密码', NULL, NULL, NULL, 'user:password:update', 0, 0, 6, '2023-01-31 09:28:10', NULL);
INSERT INTO `t_menu` VALUES (99, 38, 'B', '添加评论', NULL, NULL, NULL, 'news:comment:add', 0, 0, 1, '2023-02-08 19:09:25', NULL);
INSERT INTO `t_menu` VALUES (100, 38, 'B', '删除评论', NULL, NULL, NULL, 'news:comment:delete', 0, 0, 2, '2023-02-08 19:09:57', NULL);
INSERT INTO `t_menu` VALUES (101, 38, 'B', '审核评论', NULL, NULL, NULL, 'news:comment:pass', 0, 0, 3, '2023-02-08 19:10:26', NULL);
INSERT INTO `t_menu` VALUES (102, 38, 'B', '点赞评论', NULL, NULL, NULL, 'news:comment:like', 0, 0, 4, '2023-02-08 19:10:45', NULL);
INSERT INTO `t_menu` VALUES (103, 61, 'B', '点赞说说', NULL, NULL, NULL, 'web:talk:like', 0, 0, 6, '2023-02-10 11:16:23', NULL);
INSERT INTO `t_menu` VALUES (104, 21, 'C', '任务日志', 'task', 'job', '/system/log/task', 'log:task:list', 0, 0, 3, '2023-02-14 10:28:28', '2023-02-14 10:28:41');
INSERT INTO `t_menu` VALUES (105, 104, 'B', '删除任务日志', NULL, NULL, NULL, 'log:task:delete', 0, 0, 1, '2023-02-14 11:21:06', NULL);
INSERT INTO `t_menu` VALUES (106, 104, 'B', '清空任务日志', NULL, NULL, NULL, 'log:task:clear', 0, 0, 2, '2023-02-14 11:21:28', NULL);
INSERT INTO `t_menu` VALUES (108, 1, 'C', '发布文章', 'write', 'edit', '/blog/article/write', 'blog:article:list', 0, 0, 1, '2023-02-21 13:32:22', '2023-02-21 15:36:04');
INSERT INTO `t_menu` VALUES (111, 1, 'C', '修改文章', 'write/:articleId', 'edit', '/blog/article/write', 'blog:article:list', 1, 0, 5, '2023-02-21 15:40:11', '2023-02-21 15:41:07');
INSERT INTO `t_menu` VALUES (123, 11, 'C', '文件管理', 'file', 'file', '/system/file/index', 'system:file:list', 0, 0, 4, '2023-03-09 10:57:29', NULL);
INSERT INTO `t_menu` VALUES (124, 123, 'B', '上传文件', NULL, NULL, NULL, 'system:file:upload', 0, 0, 1, '2023-03-10 23:11:33', NULL);
INSERT INTO `t_menu` VALUES (125, 123, 'B', '新建文件夹', NULL, NULL, NULL, 'system:file:createFolder', 0, 0, 2, '2023-03-10 23:12:11', NULL);
INSERT INTO `t_menu` VALUES (126, 123, 'B', '删除文件', NULL, NULL, NULL, 'system:file:delete', 0, 0, 3, '2023-03-10 23:12:45', NULL);
INSERT INTO `t_menu` VALUES (127, 34, 'C', '轮播图', 'carousel', 'carousel', '/web/carousel/index', 'web:carousel:list', 0, 0, 6, '2024-10-17 15:21:28', NULL);
INSERT INTO `t_menu` VALUES (128, 127, 'B', '上传轮播图片', NULL, NULL, NULL, 'web:carousel:upload', 0, 0, 1, '2024-10-22 13:44:20', '2024-10-22 13:44:50');
INSERT INTO `t_menu` VALUES (129, 127, 'B', '添加轮播图', NULL, NULL, NULL, 'web:carousel:add', 0, 0, 2, '2024-10-22 13:45:04', NULL);
INSERT INTO `t_menu` VALUES (130, 127, 'B', '修改轮播图', NULL, NULL, NULL, 'web:carousel:update', 0, 0, 3, '2024-10-22 13:45:17', '2024-10-22 13:45:22');
INSERT INTO `t_menu` VALUES (131, 127, 'B', '删除轮播图', NULL, NULL, NULL, 'web:carousel:delete', 0, 0, 4, '2024-10-22 13:45:38', NULL);
INSERT INTO `t_menu` VALUES (132, 127, 'B', '修改轮播图状态', NULL, NULL, NULL, 'web:carousel:status', 0, 0, 5, '2024-10-22 13:45:54', NULL);
INSERT INTO `t_menu` VALUES (133, 11, 'C', '系统接口', 'api', 'swagger', '/system/swagger/index', '', 0, 0, 5, '2024-11-04 11:02:29', '2024-11-04 11:02:58');

-- ----------------------------
-- Table structure for t_message
-- ----------------------------
DROP TABLE IF EXISTS `t_message`;
CREATE TABLE `t_message`  (
  `id` int(0) NOT NULL AUTO_INCREMENT COMMENT '留言id',
  `nickname` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '昵称',
  `avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '头像',
  `message_content` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '留言内容',
  `ip_address` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '用户ip',
  `ip_source` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '用户地址',
  `is_check` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否通过 (0否 1是)',
  `create_time` datetime(0) NOT NULL COMMENT '留言时间',
  `update_time` datetime(0) NULL DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 88 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '-------留言表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of t_message
-- ----------------------------

-- ----------------------------
-- Table structure for t_operation_log
-- ----------------------------
DROP TABLE IF EXISTS `t_operation_log`;
CREATE TABLE `t_operation_log`  (
  `id` int(0) NOT NULL AUTO_INCREMENT COMMENT '操作id',
  `module` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '操作模块',
  `type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '操作类型',
  `uri` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '操作uri',
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '方法名称',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '操作描述',
  `params` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '请求参数',
  `method` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '请求方式',
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '返回数据',
  `user_id` int(0) NOT NULL COMMENT '用户id',
  `nickname` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '用户昵称',
  `ip_address` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '操作ip',
  `ip_source` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '操作地址',
  `times` int(0) NOT NULL COMMENT '操作耗时 (毫秒)',
  `create_time` datetime(0) NOT NULL COMMENT '操作时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1186 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '-------操作日志表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of t_operation_log
-- ----------------------------

-- ----------------------------
-- Table structure for t_photo
-- ----------------------------
DROP TABLE IF EXISTS `t_photo`;
CREATE TABLE `t_photo`  (
  `id` int(0) NOT NULL AUTO_INCREMENT COMMENT '照片id',
  `album_id` int(0) NOT NULL COMMENT '相册id',
  `photo_name` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '照片名',
  `photo_desc` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '照片描述',
  `photo_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '照片链接',
  `create_time` datetime(0) NOT NULL COMMENT '创建时间',
  `update_time` datetime(0) NULL DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '-------照片表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of t_photo
-- ----------------------------

-- ----------------------------
-- Table structure for t_role
-- ----------------------------
DROP TABLE IF EXISTS `t_role`;
CREATE TABLE `t_role`  (
  `id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主键id',
  `role_name` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '角色名称',
  `role_desc` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '角色描述',
  `is_disable` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否禁用 (0否 1是)',
  `create_time` datetime(0) NOT NULL COMMENT '创建时间',
  `update_time` datetime(0) NULL DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '-------角色表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of t_role
-- ----------------------------
INSERT INTO `t_role` VALUES ('1', 'admin', '管理员', 0, '2022-11-03 17:41:57', '2024-11-05 17:48:19');
INSERT INTO `t_role` VALUES ('2', 'user', '普通用户', 0, '2022-11-03 17:42:17', '2023-03-10 23:13:11');

-- ----------------------------
-- Table structure for t_role_menu
-- ----------------------------
DROP TABLE IF EXISTS `t_role_menu`;
CREATE TABLE `t_role_menu`  (
  `id` int(0) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `role_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '角色id',
  `menu_id` int(0) NOT NULL COMMENT '菜单id',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 6361 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '-------角色菜单关联表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of t_role_menu
-- ----------------------------
INSERT INTO `t_role_menu` VALUES (5796, '2', 1);
INSERT INTO `t_role_menu` VALUES (5797, '2', 108);
INSERT INTO `t_role_menu` VALUES (5798, '2', 73);
INSERT INTO `t_role_menu` VALUES (5799, '2', 84);
INSERT INTO `t_role_menu` VALUES (5800, '2', 88);
INSERT INTO `t_role_menu` VALUES (5801, '2', 3);
INSERT INTO `t_role_menu` VALUES (5802, '2', 4);
INSERT INTO `t_role_menu` VALUES (5803, '2', 111);
INSERT INTO `t_role_menu` VALUES (5804, '2', 36);
INSERT INTO `t_role_menu` VALUES (5805, '2', 38);
INSERT INTO `t_role_menu` VALUES (5806, '2', 99);
INSERT INTO `t_role_menu` VALUES (5807, '2', 102);
INSERT INTO `t_role_menu` VALUES (5808, '2', 37);
INSERT INTO `t_role_menu` VALUES (5809, '2', 11);
INSERT INTO `t_role_menu` VALUES (5810, '2', 12);
INSERT INTO `t_role_menu` VALUES (5811, '2', 60);
INSERT INTO `t_role_menu` VALUES (5812, '2', 13);
INSERT INTO `t_role_menu` VALUES (5813, '2', 14);
INSERT INTO `t_role_menu` VALUES (5814, '2', 95);
INSERT INTO `t_role_menu` VALUES (5815, '2', 96);
INSERT INTO `t_role_menu` VALUES (5816, '2', 97);
INSERT INTO `t_role_menu` VALUES (5817, '2', 98);
INSERT INTO `t_role_menu` VALUES (5818, '2', 123);
INSERT INTO `t_role_menu` VALUES (5819, '2', 21);
INSERT INTO `t_role_menu` VALUES (5820, '2', 22);
INSERT INTO `t_role_menu` VALUES (5821, '2', 23);
INSERT INTO `t_role_menu` VALUES (5822, '2', 93);
INSERT INTO `t_role_menu` VALUES (5823, '2', 104);
INSERT INTO `t_role_menu` VALUES (5824, '2', 26);
INSERT INTO `t_role_menu` VALUES (5825, '2', 53);
INSERT INTO `t_role_menu` VALUES (5826, '2', 27);
INSERT INTO `t_role_menu` VALUES (5827, '2', 34);
INSERT INTO `t_role_menu` VALUES (5828, '2', 35);
INSERT INTO `t_role_menu` VALUES (5829, '2', 61);
INSERT INTO `t_role_menu` VALUES (5830, '2', 65);
INSERT INTO `t_role_menu` VALUES (5831, '2', 103);
INSERT INTO `t_role_menu` VALUES (5832, '2', 51);
INSERT INTO `t_role_menu` VALUES (5833, '2', 57);
INSERT INTO `t_role_menu` VALUES (5834, '2', 52);
INSERT INTO `t_role_menu` VALUES (5835, '2', 46);
INSERT INTO `t_role_menu` VALUES (5836, '3', 1);
INSERT INTO `t_role_menu` VALUES (5837, '3', 108);
INSERT INTO `t_role_menu` VALUES (5838, '3', 73);
INSERT INTO `t_role_menu` VALUES (5839, '3', 3);
INSERT INTO `t_role_menu` VALUES (5840, '3', 4);
INSERT INTO `t_role_menu` VALUES (5841, '3', 111);
INSERT INTO `t_role_menu` VALUES (5842, '3', 36);
INSERT INTO `t_role_menu` VALUES (5843, '3', 38);
INSERT INTO `t_role_menu` VALUES (5844, '3', 37);
INSERT INTO `t_role_menu` VALUES (5845, '3', 11);
INSERT INTO `t_role_menu` VALUES (5846, '3', 12);
INSERT INTO `t_role_menu` VALUES (5847, '3', 60);
INSERT INTO `t_role_menu` VALUES (5848, '3', 13);
INSERT INTO `t_role_menu` VALUES (5849, '3', 14);
INSERT INTO `t_role_menu` VALUES (5850, '3', 123);
INSERT INTO `t_role_menu` VALUES (5851, '3', 21);
INSERT INTO `t_role_menu` VALUES (5852, '3', 22);
INSERT INTO `t_role_menu` VALUES (5853, '3', 23);
INSERT INTO `t_role_menu` VALUES (5854, '3', 93);
INSERT INTO `t_role_menu` VALUES (5855, '3', 104);
INSERT INTO `t_role_menu` VALUES (5856, '3', 26);
INSERT INTO `t_role_menu` VALUES (5857, '3', 53);
INSERT INTO `t_role_menu` VALUES (5858, '3', 27);
INSERT INTO `t_role_menu` VALUES (5859, '3', 34);
INSERT INTO `t_role_menu` VALUES (5860, '3', 35);
INSERT INTO `t_role_menu` VALUES (5861, '3', 61);
INSERT INTO `t_role_menu` VALUES (5862, '3', 65);
INSERT INTO `t_role_menu` VALUES (5863, '3', 51);
INSERT INTO `t_role_menu` VALUES (5864, '3', 57);
INSERT INTO `t_role_menu` VALUES (5865, '3', 52);
INSERT INTO `t_role_menu` VALUES (5866, '3', 46);
INSERT INTO `t_role_menu` VALUES (6261, '1', 1);
INSERT INTO `t_role_menu` VALUES (6262, '1', 108);
INSERT INTO `t_role_menu` VALUES (6263, '1', 73);
INSERT INTO `t_role_menu` VALUES (6264, '1', 80);
INSERT INTO `t_role_menu` VALUES (6265, '1', 81);
INSERT INTO `t_role_menu` VALUES (6266, '1', 82);
INSERT INTO `t_role_menu` VALUES (6267, '1', 83);
INSERT INTO `t_role_menu` VALUES (6268, '1', 84);
INSERT INTO `t_role_menu` VALUES (6269, '1', 85);
INSERT INTO `t_role_menu` VALUES (6270, '1', 86);
INSERT INTO `t_role_menu` VALUES (6271, '1', 87);
INSERT INTO `t_role_menu` VALUES (6272, '1', 88);
INSERT INTO `t_role_menu` VALUES (6273, '1', 3);
INSERT INTO `t_role_menu` VALUES (6274, '1', 5);
INSERT INTO `t_role_menu` VALUES (6275, '1', 6);
INSERT INTO `t_role_menu` VALUES (6276, '1', 7);
INSERT INTO `t_role_menu` VALUES (6277, '1', 4);
INSERT INTO `t_role_menu` VALUES (6278, '1', 8);
INSERT INTO `t_role_menu` VALUES (6279, '1', 9);
INSERT INTO `t_role_menu` VALUES (6280, '1', 10);
INSERT INTO `t_role_menu` VALUES (6281, '1', 111);
INSERT INTO `t_role_menu` VALUES (6282, '1', 36);
INSERT INTO `t_role_menu` VALUES (6283, '1', 38);
INSERT INTO `t_role_menu` VALUES (6284, '1', 99);
INSERT INTO `t_role_menu` VALUES (6285, '1', 100);
INSERT INTO `t_role_menu` VALUES (6286, '1', 101);
INSERT INTO `t_role_menu` VALUES (6287, '1', 102);
INSERT INTO `t_role_menu` VALUES (6288, '1', 37);
INSERT INTO `t_role_menu` VALUES (6289, '1', 42);
INSERT INTO `t_role_menu` VALUES (6290, '1', 45);
INSERT INTO `t_role_menu` VALUES (6291, '1', 11);
INSERT INTO `t_role_menu` VALUES (6292, '1', 12);
INSERT INTO `t_role_menu` VALUES (6293, '1', 15);
INSERT INTO `t_role_menu` VALUES (6294, '1', 16);
INSERT INTO `t_role_menu` VALUES (6295, '1', 17);
INSERT INTO `t_role_menu` VALUES (6296, '1', 60);
INSERT INTO `t_role_menu` VALUES (6297, '1', 13);
INSERT INTO `t_role_menu` VALUES (6298, '1', 18);
INSERT INTO `t_role_menu` VALUES (6299, '1', 19);
INSERT INTO `t_role_menu` VALUES (6300, '1', 20);
INSERT INTO `t_role_menu` VALUES (6301, '1', 33);
INSERT INTO `t_role_menu` VALUES (6302, '1', 14);
INSERT INTO `t_role_menu` VALUES (6303, '1', 69);
INSERT INTO `t_role_menu` VALUES (6304, '1', 70);
INSERT INTO `t_role_menu` VALUES (6305, '1', 123);
INSERT INTO `t_role_menu` VALUES (6306, '1', 124);
INSERT INTO `t_role_menu` VALUES (6307, '1', 125);
INSERT INTO `t_role_menu` VALUES (6308, '1', 126);
INSERT INTO `t_role_menu` VALUES (6309, '1', 133);
INSERT INTO `t_role_menu` VALUES (6310, '1', 21);
INSERT INTO `t_role_menu` VALUES (6311, '1', 22);
INSERT INTO `t_role_menu` VALUES (6312, '1', 24);
INSERT INTO `t_role_menu` VALUES (6313, '1', 23);
INSERT INTO `t_role_menu` VALUES (6314, '1', 25);
INSERT INTO `t_role_menu` VALUES (6315, '1', 93);
INSERT INTO `t_role_menu` VALUES (6316, '1', 94);
INSERT INTO `t_role_menu` VALUES (6317, '1', 104);
INSERT INTO `t_role_menu` VALUES (6318, '1', 105);
INSERT INTO `t_role_menu` VALUES (6319, '1', 106);
INSERT INTO `t_role_menu` VALUES (6320, '1', 26);
INSERT INTO `t_role_menu` VALUES (6321, '1', 53);
INSERT INTO `t_role_menu` VALUES (6322, '1', 71);
INSERT INTO `t_role_menu` VALUES (6323, '1', 27);
INSERT INTO `t_role_menu` VALUES (6324, '1', 28);
INSERT INTO `t_role_menu` VALUES (6325, '1', 29);
INSERT INTO `t_role_menu` VALUES (6326, '1', 30);
INSERT INTO `t_role_menu` VALUES (6327, '1', 31);
INSERT INTO `t_role_menu` VALUES (6328, '1', 32);
INSERT INTO `t_role_menu` VALUES (6329, '1', 34);
INSERT INTO `t_role_menu` VALUES (6330, '1', 35);
INSERT INTO `t_role_menu` VALUES (6331, '1', 39);
INSERT INTO `t_role_menu` VALUES (6332, '1', 40);
INSERT INTO `t_role_menu` VALUES (6333, '1', 41);
INSERT INTO `t_role_menu` VALUES (6334, '1', 61);
INSERT INTO `t_role_menu` VALUES (6335, '1', 62);
INSERT INTO `t_role_menu` VALUES (6336, '1', 63);
INSERT INTO `t_role_menu` VALUES (6337, '1', 64);
INSERT INTO `t_role_menu` VALUES (6338, '1', 65);
INSERT INTO `t_role_menu` VALUES (6339, '1', 66);
INSERT INTO `t_role_menu` VALUES (6340, '1', 103);
INSERT INTO `t_role_menu` VALUES (6341, '1', 51);
INSERT INTO `t_role_menu` VALUES (6342, '1', 54);
INSERT INTO `t_role_menu` VALUES (6343, '1', 55);
INSERT INTO `t_role_menu` VALUES (6344, '1', 56);
INSERT INTO `t_role_menu` VALUES (6345, '1', 57);
INSERT INTO `t_role_menu` VALUES (6346, '1', 58);
INSERT INTO `t_role_menu` VALUES (6347, '1', 52);
INSERT INTO `t_role_menu` VALUES (6348, '1', 76);
INSERT INTO `t_role_menu` VALUES (6349, '1', 77);
INSERT INTO `t_role_menu` VALUES (6350, '1', 78);
INSERT INTO `t_role_menu` VALUES (6351, '1', 79);
INSERT INTO `t_role_menu` VALUES (6352, '1', 46);
INSERT INTO `t_role_menu` VALUES (6353, '1', 67);
INSERT INTO `t_role_menu` VALUES (6354, '1', 68);
INSERT INTO `t_role_menu` VALUES (6355, '1', 127);
INSERT INTO `t_role_menu` VALUES (6356, '1', 128);
INSERT INTO `t_role_menu` VALUES (6357, '1', 129);
INSERT INTO `t_role_menu` VALUES (6358, '1', 130);
INSERT INTO `t_role_menu` VALUES (6359, '1', 131);
INSERT INTO `t_role_menu` VALUES (6360, '1', 132);

-- ----------------------------
-- Table structure for t_site_config
-- ----------------------------
DROP TABLE IF EXISTS `t_site_config`;
CREATE TABLE `t_site_config`  (
  `id` int(0) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '用户头像',
  `tourist_avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '游客头像',
  `site_name` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '网站名称',
  `site_address` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '网站地址',
  `site_intro` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '网站简介',
  `site_notice` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '网站公告',
  `create_site_time` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '建站日期',
  `record_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '备案号',
  `author_avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '作者头像',
  `site_author` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '网站作者',
  `article_cover` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '文章默认封面',
  `about_me` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '关于我',
  `github` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT 'Github',
  `gitee` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT 'Gitee',
  `bilibili` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '哔哩哔哩',
  `qq` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT 'QQ',
  `comment_check` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否评论审核 (0否 1是)',
  `message_check` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否留言审核 (0否 1是)',
  `is_reward` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否开启打赏 (0否 1是)',
  `wei_xin_code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '微信二维码',
  `ali_code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '支付宝二维码',
  `email_notice` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否邮箱通知 (0否 1是)',
  `social_list` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '社交列表',
  `login_list` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '登录方式',
  `is_music` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否开启音乐播放器 (0否 1是)',
  `music_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '网易云歌单id',
  `is_chat` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否开启聊天室 (0否 1是)',
  `websocket_url` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT 'websocket链接',
  `create_time` datetime(0) NOT NULL COMMENT '创建时间',
  `update_time` datetime(0) NULL DEFAULT NULL COMMENT '更新时间',
  `archive_wallpaper` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '归档背景',
  `category_wallpaper` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '分类背景',
  `tag_wallpaper` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '标签背景',
  `talk_wallpaper` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '说说背景',
  `album_wallpaper` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '相册背景',
  `friend_wallpaper` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '友链背景',
  `message_wallpaper` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '留言板背景',
  `about_wallpaper` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '关于背景',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '-------网站配置表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for t_tag
-- ----------------------------
DROP TABLE IF EXISTS `t_tag`;
CREATE TABLE `t_tag`  (
  `id` int(0) NOT NULL AUTO_INCREMENT COMMENT '标签id',
  `tag_name` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '标签名',
  `create_time` datetime(0) NOT NULL COMMENT '创建时间',
  `update_time` datetime(0) NULL DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 16 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '------标签表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of t_tag
-- ----------------------------

-- ----------------------------
-- Table structure for t_talk
-- ----------------------------
DROP TABLE IF EXISTS `t_talk`;
CREATE TABLE `t_talk`  (
  `id` int(0) NOT NULL AUTO_INCREMENT COMMENT '说说id',
  `user_id` int(0) NOT NULL COMMENT '用户id',
  `talk_content` varchar(2000) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '说说内容',
  `images` varchar(2500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '说说图片',
  `is_top` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否置顶 (0否 1是)',
  `status` tinyint(1) NOT NULL DEFAULT 1 COMMENT '状态 (1公开  2私密)',
  `create_time` datetime(0) NOT NULL COMMENT '发表时间',
  `update_time` datetime(0) NULL DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 38 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '-------说说表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of t_talk
-- ----------------------------

-- ----------------------------
-- Table structure for t_task
-- ----------------------------
DROP TABLE IF EXISTS `t_task`;
CREATE TABLE `t_task`  (
  `id` int(0) NOT NULL AUTO_INCREMENT COMMENT '任务id',
  `task_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '任务名称',
  `task_group` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'DEFAULT' COMMENT '任务组名',
  `invoke_target` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '调用目标',
  `cron_expression` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT 'cron执行表达式',
  `misfire_policy` tinyint(1) NOT NULL DEFAULT 3 COMMENT '计划执行错误策略 (1立即执行 2执行一次 3放弃执行)',
  `concurrent` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否并发执行 (0否 1是)',
  `status` tinyint(1) NOT NULL DEFAULT 0 COMMENT '任务状态 (0运行 1暂停)',
  `remark` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '任务备注信息',
  `create_time` datetime(0) NULL DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime(0) NULL DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '-------任务表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of t_task
-- ----------------------------
INSERT INTO `t_task` VALUES (4, '清除每日游客访问记录', 'SYSTEM', 'timedTask.clear', '0 0 0 * * ?', 3, 0, 0, '清除redis中的游客记录', '2023-02-14 09:49:39', '2023-02-18 15:48:41');
INSERT INTO `t_task` VALUES (5, '测试任务', 'SYSTEM', 'timedTask.test', '0/10 * * * * ? ', 3, 0, 1, '测试任务', '2023-02-17 21:54:47', NULL);
INSERT INTO `t_task` VALUES (6, '清除访问日志', 'SYSTEM', 'timedTask.clearVistiLog', '0 0 2 * * ?', 3, 0, 0, '清除一周前的访问日志', '2023-02-22 15:56:32', NULL);

-- ----------------------------
-- Table structure for t_task_log
-- ----------------------------
DROP TABLE IF EXISTS `t_task_log`;
CREATE TABLE `t_task_log`  (
  `id` int(0) NOT NULL AUTO_INCREMENT COMMENT '任务日志id',
  `task_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '任务名称',
  `task_group` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '任务组名',
  `invoke_target` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '调用目标字符串',
  `task_message` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '日志信息',
  `status` tinyint(1) NULL DEFAULT 1 COMMENT '执行状态 (0失败 1正常)',
  `error_info` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '错误信息',
  `create_time` datetime(0) NULL DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 363 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '-------任务日志表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of t_task_log
-- ----------------------------

-- ----------------------------
-- Table structure for t_user
-- ----------------------------
DROP TABLE IF EXISTS `t_user`;
CREATE TABLE `t_user`  (
  `id` int(0) NOT NULL AUTO_INCREMENT COMMENT '用户id',
  `nickname` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '用户昵称',
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '用户名',
  `password` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '用户密码',
  `avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '头像',
  `web_site` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '个人网站',
  `intro` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '个人简介',
  `email` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '邮箱',
  `ip_address` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '登录ip',
  `ip_source` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '' COMMENT '登录地址',
  `login_type` tinyint(1) NOT NULL DEFAULT 0 COMMENT '登录方式 (1邮箱 2QQ 3Gitee 4Github)',
  `is_disable` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否禁用 (0否 1是)',
  `login_time` datetime(0) NULL DEFAULT NULL COMMENT '登录时间',
  `create_time` datetime(0) NOT NULL COMMENT '创建时间',
  `update_time` datetime(0) NULL DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 35 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '-------用户表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of t_user
-- ----------------------------
INSERT INTO `t_user` VALUES (1, 'Conder', 'admin', '$2a$10$nIRkAE9mNWi3Ez4gFRkx9eKdmJQ5H4l6CiDzBjWaShVg4I7chJjoi', 'http://img.conder.top/config/avatar.jpg', 'https://www.conder.top', '帅哥作者^^', '18790446151@163.com', '0:0:0:0:0:0:0:1', '局域网|局域网||', 1, 0, '2024-11-06 15:00:00', '2023-12-24 19:24:05', '2024-11-06 15:00:00');

-- ----------------------------
-- Table structure for t_user_role
-- ----------------------------
DROP TABLE IF EXISTS `t_user_role`;
CREATE TABLE `t_user_role`  (
  `id` int(0) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id` int(0) NOT NULL COMMENT '用户id',
  `role_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '角色id',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 57 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '-------用户角色关联表' ROW_FORMAT = Dynamic;

-- ----------------------------http://img.conder.top/config/avatar.jpg
-- Records of t_user_role
-- ----------------------------
INSERT INTO `t_user_role` VALUES (50, 3, '3');
INSERT INTO `t_user_role` VALUES (54, 1, '1');

-- ----------------------------
-- Table structure for t_visit_log
-- ----------------------------
DROP TABLE IF EXISTS `t_visit_log`;
CREATE TABLE `t_visit_log`  (
  `id` int(0) NOT NULL AUTO_INCREMENT COMMENT 'id',
  `page` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '访问页面',
  `ip_address` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '访问ip',
  `ip_source` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '访问地址',
  `os` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '操作系统',
  `browser` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '浏览器',
  `create_time` datetime(0) NOT NULL COMMENT '访问时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2104 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '-------访问日志关联表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of t_visit_log
-- ----------------------------

-- ----------------------------
-- Table structure for t_upload_file
-- ----------------------------
DROP TABLE IF EXISTS `t_upload_file`;
CREATE TABLE `t_upload_file`  (
  `id` int(0) NOT NULL AUTO_INCREMENT COMMENT '文件ID',
  `file_md5` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '文件MD5值',
  `url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '访问URL',
  `path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '存储路径',
  `file_size` int(0) NOT NULL DEFAULT 0 COMMENT '文件大小（字节）',
  `create_time` datetime(0) NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uk_file_md5` (`file_md5`) USING BTREE COMMENT 'MD5唯一索引'
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '上传文件记录表' ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;