import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';

const envFile =
  process.env.NODE_ENV === 'test'
    ? resolve(__dirname, '.env.test')
    : resolve(__dirname, '.env');

loadEnv({ path: envFile });

const isTsRuntime =
  process.env.TS_NODE === 'true' ||
  process.env.TS_JEST === 'true' ||
  !!process.env.JEST_WORKER_ID;

const commonOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'tmsdb',
  synchronize: false,
  logging: process.env.TYPEORM_LOGGING === 'true',
  migrationsTableName: 'migrations',
};

const entityGlobs = isTsRuntime
  ? ['src/**/*.entity.ts', 'src/public-entities/*.ts']
  : ['dist/**/*.entity.js', 'dist/public-entities/*.js'];

const migrationGlobs = isTsRuntime
  ? ['src/migrations/*.ts']
  : ['dist/migrations/*.js'];

const AppDataSource = new DataSource({
  ...commonOptions,
  entities: entityGlobs,
  migrations: migrationGlobs,
});

export default AppDataSource;
