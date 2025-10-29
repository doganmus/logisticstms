# Katkıda Bulunma Kuralları

TMS SaaS platformuna katkıda bulunmak istediğiniz için teşekkür ederiz! Bu doküman, projeye nasıl katkıda bulunabileceğinizi ve kod standartlarımızı açıklar.

**Son Güncelleme:** 23 Ekim 2025

---

## 📋 İçindekiler

- [Geliştirme Ortamı Kurulumu](#geliştirme-ortamı-kurulumu)
- [Kod Standartları](#kod-standartları)
- [Git Workflow](#git-workflow)
- [Commit Message Formatı](#commit-message-formatı)
- [Pull Request Süreci](#pull-request-süreci)
- [Code Review Checklist](#code-review-checklist)
- [Dosya ve Klasör Yapısı](#dosya-ve-klasör-yapısı)
- [Testing Kuralları](#testing-kuralları)

---

## 🚀 Geliştirme Ortamı Kurulumu

### Gereksinimler

- **Node.js:** v18 veya üzeri
- **npm:** v8 veya üzeri
- **Docker:** v20.10 veya üzeri
- **Docker Compose:** v2.0 veya üzeri
- **Git:** v2.30 veya üzeri

### Kurulum Adımları

1. **Repository'yi Fork Edin**
   ```bash
   # GitHub'da "Fork" butonuna tıklayın
   ```

2. **Projeyi Klonlayın**
   ```bash
   git clone https://github.com/YOUR_USERNAME/LogisticsTMS.git
   cd LogisticsTMS
   ```

3. **Upstream Remote Ekleyin**
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/LogisticsTMS.git
   ```

4. **Environment Dosyalarını Oluşturun**
   ```bash
   # Root
   cp .env.example .env

   # Backend
   cd backend
   cp .env.example .env

   # Frontend
   cd ../frontend
   cp .env.local.example .env.local
   ```

5. **Dependencies Yükleyin**
   ```bash
   # Backend
   cd backend
   npm install

   # Frontend
   cd ../frontend
   npm install
   ```

6. **Docker ile Servisleri Başlatın**
   ```bash
   docker-compose up -d
   ```

7. **Development Serverları Başlatın (Alternatif)**
   ```bash
   # Backend (Terminal 1)
   cd backend
   npm run start:dev

   # Frontend (Terminal 2)
   cd frontend
   npm run dev
   ```

---

## 📝 Kod Standartları

### TypeScript

#### Naming Conventions

```typescript
// Classes: PascalCase
class OrderService { }
class UserRepository { }

// Interfaces: PascalCase with 'I' prefix (optional)
interface IOrder { }
interface UserDto { }

// Functions/Methods: camelCase
function createOrder() { }
async function getUserById() { }

// Variables: camelCase
const userId = '123';
let orderStatus = 'pending';

// Constants: UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = 'https://api.example.com';

// Private properties: camelCase with underscore prefix
private _internalValue: string;

// Enums: PascalCase for enum, UPPER_SNAKE_CASE for values
enum OrderStatus {
  PENDING = 'pending',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
}
```

#### Type Annotations

```typescript
// ✅ Always use explicit types for function parameters and return types
function calculateTotal(price: number, quantity: number): number {
  return price * quantity;
}

// ✅ Use interfaces for object types
interface CreateOrderDto {
  origin: string;
  destination: string;
  loadDetails: string;
}

// ✅ Use type for unions and intersections
type OrderStatusType = 'pending' | 'assigned' | 'delivered';
type EntityWithId = { id: string } & BaseEntity;

// ❌ Avoid 'any'
// Bad
function processData(data: any) { }

// Good
function processData(data: unknown) {
  if (typeof data === 'object') {
    // Type guard
  }
}
```

---

### Code Style

#### Prettier Configuration

Projede otomatik formatting için Prettier kullanılıyor:

```json
// .prettierrc
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "semi": true,
  "arrowParens": "always"
}
```

#### ESLint Rules

```bash
# Linting çalıştır
npm run lint

# Auto-fix
npm run lint -- --fix
```

---

### Backend (NestJS) Standards

#### Module Structure

```typescript
// ✅ Good module structure
@Module({
  imports: [TypeOrmModule.forFeature([Order, Supplier])],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
```

#### Dependency Injection

```typescript
// ✅ Use constructor injection
@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    private readonly suppliersService: SuppliersService,
  ) {}
}
```

#### DTOs ve Validation

```typescript
// ✅ Always validate input with class-validator
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  origin: string;

  @IsString()
  @IsNotEmpty()
  destination: string;

  @IsString()
  @IsNotEmpty()
  loadDetails: string;

  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;
}
```

#### Error Handling

```typescript
// ✅ Use NestJS built-in exceptions
import { NotFoundException, BadRequestException } from '@nestjs/common';

async findOne(id: string): Promise<Order> {
  const order = await this.ordersRepository.findOne({ where: { id } });
  
  if (!order) {
    throw new NotFoundException(`Order with ID "${id}" not found`);
  }
  
  return order;
}

// ✅ Create custom exceptions when needed
export class OrderAlreadyAssignedException extends BadRequestException {
  constructor(orderNumber: string) {
    super(`Order ${orderNumber} is already assigned`);
  }
}
```

---

### Frontend (Next.js/React) Standards

#### Component Structure

```typescript
// ✅ Functional components with TypeScript
import React, { useState, useEffect } from 'react';

interface OrdersListProps {
  orders: Order[];
  onAssign: (order: Order) => void;
}

const OrdersList: React.FC<OrdersListProps> = ({ orders, onAssign }) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    // Effect logic
  }, [orders]);

  return (
    <div>
      {/* JSX */}
    </div>
  );
};

export default OrdersList;
```

#### Hooks Usage

```typescript
// ✅ Custom hooks için 'use' prefix
function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    // Logic
  };

  return { orders, loading, fetchOrders };
}
```

#### API Calls

```typescript
// ✅ Centralized API client
import api from '@/lib/api';

// ✅ Error handling
try {
  const response = await api.get('/orders');
  setOrders(response.data);
} catch (error) {
  console.error('Failed to fetch orders:', error);
  // Show error notification
}
```

---

## 🌿 Git Workflow

### Branch Strategy (Git Flow)

```
main (production)
  ↑
develop (integration)
  ↑
feature/*, bugfix/*, hotfix/*
```

### Branch Naming Convention

```bash
# Feature branches
feature/add-user-management
feature/implement-pagination

# Bug fix branches
bugfix/fix-order-validation
bugfix/resolve-authentication-issue

# Hotfix branches (production'daki kritik buglar)
hotfix/security-vulnerability
hotfix/payment-processing-error

# Release branches
release/v1.0.0
release/v1.1.0
```

### Development Workflow

1. **Branch Oluştur**
   ```bash
   git checkout develop
   git pull upstream develop
   git checkout -b feature/your-feature-name
   ```

2. **Değişiklikleri Yap**
   ```bash
   # Code, test, commit
   git add .
   git commit -m "feat: add new feature"
   ```

3. **Develop ile Senkronize Et**
   ```bash
   git fetch upstream
   git rebase upstream/develop
   ```

4. **Push ve PR Oluştur**
   ```bash
   git push origin feature/your-feature-name
   # GitHub'da Pull Request oluştur
   ```

---

## 💬 Commit Message Formatı

### Conventional Commits

Projede [Conventional Commits](https://www.conventionalcommits.org/) standardı kullanılıyor:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

- **feat:** Yeni özellik
- **fix:** Bug düzeltmesi
- **docs:** Dokümantasyon değişiklikleri
- **style:** Code formatting (kod işlevini etkilemeyen)
- **refactor:** Code refactoring
- **perf:** Performance iyileştirmesi
- **test:** Test ekleme veya düzeltme
- **chore:** Build, dependencies vb. değişiklikler
- **ci:** CI/CD değişiklikleri

### Scope (Opsiyonel)

- **orders:** Orders modülü
- **auth:** Authentication
- **users:** User management
- **ui:** UI components
- **api:** API endpoints

### Examples

```bash
# Feature
feat(orders): add pagination to orders list

# Bug fix
fix(auth): resolve JWT token validation issue

# Documentation
docs: update API documentation with new endpoints

# Refactoring
refactor(orders): extract order validation logic to separate service

# Performance
perf(database): add indexes for frequently queried columns

# Breaking change
feat(api)!: change order status enum values

BREAKING CHANGE: Order status 'in_progress' renamed to 'in_transit'
```

### Bad Examples

```bash
# ❌ Too vague
fix: bug fix

# ❌ No type
added new feature

# ❌ Imperative mood değil
adding pagination feature

# ✅ Good
feat(orders): add pagination support
```

---

## 🔍 Pull Request Süreci

### PR Oluşturmadan Önce

- [ ] Kodunuz test edildi mi?
- [ ] Tüm testler geçiyor mu?
- [ ] Linting hataları var mı?
- [ ] Dokümantasyon güncellendi mi?
- [ ] Branch develop ile senkronize mi?

### PR Template

```markdown
## Açıklama
Bu PR'de neler değişti, neden?

## Değişiklik Tipi
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change
- [ ] Documentation update

## Test Edildi mi?
- [ ] Unit tests eklendi/güncellendi
- [ ] Integration tests eklendi/güncellendi
- [ ] E2E tests eklendi/güncellendi
- [ ] Manuel test yapıldı

## Checklist
- [ ] Kod style guide'a uygun
- [ ] Self-review yapıldı
- [ ] Yorumlar eklendi (karmaşık kısımlar için)
- [ ] Dokümantasyon güncellendi
- [ ] Yeni warning/error yok
- [ ] Dependent değişiklikler merge edildi
```

### Review Süreci

1. **Otomatik Kontroller:** CI/CD pipeline çalışacak
2. **Code Review:** En az 1 reviewer onayı gerekli
3. **Testing:** Tüm testler geçmeli
4. **Approval:** Maintainer onayı
5. **Merge:** Squash and merge (develop'e)

---

## ✅ Code Review Checklist

### Reviewer İçin

#### Functionality
- [ ] Kod amaçlanan işlevi yerine getiriyor mu?
- [ ] Edge case'ler handle ediliyor mu?
- [ ] Error handling uygun mu?

#### Code Quality
- [ ] Kod okunabilir ve anlaşılır mı?
- [ ] DRY prensibi uygulanıyor mu?
- [ ] SOLID prensipleri takip ediliyor mu?
- [ ] Naming convention'lara uygun mu?

#### Testing
- [ ] Yeterli test coverage var mı?
- [ ] Test'ler anlamlı mı?
- [ ] Edge case'ler test ediliyor mu?

#### Security
- [ ] Input validation yapılıyor mu?
- [ ] SQL injection riski var mı?
- [ ] XSS riski var mı?
- [ ] Sensitive data expose ediliyor mu?

#### Performance
- [ ] N+1 query problemi var mı?
- [ ] Gereksiz API call'lar yapılıyor mu?
- [ ] Memory leak riski var mı?

#### Documentation
- [ ] Dokümantasyon güncel mi?
- [ ] Complex logic'ler comment'lenmiş mi?
- [ ] API değişiklikleri dokümante edilmiş mi?

---

## 📁 Dosya ve Klasör Yapısı

### Backend Structure

```
backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.service.spec.ts
│   │   ├── jwt.strategy.ts
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts
│   │   └── dto/
│   │       └── auth-credentials.dto.ts
│   ├── orders/
│   │   ├── orders.module.ts
│   │   ├── orders.controller.ts
│   │   ├── orders.service.ts
│   │   ├── orders.service.spec.ts
│   │   ├── order.entity.ts
│   │   └── dto/
│   │       ├── create-order.dto.ts
│   │       └── update-order.dto.ts
│   ├── common/
│   │   ├── filters/
│   │   ├── interceptors/
│   │   ├── pipes/
│   │   └── decorators/
│   └── config/
│       └── database.config.ts
├── test/
│   └── *.e2e-spec.ts
└── package.json
```

### Frontend Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── dashboard/
│   │       ├── page.tsx
│   │       └── orders/
│   │           └── page.tsx
│   ├── components/
│   │   ├── OrdersList.tsx
│   │   ├── OrdersList.test.tsx
│   │   └── AssignSupplierModal.tsx
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── lib/
│   │   ├── api.ts
│   │   └── utils.ts
│   └── types/
│       └── index.ts
└── package.json
```

### Naming Rules

- **Files:** kebab-case (`order-service.ts`, `user-profile.tsx`)
- **Components:** PascalCase (`OrdersList.tsx`, `UserProfile.tsx`)
- **Tests:** Same as file + `.spec.ts` or `.test.tsx`
- **Folders:** kebab-case (`order-management`, `user-settings`)

---

## 🧪 Testing Kuralları

### Test Coverage Gereksinimleri

- **Minimum Coverage:** 70%
- **Critical Path Coverage:** 90%+
- **New Features:** 80%+ coverage

### Test Writing Guidelines

```typescript
// ✅ Good test structure
describe('OrdersService', () => {
  describe('findOne', () => {
    it('should return an order when ID exists', async () => {
      // Arrange
      const mockOrder = { id: '1', orderNumber: 'ORD-001' };
      mockRepository.findOne.mockResolvedValue(mockOrder);

      // Act
      const result = await service.findOne('1');

      // Assert
      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundException when ID does not exist', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });
});
```

---

## 🐛 Bug Report

Bug bulduğunuzda lütfen şu bilgileri içeren bir issue açın:

1. **Başlık:** Kısa ve açıklayıcı
2. **Açıklama:** Bug'ın detaylı açıklaması
3. **Reproduce Steps:** Adım adım nasıl reproduce edilir
4. **Expected Behavior:** Ne olması gerekiyor
5. **Actual Behavior:** Ne oluyor
6. **Environment:** OS, browser, Node version vb.
7. **Screenshots/Logs:** Varsa ekleyin

---

## 💡 Feature Request

Yeni özellik önerisi için:

1. **Problem:** Hangi problemi çözüyor
2. **Çözüm:** Önerilen çözüm
3. **Alternatifler:** Düşündüğünüz alternatif çözümler
4. **Impact:** Kimler etkilenecek

---

## 📞 İletişim

- **GitHub Issues:** Bug report ve feature request
- **Discussions:** Genel sorular ve tartışmalar
- **Email:** [project-email@example.com]

---

## 📚 Kaynaklar

- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)

---

**Teşekkürler!** 🙏

Katkılarınız projeyi daha iyi hale getiriyor!

