-- 创建备份
CREATE TABLE IF NOT EXISTS visit_logs_backup LIKE visit_logs;
INSERT INTO visit_logs_backup SELECT * FROM visit_logs;

-- 修复page_url列，允许为空
ALTER TABLE visit_logs MODIFY page_url VARCHAR(255) NULL;

-- 如果存在visit_time列，则删除
SET @exist := (SELECT COUNT(*) FROM information_schema.columns 
               WHERE table_name = 'visit_logs' 
               AND table_schema = DATABASE()
               AND column_name = 'visit_time');

SET @query = IF(@exist > 0, 'ALTER TABLE visit_logs DROP COLUMN visit_time', 'SELECT "visit_time column does not exist"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt; 