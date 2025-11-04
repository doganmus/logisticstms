import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailVerification1762000000002 implements MigrationInterface {
  name = 'AddEmailVerification1762000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "public"."user" ADD COLUMN IF NOT EXISTS "isEmailVerified" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."user" ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMP WITH TIME ZONE`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "public"."email_verification_token" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "token" character varying NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "usedAt" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_email_verification_token_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_email_verification_token_value" UNIQUE ("token"),
        CONSTRAINT "FK_email_verification_token_user" FOREIGN KEY ("userId")
          REFERENCES "public"."user" ("id")
          ON DELETE CASCADE
          ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_email_verification_token_userId" ON "public"."email_verification_token" ("userId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_email_verification_token_userId"`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "public"."email_verification_token"`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."user" DROP COLUMN IF EXISTS "emailVerifiedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."user" DROP COLUMN IF EXISTS "isEmailVerified"`,
    );
  }
}
