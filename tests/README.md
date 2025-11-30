# Test Suite Documentation

## Tổng quan

Test suite này bao phủ các chức năng chính của DOAXVV Wiki website, bao gồm:

- **Content Management**: Content loader, hooks, và data validation
- **Shared Utilities**: Localization, countdown, pagination
- **Shared Components**: Error boundary, localized text
- **Shared Contexts**: Language context và state management
- **Shared Hooks**: Recent searches, pagination, content loading
- **Services**: Search service
- **Routing**: React Router integration

## Cấu trúc Test

```
tests/
├── content/
│   ├── hooks/
│   │   └── useContent.test.ts          # Content loading hooks
│   ├── utils/
│   │   ├── csv-parser.test.ts          # CSV parsing utilities
│   │   ├── csv-serializer.test.ts      # CSV serialization
│   │   ├── markdown-loader.test.ts     # Markdown loading
│   │   └── validator.test.ts           # Content validation
│   └── loader.test.ts                  # Content loader singleton
├── features/
│   └── routing.test.tsx                # React Router tests
├── services/
│   └── search.service.test.ts          # Search functionality
├── shared/
│   ├── components/
│   │   ├── ErrorBoundary.test.tsx      # Error boundary component
│   │   └── LocalizedText.test.tsx      # Localized text component
│   ├── contexts/
│   │   └── LanguageContext.test.tsx    # Language context provider
│   ├── hooks/
│   │   ├── usePagination.test.ts       # Pagination hook
│   │   └── useRecentSearches.test.ts   # Recent searches hook
│   └── utils/
│       ├── countdown.test.ts           # Countdown utilities
│       └── localization.test.ts        # Localization utilities
├── setup.ts                            # Test setup và configuration
└── README.md                           # Documentation này
```

## Chạy Tests

### Chạy tất cả tests
```bash
npm test
```

### Chạy tests một lần (không watch mode)
```bash
npm test -- --run
```

### Chạy tests với coverage
```bash
npm test -- --coverage
```

### Chạy tests cho một file cụ thể
```bash
npm test -- tests/shared/utils/localization.test.ts
```

### Chạy tests với pattern matching
```bash
npm test -- --grep "localization"
```

## Test Coverage

### Content Management (10 tests)
- ✅ Content loader singleton pattern
- ✅ Lazy loading và caching
- ✅ Request deduplication
- ✅ Selective content loading
- ✅ Cache management

### Content Hooks (17 tests)
- ✅ Loading states
- ✅ Error handling
- ✅ Refetch functionality
- ✅ Multiple content types
- ✅ Cleanup on unmount

### Search Service (52 tests)
- ✅ Empty query handling
- ✅ Character search (English, Japanese, Chinese)
- ✅ Guide search với difficulty badges
- ✅ Event search với status badges
- ✅ Multi-type search
- ✅ Language support
- ✅ Case-insensitive matching

### Localization (9 tests)
- ✅ Get localized values
- ✅ Fallback to English
- ✅ All translations retrieval
- ✅ Language code validation

### Language Context (10 tests)
- ✅ Initialization với default language
- ✅ LocalStorage persistence
- ✅ Language switching
- ✅ HTML lang attribute updates
- ✅ Available languages list

### Pagination (14 tests)
- ✅ Initialization với default/custom values
- ✅ Navigation (next, previous, first, last, goto)
- ✅ Indices calculation
- ✅ Page range calculation
- ✅ Array pagination
- ✅ Reset functionality

### Recent Searches (15 tests)
- ✅ LocalStorage persistence
- ✅ Add/remove/clear searches
- ✅ Duplicate prevention
- ✅ Max items limit
- ✅ Move to front on duplicate

### Countdown Utilities (15 tests)
- ✅ Time remaining calculation
- ✅ Expired dates handling
- ✅ Time formatting
- ✅ Multiple time units

### Error Boundary (11 tests)
- ✅ Error catching và fallback UI
- ✅ Custom fallback support
- ✅ Error callback
- ✅ Reset functionality
- ✅ Console logging

### Routing (9 tests)
- ✅ Home route
- ✅ Characters routes
- ✅ Events routes
- ✅ Guides routes
- ✅ Search route
- ✅ 404 handling
- ✅ Nested routes

### Content Utilities (tests)
- ✅ CSV parsing và serialization
- ✅ Markdown loading
- ✅ Content validation

## Test Setup

### Dependencies
- **vitest**: Test runner
- **@testing-library/react**: React component testing
- **@testing-library/user-event**: User interaction simulation
- **@testing-library/jest-dom**: DOM matchers
- **jsdom**: DOM environment

### Configuration
Test configuration được định nghĩa trong `vitest.config.ts`:
- Environment: jsdom
- Setup file: tests/setup.ts
- Coverage: src/**/*.{ts,tsx}
- Globals: true

### Mocks
- `window.matchMedia`: Media query matching
- `IntersectionObserver`: Intersection observation
- `ResizeObserver`: Resize observation
- `localStorage`: Local storage operations

## Best Practices

### 1. Test Organization
- Nhóm tests theo describe blocks
- Sử dụng descriptive test names
- Arrange-Act-Assert pattern

### 2. Mocking
- Mock external dependencies
- Use vi.fn() cho function mocks
- Clear mocks trong beforeEach

### 3. Async Testing
- Sử dụng waitFor cho async operations
- Use act() cho state updates
- Handle cleanup properly

### 4. Component Testing
- Test user interactions
- Test accessibility
- Test error states

### 5. Coverage Goals
- Aim for >80% coverage
- Focus on critical paths
- Test edge cases

## Thêm Tests Mới

### 1. Tạo test file
```typescript
import { describe, it, expect } from 'vitest';

describe('MyFeature', () => {
  it('should do something', () => {
    // Test implementation
  });
});
```

### 2. Component tests
```typescript
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### 3. Hook tests
```typescript
import { renderHook, act } from '@testing-library/react';
import { useMyHook } from './useMyHook';

describe('useMyHook', () => {
  it('should work', () => {
    const { result } = renderHook(() => useMyHook());
    
    act(() => {
      result.current.doSomething();
    });
    
    expect(result.current.value).toBe('expected');
  });
});
```

## Troubleshooting

### Tests failing với "React is not defined"
- Thêm `import React from 'react'` ở đầu file test

### LocalStorage errors
- Đảm bảo localStorage được mock trong beforeEach
- Implement removeItem method trong mock

### Async tests timeout
- Tăng timeout: `{ timeout: 10000 }`
- Sử dụng waitFor với proper conditions

### Coverage không chính xác
- Check exclude patterns trong vitest.config.ts
- Đảm bảo test files không được include trong coverage

## Continuous Integration

Tests được chạy tự động trong CI/CD pipeline:
- Pre-commit: Lint và type check
- Pre-push: Run all tests
- Pull Request: Full test suite + coverage report

## Tài liệu tham khảo

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
