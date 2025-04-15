import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateVisitLog1718444400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 检查visit_time列是否存在
    const hasVisitTimeColumn = await queryRunner.hasColumn('visit_logs', 'visit_time');

    // 如果visit_time列存在，则删除它
    if (hasVisitTimeColumn) {
      await queryRunner.query(`ALTER TABLE visit_logs DROP COLUMN visit_time`);
    }

    // 检查page_url列是否可为空
    await queryRunner.query(`ALTER TABLE visit_logs MODIFY page_url varchar(255) NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 回滚时添加visit_time列
    await queryRunner.query(`ALTER TABLE visit_logs ADD COLUMN visit_time varchar(255) NULL`);
  }
}
