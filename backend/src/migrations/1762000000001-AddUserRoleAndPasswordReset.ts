import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserRoleAndPasswordReset1762000000001 implements MigrationInterface {
  name = 'AddUserRoleAndPasswordReset1762000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE IF NOT EXISTS "public"."user_role_enum" AS ENUM ('admin', 'operator')`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."user" ADD COLUMN IF NOT EXISTS "role" "public"."user_role_enum" NOT NULL DEFAULT 'operator'`,
    );
    await queryRunner.query(`UPDATE "public"."user" SET "role" = 'admin' WHERE "role" IS NULL`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "public"."password_reset_token" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "token" character varying NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "usedAt" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_password_reset_token_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_password_reset_token_value" UNIQUE ("token"),
        CONSTRAINT "FK_password_reset_token_user" FOREIGN KEY ("userId")
          REFERENCES "public"."user" ("id")
          ON DELETE CASCADE
          ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_password_reset_token_userId" ON "public"."password_reset_token" ("userId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_password_reset_token_userId"`,
    );

    await queryRunner.query(
      `DROP TABLE IF EXISTS "public"."password_reset_token"`,
    );

    await queryRunner.query(
      `ALTER TABLE "public"."user" DROP COLUMN IF EXISTS "role"`,
    );

    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."user_role_enum"`,
    );
  }
}
