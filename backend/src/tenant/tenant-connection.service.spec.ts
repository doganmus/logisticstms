import { EventEmitter } from 'events';
import { DataSource } from 'typeorm';
import { Request, Response } from 'express';

const executePendingMigrationsMock = jest.fn();

jest.mock('typeorm/migration/MigrationExecutor', () => ({
  MigrationExecutor: jest.fn().mockImplementation(function () {
    this.transaction = 'all';
    this.executePendingMigrations = executePendingMigrationsMock;
  }),
}));

import { TenantConnectionService } from './tenant-connection.service';

const migrationExecutorMock = jest.requireMock(
  'typeorm/migration/MigrationExecutor',
).MigrationExecutor as jest.Mock;

describe('TenantConnectionService', () => {
  const buildQueryRunner = () => {
    const runner: any = {
      isReleased: false,
      connect: jest.fn().mockResolvedValue(undefined),
      query: jest.fn().mockResolvedValue([]),
      manager: {
        getRepository: jest.fn().mockReturnValue('repository'),
      },
      release: jest.fn().mockImplementation(function (this: any) {
        this.isReleased = true;
        return Promise.resolve();
      }),
    };
    return runner;
  };

  let dataSource: DataSource;
  let createQueryRunnerMock: jest.Mock;
  let request: Request & { res: Response };
  let response: EventEmitter & Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    executePendingMigrationsMock.mockReset();

    createQueryRunnerMock = jest.fn();
    dataSource = {
      createQueryRunner: createQueryRunnerMock,
    } as unknown as DataSource;

    response = new EventEmitter();
    request = {
      tenantId: 'tenant_alpha',
      res: response as Response,
    } as unknown as Request & { res: Response };
  });

  it('reuses a single query runner per request and scopes repository to tenant schema', async () => {
    const runner = buildQueryRunner();
    createQueryRunnerMock.mockReturnValueOnce(runner);

    const service = new TenantConnectionService(dataSource, request);

    const repo1 = await service.getRepository(class {});
    const repo2 = await service.getRepository(class {});

    expect(repo1).toBe('repository');
    expect(repo2).toBe('repository');
    expect(createQueryRunnerMock).toHaveBeenCalledTimes(1);
    expect(runner.connect).toHaveBeenCalledTimes(1);
    expect(runner.query).toHaveBeenCalledWith(
      `SET search_path TO "tenant_alpha"`,
    );
    expect(runner.manager.getRepository).toHaveBeenCalledTimes(2);
  });

  it('releases the query runner when the response lifecycle finishes', async () => {
    const runner = buildQueryRunner();
    createQueryRunnerMock.mockReturnValueOnce(runner);

    const service = new TenantConnectionService(dataSource, request);
    await service.getRepository(class {});

    response.emit('finish');
    await new Promise((resolve) => setImmediate(resolve));

    expect(runner.release).toHaveBeenCalledTimes(1);
    expect(runner.isReleased).toBe(true);
  });

  it('executes tenant migrations when creating a schema', async () => {
    const runner = buildQueryRunner();
    createQueryRunnerMock.mockReturnValueOnce(runner);

    const service = new TenantConnectionService(dataSource, request);
    await service.createTenantSchema('tenant_beta');

    expect(createQueryRunnerMock).toHaveBeenCalledTimes(1);
    expect(runner.query).toHaveBeenNthCalledWith(
      1,
      `CREATE SCHEMA IF NOT EXISTS "tenant_beta"`,
    );
    expect(runner.query).toHaveBeenNthCalledWith(
      2,
      `SET search_path TO "tenant_beta"`,
    );
    expect(migrationExecutorMock).toHaveBeenCalledWith(
      dataSource,
      runner,
    );
    expect(migrationExecutorMock.mock.instances[0].transaction).toBe('none');
    expect(executePendingMigrationsMock).toHaveBeenCalledTimes(1);
    expect(runner.release).toHaveBeenCalledTimes(1);
  });

  it('checks schema existence through an isolated query runner', async () => {
    const runner = buildQueryRunner();
    runner.query.mockResolvedValueOnce([{ schema_name: 'tenant_alpha' }]);
    createQueryRunnerMock.mockReturnValueOnce(runner);

    const service = new TenantConnectionService(dataSource, request);
    const exists = await service.tenantSchemaExists('tenant_alpha');

    expect(exists).toBe(true);
    expect(createQueryRunnerMock).toHaveBeenCalledTimes(1);
    expect(runner.release).toHaveBeenCalledTimes(1);
  });

  it('isolates search paths for different tenants', async () => {
    const runnerA = buildQueryRunner();
    const runnerB = buildQueryRunner();
    createQueryRunnerMock
      .mockReturnValueOnce(runnerA)
      .mockReturnValueOnce(runnerB);

    const responseA = new EventEmitter();
    const responseB = new EventEmitter();

    const requestA = {
      tenantId: 'tenant_a',
      res: responseA as Response,
    } as unknown as Request & { res: Response };

    const requestB = {
      tenantId: 'tenant_b',
      res: responseB as Response,
    } as unknown as Request & { res: Response };

    const serviceA = new TenantConnectionService(dataSource, requestA);
    const serviceB = new TenantConnectionService(dataSource, requestB);

    await serviceA.getRepository(class {});
    await serviceB.getRepository(class {});

    expect(runnerA.query).toHaveBeenCalledWith(
      `SET search_path TO "tenant_a"`,
    );
    expect(runnerB.query).toHaveBeenCalledWith(
      `SET search_path TO "tenant_b"`,
    );
  });
});
