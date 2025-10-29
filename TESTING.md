# Test Stratejisi ve Dokümantasyonu

Bu doküman, TMS SaaS platformunun test stratejisini, test türlerini ve örneklerini içerir.

**Son Güncelleme:** 23 Ekim 2025

---

## 📋 İçindekiler

- [Test Stratejisi](#test-stratejisi)
- [Test Türleri](#test-türleri)
- [Backend Testing (NestJS)](#backend-testing-nestjs)
- [Frontend Testing (Next.js)](#frontend-testing-nextjs)
- [E2E Testing](#e2e-testing)
- [Test Coverage](#test-coverage)
- [CI/CD Entegrasyonu](#cicd-entegrasyonu)

---

## 🎯 Test Stratejisi

### Test Piramidi

```
        /\
       /  \
      /E2E \ (10%)
     /------\
    / Integ.\ (20%)
   /----------\
  /   Unit     \ (70%)
 /--------------\
```

### Coverage Hedefleri

| Katman | Hedef Coverage | Durum |
|--------|----------------|-------|
| Unit Tests | 80% | 🚧 0% |
| Integration Tests | 70% | 🚧 0% |
| E2E Tests | Kritik flow'lar | 🚧 0% |

### Test Ortamları

- **Local:** Development sırasında hızlı feedback
- **CI/CD:** Her PR ve commit'te otomatik
- **Staging:** Production-like environment

---

## 🧪 Test Türleri

### 1. Unit Tests
**Amaç:** İzole fonksiyonlar ve sınıfları test etmek  
**Kapsam:** Services, utilities, helpers  
**Hız:** Çok hızlı (milisaniyeler)

### 2. Integration Tests
**Amaç:** Bileşenlerin birlikte çalışmasını test etmek  
**Kapsam:** Controllers + Services + Database  
**Hız:** Orta (saniyeler)

### 3. E2E Tests
**Amaç:** Tüm sistemi kullanıcı perspektifinden test etmek  
**Kapsam:** API endpoint'leri, user flows  
**Hız:** Yavaş (dakikalar)

---

## 🖥️ Backend Testing (NestJS)

### Test Setup

```bash
# Backend dizinine git
cd backend

# Test dependencies (zaten yüklü)
npm install --save-dev @nestjs/testing jest @types/jest ts-jest supertest

# Test komutları
npm test              # Unit tests
npm run test:watch    # Watch mode
npm run test:cov      # Coverage report
npm run test:e2e      # E2E tests
```

---

### Unit Test Örnekleri

#### Service Test

```typescript
// src/orders/orders.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrdersService } from './orders.service';
import { Order, OrderStatus } from './order.entity';
import { NotFoundException } from '@nestjs/common';

describe('OrdersService', () => {
  let service: OrdersService;
  let repository: Repository<Order>;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    preload: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getRepositoryToken(Order),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken('Supplier'),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    repository = module.get<Repository<Order>>(getRepositoryToken(Order));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return an array of orders', async () => {
      const mockOrders = [
        {
          id: '1',
          orderNumber: 'ORD-001',
          origin: 'Istanbul',
          destination: 'Ankara',
          status: OrderStatus.PENDING,
        },
      ];

      mockRepository.find.mockResolvedValue(mockOrders);

      const result = await service.findAll();

      expect(result).toEqual(mockOrders);
      expect(mockRepository.find).toHaveBeenCalledWith({ relations: ['supplier'] });
    });
  });

  describe('findOne', () => {
    it('should return a single order', async () => {
      const mockOrder = {
        id: '1',
        orderNumber: 'ORD-001',
        origin: 'Istanbul',
        destination: 'Ankara',
      };

      mockRepository.findOne.mockResolvedValue(mockOrder);

      const result = await service.findOne('1');

      expect(result).toEqual(mockOrder);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['supplier'],
      });
    });

    it('should throw NotFoundException if order not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create and return a new order', async () => {
      const createOrderDto = {
        origin: 'Istanbul',
        destination: 'Ankara',
        loadDetails: '10 pallets',
      };

      const mockOrder = {
        id: '1',
        orderNumber: 'ORD-1234567890',
        ...createOrderDto,
      };

      mockRepository.create.mockReturnValue(mockOrder);
      mockRepository.save.mockResolvedValue(mockOrder);

      const result = await service.create(createOrderDto);

      expect(result).toEqual(mockOrder);
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalledWith(mockOrder);
    });
  });

  describe('remove', () => {
    it('should delete an order', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove('1');

      expect(mockRepository.delete).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if order to delete not found', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
```

---

#### Controller Test

```typescript
// src/orders/orders.controller.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from './order.entity';

describe('OrdersController', () => {
  let controller: OrdersController;
  let service: OrdersService;

  const mockOrdersService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: mockOrdersService,
        },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of orders', async () => {
      const mockOrders = [
        { id: '1', orderNumber: 'ORD-001', origin: 'Istanbul', destination: 'Ankara' },
      ];

      mockOrdersService.findAll.mockResolvedValue(mockOrders);

      const result = await controller.findAll();

      expect(result).toEqual(mockOrders);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a new order', async () => {
      const createDto: CreateOrderDto = {
        origin: 'Istanbul',
        destination: 'Ankara',
        loadDetails: '10 pallets',
        status: OrderStatus.PENDING,
      };

      const mockOrder = {
        id: '1',
        orderNumber: 'ORD-001',
        ...createDto,
      };

      mockOrdersService.create.mockResolvedValue(mockOrder);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockOrder);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });
});
```

---

### Integration Test Örnekleri

```typescript
// test/orders.e2e-spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';

describe('Orders (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'TestPassword123!',
      });

    authToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  afterEach(async () => {
    // Clean up test data
    await dataSource.query('DELETE FROM orders');
  });

  describe('/orders (POST)', () => {
    it('should create a new order', () => {
      return request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          origin: 'Istanbul',
          destination: 'Ankara',
          loadDetails: '10 pallets',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('orderNumber');
          expect(res.body.origin).toBe('Istanbul');
        });
    });

    it('should return 400 for invalid data', () => {
      return request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          origin: '',
          destination: 'Ankara',
        })
        .expect(400);
    });

    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .post('/orders')
        .send({
          origin: 'Istanbul',
          destination: 'Ankara',
          loadDetails: '10 pallets',
        })
        .expect(401);
    });
  });

  describe('/orders (GET)', () => {
    beforeEach(async () => {
      // Create test orders
      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          origin: 'Istanbul',
          destination: 'Ankara',
          loadDetails: '10 pallets',
        });
    });

    it('should return all orders', () => {
      return request(app.getHttpServer())
        .get('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });
  });

  describe('/orders/:id (GET)', () => {
    let orderId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          origin: 'Istanbul',
          destination: 'Ankara',
          loadDetails: '10 pallets',
        });

      orderId = response.body.id;
    });

    it('should return a single order', () => {
      return request(app.getHttpServer())
        .get(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(orderId);
        });
    });

    it('should return 404 for non-existent order', () => {
      return request(app.getHttpServer())
        .get('/orders/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
```

---

### Mock Data Factory

```typescript
// test/factories/order.factory.ts

import { Order, OrderStatus } from '../../src/orders/order.entity';

export class OrderFactory {
  static create(overrides?: Partial<Order>): Order {
    const order = new Order();
    order.id = '1';
    order.orderNumber = 'ORD-001';
    order.origin = 'Istanbul';
    order.destination = 'Ankara';
    order.loadDetails = '10 pallets';
    order.status = OrderStatus.PENDING;
    order.createdAt = new Date();
    order.updatedAt = new Date();

    return Object.assign(order, overrides);
  }

  static createMany(count: number, overrides?: Partial<Order>): Order[] {
    return Array.from({ length: count }, (_, i) =>
      this.create({ ...overrides, id: String(i + 1), orderNumber: `ORD-${String(i + 1).padStart(3, '0')}` })
    );
  }
}
```

---

## 🎨 Frontend Testing (Next.js)

### Test Setup

```bash
# Frontend dizinine git
cd frontend

# Test dependencies yükle
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event jest jest-environment-jsdom

# Test komutu
npm test
```

### Jest Configuration

```javascript
// jest.config.js

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/_*.{js,jsx,ts,tsx}',
  ],
};

module.exports = createJestConfig(customJestConfig);
```

```javascript
// jest.setup.js

import '@testing-library/jest-dom';
```

---

### Component Test Örnekleri

```typescript
// src/components/OrdersList.test.tsx

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OrdersList from './OrdersList';

describe('OrdersList', () => {
  const mockOrders = [
    {
      id: '1',
      orderNumber: 'ORD-001',
      origin: 'Istanbul',
      destination: 'Ankara',
      status: 'pending',
      supplier: null,
    },
    {
      id: '2',
      orderNumber: 'ORD-002',
      origin: 'Izmir',
      destination: 'Bursa',
      status: 'assigned',
      supplier: { id: '1', name: 'Supplier A' },
    },
  ];

  const mockOnAssign = jest.fn();

  it('renders orders list', () => {
    render(<OrdersList orders={mockOrders} onAssign={mockOnAssign} />);

    expect(screen.getByText('ORD-001')).toBeInTheDocument();
    expect(screen.getByText('ORD-002')).toBeInTheDocument();
    expect(screen.getByText('Istanbul')).toBeInTheDocument();
    expect(screen.getByText('Ankara')).toBeInTheDocument();
  });

  it('displays supplier name when assigned', () => {
    render(<OrdersList orders={mockOrders} onAssign={mockOnAssign} />);

    expect(screen.getByText('Supplier A')).toBeInTheDocument();
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('calls onAssign when assign button is clicked', async () => {
    const user = userEvent.setup();
    render(<OrdersList orders={mockOrders} onAssign={mockOnAssign} />);

    const assignButtons = screen.getAllByText('Assign Supplier');
    await user.click(assignButtons[0]);

    expect(mockOnAssign).toHaveBeenCalledWith(mockOrders[0]);
  });

  it('disables assign button for assigned orders', () => {
    render(<OrdersList orders={mockOrders} onAssign={mockOnAssign} />);

    const assignButtons = screen.getAllByText('Assign Supplier');
    expect(assignButtons[1]).toBeDisabled();
  });
});
```

---

## 🌐 E2E Testing

### Playwright Setup

```bash
# Playwright yükle
npm install --save-dev @playwright/test

# Initialize
npx playwright install
```

### Playwright Configuration

```typescript
// playwright.config.ts

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Örneği

```typescript
// e2e/orders.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Orders Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display orders list', async ({ page }) => {
    await page.goto('/dashboard/orders');
    
    await expect(page.locator('h4')).toContainText('Orders Management');
    await expect(page.locator('table')).toBeVisible();
  });

  test('should create new order', async ({ page }) => {
    await page.goto('/dashboard/orders');
    
    await page.click('button:has-text("Create Order")');
    await page.fill('input[name="origin"]', 'Istanbul');
    await page.fill('input[name="destination"]', 'Ankara');
    await page.fill('textarea[name="loadDetails"]', '10 pallets');
    await page.click('button[type="submit"]');

    await expect(page.locator('.success-message')).toBeVisible();
  });

  test('should assign supplier to order', async ({ page }) => {
    await page.goto('/dashboard/orders');
    
    await page.click('button:has-text("Assign Supplier"):first');
    await page.selectOption('select[name="supplierId"]', { index: 1 });
    await page.click('button:has-text("Confirm")');

    await expect(page.locator('.success-message')).toBeVisible();
  });
});
```

---

## 📊 Test Coverage

### Coverage Commands

```bash
# Backend coverage
cd backend
npm run test:cov

# Frontend coverage
cd frontend
npm test -- --coverage
```

### Coverage Report

```bash
# Coverage report'u görüntüle
open coverage/lcov-report/index.html
```

### Coverage Goals

| File Type | Statements | Branches | Functions | Lines |
|-----------|------------|----------|-----------|-------|
| Services | 90% | 85% | 90% | 90% |
| Controllers | 80% | 75% | 80% | 80% |
| Components | 80% | 75% | 80% | 80% |
| Utilities | 95% | 90% | 95% | 95% |

---

## 🔄 CI/CD Entegrasyonu

### GitHub Actions Test Workflow

```yaml
# .github/workflows/test.yml

name: Run Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  backend-tests:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14-alpine
        env:
          POSTGRES_USER: testuser
          POSTGRES_PASSWORD: testpass
          POSTGRES_DB: testdb
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      
      - name: Install dependencies
        working-directory: ./backend
        run: npm ci
      
      - name: Run unit tests
        working-directory: ./backend
        run: npm test -- --coverage
      
      - name: Run e2e tests
        working-directory: ./backend
        run: npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/lcov.info
          flags: backend

  frontend-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci
      
      - name: Run tests
        working-directory: ./frontend
        run: npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./frontend/coverage/lcov.info
          flags: frontend
```

---

## 📚 Best Practices

### Test Yazma İlkeleri

1. **AAA Pattern:** Arrange, Act, Assert
2. **Descriptive names:** Test ne yaptığını açıkça belirt
3. **One assertion per test:** Mümkün olduğunca tek assertion
4. **Independent tests:** Test'ler birbirinden bağımsız olmalı
5. **Fast tests:** Test'ler hızlı çalışmalı

### Test Naming Convention

```typescript
// ✅ Good
it('should return 404 when order is not found')
it('should create order with valid data')
it('should throw UnauthorizedException when token is invalid')

// ❌ Bad
it('test order')
it('works')
it('returns data')
```

---

## 🔗 Kaynaklar

- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/)

