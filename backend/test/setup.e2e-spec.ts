import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Repository } from 'typeorm';
import { SetupStatus } from '../src/setup/entities/setup-status.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('Setup API (e2e)', () => {
  let app: INestApplication;
  let setupStatusRepository: Repository<SetupStatus>;
  let setupToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    setupStatusRepository = moduleFixture.get<Repository<SetupStatus>>(
      getRepositoryToken(SetupStatus),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /setup/status', () => {
    it('should return setup status with token if not completed', async () => {
      const response = await request(app.getHttpServer())
        .get('/setup/status')
        .expect(200);

      expect(response.body).toHaveProperty('isCompleted');
      expect(response.body).toHaveProperty('setupToken');
      expect(response.body).toHaveProperty('expiresAt');
      
      setupToken = response.body.setupToken;
    });

    it('should return only isCompleted: true if setup is completed', async () => {
      // Mark setup as completed for this test
      const setupStatus = await setupStatusRepository.findOne({ where: {} });
      if (setupStatus) {
        setupStatus.isCompleted = true;
        await setupStatusRepository.save(setupStatus);
      }

      const response = await request(app.getHttpServer())
        .get('/setup/status')
        .expect(200);

      expect(response.body).toEqual({ isCompleted: true });

      // Reset for next tests
      if (setupStatus) {
        setupStatus.isCompleted = false;
        await setupStatusRepository.save(setupStatus);
      }
    });
  });

  describe('POST /setup/validate-database', () => {
    it('should validate correct database credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/setup/validate-database')
        .send({
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT, 10) || 5432,
          username: process.env.DB_USERNAME || 'postgres',
          password: process.env.DB_PASSWORD || 'password',
          database: process.env.DB_DATABASE || 'tmsdb',
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('version');
    });

    it('should reject invalid database credentials', async () => {
      await request(app.getHttpServer())
        .post('/setup/validate-database')
        .send({
          host: 'invalid-host',
          port: 5432,
          username: 'wrong',
          password: 'wrong',
          database: 'wrong',
        })
        .expect(400);
    });
  });

  describe('POST /setup/initialize', () => {
    it('should reject without valid setup token', async () => {
      await request(app.getHttpServer())
        .post('/setup/initialize')
        .send({
          setupToken: 'invalid-token',
          database: {
            host: 'localhost',
            port: 5432,
            username: 'postgres',
            password: 'password',
            database: 'tmsdb',
          },
        })
        .expect(401);
    });

    it('should initialize database with valid token', async () => {
      const response = await request(app.getHttpServer())
        .post('/setup/initialize')
        .send({
          setupToken,
          database: {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT, 10) || 5432,
            username: process.env.DB_USERNAME || 'postgres',
            password: process.env.DB_PASSWORD || 'password',
            database: process.env.DB_DATABASE || 'tmsdb',
          },
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /setup/complete', () => {
    it('should reject without valid setup token', async () => {
      await request(app.getHttpServer())
        .post('/setup/complete')
        .send({
          setupToken: 'invalid-token',
          admin: {
            companyName: 'Test Company',
            name: 'Admin User',
            email: 'admin@test.com',
            password: 'SecurePass123!',
          },
          system: {
            appName: 'LogisticsTMS',
            appUrl: 'http://localhost:3001',
            timezone: 'Europe/Istanbul',
            jwtSecret: 'test-secret-key',
            jwtExpiration: '24h',
          },
        })
        .expect(401);
    });

    it('should complete setup with valid token and data', async () => {
      const response = await request(app.getHttpServer())
        .post('/setup/complete')
        .send({
          setupToken,
          admin: {
            companyName: 'Test Company',
            name: 'Admin User',
            email: `admin-${Date.now()}@test.com`, // Unique email
            password: 'SecurePass123!',
          },
          system: {
            appName: 'LogisticsTMS',
            appUrl: 'http://localhost:3001',
            timezone: 'Europe/Istanbul',
            jwtSecret: 'test-secret-key-' + Date.now(),
            jwtExpiration: '24h',
          },
          optional: {
            email: {
              host: 'smtp.gmail.com',
              port: 587,
              username: 'test@gmail.com',
              password: 'app-password',
              from: 'noreply@test.com',
            },
          },
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('redirectUrl', '/dashboard');
    });
  });

  describe('POST /setup/reset', () => {
    it('should reset setup', async () => {
      const response = await request(app.getHttpServer())
        .post('/setup/reset')
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Setup Middleware', () => {
    it('should block API access when setup is not completed', async () => {
      // Ensure setup is not completed
      await setupStatusRepository.delete({});

      const response = await request(app.getHttpServer())
        .get('/orders')
        .expect(503);

      expect(response.body).toHaveProperty('setupRequired', true);
      expect(response.body).toHaveProperty('redirectUrl', '/setup');
    });

    it('should allow access to setup endpoints even when setup is not completed', async () => {
      await request(app.getHttpServer())
        .get('/setup/status')
        .expect(200);
    });
  });
});

