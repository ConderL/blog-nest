import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateVisitLog1718444400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('检查访问日志表是否存在...');

    // 先检查表是否存在
    const visitLogs = await queryRunner.query(`SHOW TABLES LIKE 'visit_logs'`);
    const tVisitLog = await queryRunner.query(`SHOW TABLES LIKE 't_visit_log'`);

    // 如果visit_logs表存在，检查并修复
    if (visitLogs && visitLogs.length > 0) {
      console.log('找到visit_logs表，准备修复...');

      // 检查visit_time列是否存在
      const hasVisitTimeColumn = await queryRunner.hasColumn('visit_logs', 'visit_time');

      // 如果visit_time列存在，则删除它
      if (hasVisitTimeColumn) {
        await queryRunner.query(`ALTER TABLE visit_logs DROP COLUMN visit_time`);
        console.log('已删除visit_time列');
      }

      // 检查page_url列是否可为空
      await queryRunner.query(`ALTER TABLE visit_logs MODIFY page_url varchar(255) NULL`);
      console.log('已修改page_url列为可为空');

      // 如果t_visit_log表也存在，将visit_logs表数据复制到t_visit_log表
      if (tVisitLog && tVisitLog.length > 0) {
        try {
          console.log('将visit_logs表数据迁移到t_visit_log表...');
          await queryRunner.query(`
            INSERT INTO t_visit_log (page_url, ip_address, ip_source, os, browser, referer, user_id)
            SELECT page_url, ip_address, ip_source, os, browser, referer, user_id
            FROM visit_logs
          `);
          console.log('数据迁移完成');

          // 删除旧表
          await queryRunner.query(`DROP TABLE visit_logs`);
          console.log('已删除旧表visit_logs');
        } catch (error) {
          console.error('数据迁移失败:', error.message);
        }
      }
    } else if (tVisitLog && tVisitLog.length > 0) {
      // 如果只有t_visit_log表存在，检查其结构
      console.log('找到t_visit_log表，检查结构...');

      // 确保page_url列可为空
      try {
        await queryRunner.query(`ALTER TABLE t_visit_log MODIFY page_url varchar(255) NULL`);
        console.log('已修改t_visit_log表page_url列为可为空');
      } catch (error) {
        console.error('修改t_visit_log表结构失败:', error.message);
      }
    } else {
      // 如果两个表都不存在，创建t_visit_log表
      console.log('访问日志表不存在，创建t_visit_log表...');
      await queryRunner.query(`
        CREATE TABLE t_visit_log (
          id int NOT NULL AUTO_INCREMENT,
          created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          page_url varchar(255) DEFAULT NULL,
          ip_address varchar(50) NOT NULL,
          ip_source varchar(255) DEFAULT NULL,
          os varchar(50) DEFAULT NULL,
          browser varchar(50) DEFAULT NULL,
          referer varchar(255) DEFAULT NULL,
          user_id int DEFAULT NULL,
          PRIMARY KEY (id)
        )
      `);
      console.log('t_visit_log表创建成功');
    }

    console.log('访问日志表结构修复完成');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 回滚操作通常不需要，因为这是修复操作
    console.log('访问日志表结构修复回滚操作 - 通常不需要');
  }
}
