import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1761666643327 implements MigrationInterface {
  name = 'InitialMigration1761666643327';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "public"."tenant" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "schema" character varying NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tenant_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_tenant_schema" UNIQUE ("schema")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "public"."user" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "passwordHash" character varying NOT NULL,
        "name" character varying NOT NULL,
        "tenantId" uuid NOT NULL,
        CONSTRAINT "PK_user_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_email" UNIQUE ("email"),
        CONSTRAINT "FK_user_tenant" FOREIGN KEY ("tenantId")
          REFERENCES "public"."tenant" ("id")
          ON DELETE CASCADE
          ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "suppliers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "contactName" character varying NOT NULL,
        "contactPhone" character varying NOT NULL,
        "contactEmail" character varying NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_suppliers_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "vehicles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "plateNumber" character varying NOT NULL,
        "brand" character varying NOT NULL,
        "model" character varying NOT NULL,
        "year" integer NOT NULL,
        "capacityKg" integer NOT NULL,
        "isExternal" boolean NOT NULL DEFAULT false,
        "supplierId" uuid,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_vehicles_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_vehicles_plateNumber" UNIQUE ("plateNumber"),
        CONSTRAINT "FK_vehicles_supplier" FOREIGN KEY ("supplierId")
          REFERENCES "suppliers" ("id")
          ON DELETE SET NULL
          ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "drivers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "licenseNumber" character varying NOT NULL,
        "phone" character varying NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_drivers_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_drivers_licenseNumber" UNIQUE ("licenseNumber")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "orders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "orderNumber" character varying NOT NULL,
        "origin" character varying NOT NULL,
        "destination" character varying NOT NULL,
        "loadDetails" text NOT NULL,
        "status" character varying NOT NULL DEFAULT 'pending',
        "supplierId" uuid,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_orders_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_orders_orderNumber" UNIQUE ("orderNumber"),
        CONSTRAINT "CHK_orders_status" CHECK (
          "status" IN ('pending', 'assigned', 'in_transit', 'delivered', 'canceled')
        ),
        CONSTRAINT "FK_orders_supplier" FOREIGN KEY ("supplierId")
          REFERENCES "suppliers" ("id")
          ON DELETE SET NULL
          ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_user_tenantId" ON "public"."user" ("tenantId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_orders_status" ON "orders" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_orders_createdAt" ON "orders" ("createdAt")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_vehicles_supplierId" ON "vehicles" ("supplierId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_vehicles_supplierId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_createdAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_tenantId"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "orders"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "drivers"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "vehicles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "suppliers"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "public"."user"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "public"."tenant"`);
  }
}
