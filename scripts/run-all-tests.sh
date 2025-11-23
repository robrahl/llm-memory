#!/bin/bash

# Comprehensive Test Runner Script
# Runs all test suites and generates a report

set -e  # Exit on error

echo "======================================"
echo "  llm-memory Test Suite Runner"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track test results
UNIT_TEST_RESULT=0
E2E_TEST_RESULT=0
BUILD_RESULT=0
LINT_RESULT=0

# Function to print section header
print_section() {
    echo ""
    echo "======================================"
    echo "  $1"
    echo "======================================"
    echo ""
}

# Function to print result
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2 PASSED${NC}"
    else
        echo -e "${RED}✗ $2 FAILED${NC}"
    fi
}

# 1. Linting
print_section "1. Running ESLint"
if npm run lint; then
    LINT_RESULT=0
    print_result 0 "Linting"
else
    LINT_RESULT=1
    print_result 1 "Linting"
fi

# 2. TypeScript Build
print_section "2. Building TypeScript"
if npm run build; then
    BUILD_RESULT=0
    print_result 0 "TypeScript Build"
else
    BUILD_RESULT=1
    print_result 1 "TypeScript Build"
    echo -e "${RED}Build failed. Skipping further tests.${NC}"
    exit 1
fi

# 3. Unit Tests
print_section "3. Running Unit Tests (Jest)"
if npm run test:unit; then
    UNIT_TEST_RESULT=0
    print_result 0 "Unit Tests"
else
    UNIT_TEST_RESULT=1
    print_result 1 "Unit Tests"
fi

# 4. E2E Tests
print_section "4. Running E2E Tests (Playwright)"
echo "Note: This requires the UI dev server to be running."
echo "Starting tests in 3 seconds..."
sleep 3

if npm run test:e2e -- --project=chromium; then
    E2E_TEST_RESULT=0
    print_result 0 "E2E Tests"
else
    E2E_TEST_RESULT=1
    print_result 1 "E2E Tests"
fi

# Summary
print_section "Test Summary"
echo ""
print_result $LINT_RESULT "Linting"
print_result $BUILD_RESULT "Build"
print_result $UNIT_TEST_RESULT "Unit Tests"
print_result $E2E_TEST_RESULT "E2E Tests"
echo ""

# Calculate total failures
TOTAL_FAILURES=$((LINT_RESULT + BUILD_RESULT + UNIT_TEST_RESULT + E2E_TEST_RESULT))

if [ $TOTAL_FAILURES -eq 0 ]; then
    echo -e "${GREEN}======================================"
    echo "  All Tests Passed! ✓"
    echo "======================================${NC}"
    exit 0
else
    echo -e "${RED}======================================"
    echo "  $TOTAL_FAILURES Test Suite(s) Failed"
    echo "======================================${NC}"
    exit 1
fi
