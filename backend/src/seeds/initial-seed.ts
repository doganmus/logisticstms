import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import * as bcrypt from 'bcrypt';
import { MigrationExecutor } from 'typeorm/migration/MigrationExecutor';
import AppDataSource from '../../typeorm.config';
import { Tenant } from '../public-entities/tenant.entity';
import { User } from '../public-entities/user.entity';

const envFile =
  process.env.NODE_ENV === 'test' ? '.env.test' : process.env.ENV_FILE || '.env';
loadEnv({ path: envFile });

const seedTenantName =
  process.env.SEED_TENANT_NAME || 'Demo Logistics Company';
const seedTenantSchema =
  process.env.SEED_TENANT_SCHEMA || 'demo_tenant_schema';
const seedAdminEmail =
  process.env.SEED_ADMIN_EMAIL || 'admin@demo-logistics.com';
const seedAdminPassword =
  process.env.SEED_ADMIN_PASSWORD || 'DemoAdmin123!';
const seedAdminName = process.env.SEED_ADMIN_NAME || 'Demo Admin';

async function ensureTenantSchema(schema: string): Promise<void> {
  await AppDataSource.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);

  const queryRunner = AppDataSource.createQueryRunner();
  try {
    await queryRunner.connect();
    await queryRunner.query(`SET search_path TO "${schema}", public`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "migrations" (
        "id" SERIAL PRIMARY KEY,
        "timestamp" BIGINT NOT NULL,
        "name" character varying NOT NULL
      )
    `);
    const executor = new MigrationExecutor(AppDataSource, queryRunner);
    executor.transaction = 'none';
    await executor.executePendingMigrations();
  } finally {
    await queryRunner.release();
  }
}

async function runSeed() {
  await AppDataSource.initialize();

  const tenantRepository = AppDataSource.getRepository(Tenant);
  const userRepository = AppDataSource.getRepository(User);

  let tenant = await tenantRepository.findOne({
    where: [{ schema: seedTenantSchema }, { name: seedTenantName }],
  });

  if (!tenant) {
    tenant = tenantRepository.create({
      name: seedTenantName,
      schema: seedTenantSchema,
    });
    tenant = await tenantRepository.save(tenant);
    console.log(`Created tenant "${tenant.name}" (${tenant.schema})`);
  } else {
    console.log(`Tenant "${tenant.name}" already exists, skipping creation`);
  }

  await ensureTenantSchema(tenant.schema);

  let adminUser = await userRepository.findOneBy({ email: seedAdminEmail });
  if (!adminUser) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(seedAdminPassword, salt);
    adminUser = userRepository.create({
      email: seedAdminEmail,
      passwordHash,
      name: seedAdminName,
      tenantId: tenant.id,
      tenant,
    });
    await userRepository.save(adminUser);
    console.log(`Created admin user ${seedAdminEmail}`);
  } else {
    console.log(`Admin user ${seedAdminEmail} already exists, skipping creation`);
  }
}

runSeed()
  .then(() => {
    console.log('Database seed completed successfully.');
  })
  .catch((error) => {
    console.error('Database seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

