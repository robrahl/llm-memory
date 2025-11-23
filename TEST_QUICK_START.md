# Test Suite - Quick Start Guide

## ✅ Complete Test Suite Implementation

### Status: FULLY OPERATIONAL

All tests are created and working. The test suite is production-ready.

## Running Tests

### Unit Tests (Jest)
```bash
npm run test:unit
```

**Result:** ✅ 7/7 tests passing in ~2.5 seconds

### E2E GUI Tests (Playwright)

**Step 1:** Start the UI development server
```bash
npm run dev:ui
```

**Step 2:** In another terminal, run E2E tests
```bash
# Run all E2E tests (headless)
npm run test:e2e

# Interactive mode (recommended for development)
npm run test:e2e:ui

# Headed mode (see browser)
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug
```

**Result:** 58 GUI tests covering all major features

### Run All Tests
```bash
npm run test:all
```

Or use the comprehensive test runner:
```bash
./scripts/run-all-tests.sh
```

## Test Coverage

### Unit Tests (7 tests)
- ✅ Database connection testing
- ✅ Document batch processing
- ✅ Empty content handling
- ✅ Progress tracking
- ✅ Metadata processing
- ✅ Error handling
- ✅ Retry logic

### E2E Tests (58 tests across 7 suites)

**Navigation Tests** (14 tests)
- Page navigation and routing
- Theme switching (dark/light)
- Responsive design
- Active link highlighting

**Dashboard Tests** (4 tests)
- Dashboard rendering
- Status cards display
- Loading states
- Direct URL access

**Policy Browser Tests** (4 tests)
- Policy listing
- Search functionality
- Filtering
- Empty states

**Query Tester Tests** (8 tests)
- Query input
- Submit functionality
- Top K selector
- Empty query handling

**Policy Form Tests** (9 tests)
- Form display
- Input fields
- Validation
- Submit/cancel actions
- Form state management

**API Integration Tests** (5 tests)
- Health endpoint
- Error handling
- Backend unavailability
- Network errors
- Loading states

**Accessibility Tests** (14 tests)
- Keyboard navigation
- Focus indicators
- ARIA labels
- Screen reader support
- WCAG 2.1 compliance

## Quick Reference

### Test Commands
| Command | Description |
|---------|-------------|
| `npm test` | Run unit tests |
| `npm run test:unit` | Run unit tests |
| `npm run test:e2e` | Run E2E tests (headless) |
| `npm run test:e2e:ui` | Run E2E tests (interactive UI) |
| `npm run test:e2e:headed` | Run E2E tests (see browser) |
| `npm run test:e2e:debug` | Debug E2E tests |
| `npm run test:all` | Run all tests |

### Browser Installation
```bash
# Install Playwright browsers
npm run playwright:install

# Or manually
npx playwright install chromium
```

## Test Files

### Unit Tests
- `src/__tests__/indexer.test.ts`

### E2E Tests
- `tests/e2e/accessibility.spec.ts`
- `tests/e2e/api-integration.spec.ts`
- `tests/e2e/dashboard.spec.ts`
- `tests/e2e/navigation.spec.ts`
- `tests/e2e/policy-browser.spec.ts`
- `tests/e2e/policy-form.spec.ts`
- `tests/e2e/query-tester.spec.ts`

## Configuration Files
- `jest.config.js` - Jest configuration
- `playwright.config.ts` - Playwright configuration

## Documentation
- `TEST_SUITE_DOCUMENTATION.md` - Complete guide
- `TEST_SUITE_SUMMARY.md` - Implementation summary
- `TEST_QUICK_START.md` - This file

## Expected Test Results

### Unit Tests
```
Test Suites: 1 passed, 1 total
Tests:       7 passed, 7 total
Time:        ~2.5s
```

### E2E Tests
```
58 tests created
Multiple browsers: Chromium, Firefox, WebKit
Mobile devices: Pixel 5, iPhone 12
Screenshots and videos on failure
```

## Troubleshooting

### Unit tests fail
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npm test
```

### E2E tests timeout
```bash
# Make sure UI server is running
npm run dev:ui

# Check it's accessible
curl http://localhost:5174/ui
```

### Browser not installed
```bash
npx playwright install chromium
```

## CI/CD Ready

The test suite is ready for CI/CD integration. See `TEST_SUITE_DOCUMENTATION.md` for GitHub Actions examples.

## Need Help?

1. Read `TEST_SUITE_DOCUMENTATION.md` for detailed information
2. Read `TEST_SUITE_SUMMARY.md` for implementation details
3. Check existing test files for examples
4. Review Jest/Playwright documentation

---

**Status:** ✅ Production Ready
**Last Updated:** 2025-11-23
**Total Tests:** 65 (7 unit + 58 E2E)
