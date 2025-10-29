import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectDataSource } from '@nestjs/typeorm';
import {
  DataSource,
  EntityTarget,
  ObjectLiteral,
  QueryRunner,
  Repository,
} from 'typeorm';
import { MigrationExecutor } from 'typeorm/migration/MigrationExecutor';
import type { Request, Response } from 'express';

@Injectable({ scope: Scope.REQUEST })
export class TenantConnectionService {
  private readonly tenantId: string;
  private queryRunner: QueryRunner | null = null;
  private releaseHookRegistered = false;

  constructor(
    @InjectDataSource('default')
    private readonly tenantDataSource: DataSource,
    @Inject(REQUEST)
    private readonly request: Request,
  ) {
    this.tenantId = (this.request as any)?.tenantId ?? 'public';
  }

  /**
   * Returns the active tenant identifier for the current request.
   */
  getTenantId(): string {
    return this.tenantId;
  }

  /**
   * Provides a repository bound to the tenant-specific schema.
   */
  async getRepository<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
  ): Promise<Repository<T>> {
    const runner = await this.ensureQueryRunner();
    return runner.manager.getRepository(entity);
  }

  /**
   * Executes a raw SQL query within the tenant scope.
   */
  async query<T = unknown>(sql: string, parameters?: any[]): Promise<T> {
    const runner = await this.ensureQueryRunner();
    return runner.query(sql, parameters);
  }

  /**
   * Ensures a per-request query runner with the tenant search_path configured.
   */
  private async ensureQueryRunner(): Promise<QueryRunner> {
    if (!this.queryRunner) {
      this.queryRunner = this.tenantDataSource.createQueryRunner();
      await this.queryRunner.connect();
      await this.queryRunner.query(
        `SET search_path TO "${this.tenantId}", public`,
      );
      this.registerReleaseHook();
    }

    return this.queryRunner;
  }

  /**
   * Automatically releases the query runner once the response is completed.
   */
  private registerReleaseHook(): void {
    if (this.releaseHookRegistered) {
      return;
    }

    const response: Response | undefined = (this.request as any)?.res;
    const releaseRunner = () => {
      if (this.queryRunner && !this.queryRunner.isReleased) {
        void this.queryRunner.release();
      }
      this.queryRunner = null;
    };

    if (response) {
      response.once('finish', releaseRunner);
      response.once('close', releaseRunner);
    }

    this.releaseHookRegistered = true;
  }

  /**
   * Checks whether a tenant schema already exists.
   */
  async tenantSchemaExists(tenantId: string): Promise<boolean> {
    const runner = this.tenantDataSource.createQueryRunner();
    try {
      await runner.connect();
      const result = await runner.query(
        `SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1`,
        [tenantId],
      );
      return result.length > 0;
    } finally {
      await runner.release();
    }
  }

  /**
   * Creates a tenant schema and executes all pending migrations within it.
   */
  async createTenantSchema(tenantId: string): Promise<void> {
    const runner = this.tenantDataSource.createQueryRunner();
    try {
      await runner.connect();
      await runner.query(`CREATE SCHEMA IF NOT EXISTS "${tenantId}"`);
      await runner.query(`SET search_path TO "${tenantId}", public`);
      await runner.query(`
        CREATE TABLE IF NOT EXISTS "migrations" (
          "id" SERIAL PRIMARY KEY,
          "timestamp" BIGINT NOT NULL,
          "name" character varying NOT NULL
        )
      `);

      const migrationExecutor = new MigrationExecutor(
        this.tenantDataSource,
        runner,
      );
      // Each migration handles its own transaction scope to avoid DDL conflicts.
      migrationExecutor.transaction = 'none';
      await migrationExecutor.executePendingMigrations();
    } finally {
      await runner.release();
    }
  }

  /**
   * Drops a tenant schema if needed (mostly for clean-up in tests).
   */
  async dropTenantSchema(tenantId: string): Promise<void> {
    const runner = this.tenantDataSource.createQueryRunner();
    try {
      await runner.connect();
      await runner.query(`DROP SCHEMA IF EXISTS "${tenantId}" CASCADE`);
    } finally {
      await runner.release();
    }
  }
}
