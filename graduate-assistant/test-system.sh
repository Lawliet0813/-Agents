#!/bin/bash

# Graduate Assistant System Test Script
# Tests all components and generates a comprehensive report

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0
TEST_RESULTS=()

# Helper functions
print_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"
}

print_test() {
    echo -e "${YELLOW}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    TEST_RESULTS+=("✓ $1")
}

print_fail() {
    echo -e "${RED}[✗]${NC} $1"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    TEST_RESULTS+=("✗ $1")
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Start tests
clear
print_header "Graduate Assistant System Test Suite"
echo "Starting tests at $(date)"
echo "Test directory: $(pwd)"

# ============================================================================
# 1. Environment Check
# ============================================================================
print_header "1. Environment Check"

print_test "Checking Node.js installation"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js installed: $NODE_VERSION"
else
    print_fail "Node.js not installed"
fi

print_test "Checking npm installation"
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm installed: $NPM_VERSION"
else
    print_fail "npm not installed"
fi

print_test "Checking TypeScript installation"
if command -v tsc &> /dev/null; then
    TSC_VERSION=$(tsc --version)
    print_success "TypeScript installed: $TSC_VERSION"
else
    print_fail "TypeScript not installed"
fi

print_test "Checking Prisma CLI"
if command -v prisma &> /dev/null; then
    PRISMA_VERSION=$(prisma --version | head -n 1)
    print_success "Prisma CLI installed: $PRISMA_VERSION"
else
    print_fail "Prisma CLI not installed"
fi

print_test "Checking PM2 installation"
if command -v pm2 &> /dev/null; then
    PM2_VERSION=$(pm2 --version)
    print_success "PM2 installed: $PM2_VERSION"
else
    print_fail "PM2 not installed (optional for production)"
fi

print_test "Checking exiftool installation"
if command -v exiftool &> /dev/null; then
    EXIFTOOL_VERSION=$(exiftool -ver)
    print_success "exiftool installed: $EXIFTOOL_VERSION"
else
    print_fail "exiftool not installed (required for iCloud watcher)"
fi

print_test "Checking ffmpeg installation"
if command -v ffmpeg &> /dev/null; then
    FFMPEG_VERSION=$(ffmpeg -version | head -n 1 | cut -d ' ' -f 3)
    print_success "ffmpeg installed: $FFMPEG_VERSION"
else
    print_fail "ffmpeg not installed (required for audio processing)"
fi

# ============================================================================
# 2. Project Structure Check
# ============================================================================
print_header "2. Project Structure Check"

REQUIRED_DIRS=(
    "src/app"
    "src/components"
    "src/server/api"
    "src/server/services"
    "src/services/voice-watcher"
    "prisma"
    "public"
)

for dir in "${REQUIRED_DIRS[@]}"; do
    print_test "Checking directory: $dir"
    if [ -d "$dir" ]; then
        print_success "Directory exists: $dir"
    else
        print_fail "Directory missing: $dir"
    fi
done

REQUIRED_FILES=(
    "package.json"
    "tsconfig.json"
    "next.config.js"
    "tailwind.config.ts"
    "prisma/schema.prisma"
    ".env"
)

for file in "${REQUIRED_FILES[@]}"; do
    print_test "Checking file: $file"
    if [ -f "$file" ]; then
        print_success "File exists: $file"
    else
        print_fail "File missing: $file"
    fi
done

# ============================================================================
# 3. Environment Variables Check
# ============================================================================
print_header "3. Environment Variables Check"

if [ -f ".env" ]; then
    print_info "Found .env file"

    # Check critical environment variables
    ENV_VARS=(
        "DATABASE_URL"
        "NEXTAUTH_URL"
        "NEXTAUTH_SECRET"
        "GOOGLE_CLIENT_ID"
        "GOOGLE_CLIENT_SECRET"
    )

    source .env 2>/dev/null || true

    for var in "${ENV_VARS[@]}"; do
        print_test "Checking $var"
        if [ -n "${!var}" ]; then
            print_success "$var is set"
        else
            print_fail "$var is not set"
        fi
    done
else
    print_fail ".env file not found"
fi

# ============================================================================
# 4. Dependencies Check
# ============================================================================
print_header "4. Dependencies Check"

print_test "Checking node_modules"
if [ -d "node_modules" ]; then
    MODULE_COUNT=$(ls -1 node_modules | wc -l)
    print_success "node_modules exists with $MODULE_COUNT packages"
else
    print_fail "node_modules not found - run 'npm install'"
fi

print_test "Checking package.json dependencies"
if [ -f "package.json" ]; then
    REQUIRED_PACKAGES=(
        "next"
        "react"
        "typescript"
        "@trpc/server"
        "@trpc/client"
        "prisma"
        "@prisma/client"
        "next-auth"
        "openai"
        "@anthropic-ai/sdk"
        "googleapis"
        "@notionhq/client"
        "chokidar"
    )

    for package in "${REQUIRED_PACKAGES[@]}"; do
        if grep -q "\"$package\"" package.json; then
            print_success "Package found: $package"
        else
            print_fail "Package missing: $package"
        fi
    done
else
    print_fail "package.json not found"
fi

# ============================================================================
# 5. Database Check
# ============================================================================
print_header "5. Database Check"

print_test "Checking Prisma schema"
if [ -f "prisma/schema.prisma" ]; then
    print_success "Prisma schema found"

    print_test "Validating Prisma schema"
    if npx prisma validate &> /dev/null; then
        print_success "Prisma schema is valid"
    else
        print_fail "Prisma schema has errors"
    fi

    print_test "Checking Prisma Client generation"
    if [ -d "node_modules/.prisma" ]; then
        print_success "Prisma Client is generated"
    else
        print_fail "Prisma Client not generated - run 'npx prisma generate'"
    fi
else
    print_fail "Prisma schema not found"
fi

# ============================================================================
# 6. TypeScript Compilation Check
# ============================================================================
print_header "6. TypeScript Compilation Check"

print_test "Checking TypeScript configuration"
if [ -f "tsconfig.json" ]; then
    print_success "tsconfig.json found"

    print_test "Type checking (this may take a while...)"
    if npx tsc --noEmit &> /dev/null; then
        print_success "TypeScript compilation successful"
    else
        print_fail "TypeScript compilation has errors (check with 'npm run build')"
    fi
else
    print_fail "tsconfig.json not found"
fi

# ============================================================================
# 7. Voice Watcher Service Check
# ============================================================================
print_header "7. Voice Watcher Service Check"

WATCHER_FILES=(
    "src/services/voice-watcher/index.ts"
    "src/services/voice-watcher/watcher.ts"
    "src/services/voice-watcher/transcript-extractor.ts"
    "src/services/voice-watcher/course-identifier.ts"
    "src/services/voice-watcher/processor.ts"
    "src/services/voice-watcher/notifier.ts"
    "src/services/voice-watcher/pm2.config.js"
)

for file in "${WATCHER_FILES[@]}"; do
    print_test "Checking: $file"
    if [ -f "$file" ]; then
        print_success "File exists: $(basename $file)"
    else
        print_fail "File missing: $file"
    fi
done

print_test "Checking PM2 process (if running)"
if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "voice-watcher"; then
        print_success "voice-watcher is running in PM2"
    else
        print_info "voice-watcher is not running (start with 'pm2 start src/services/voice-watcher/pm2.config.js')"
    fi
else
    print_info "PM2 not available"
fi

# ============================================================================
# 8. API Routes Check
# ============================================================================
print_header "8. API Routes Check"

API_ROUTERS=(
    "src/server/api/routers/auth.ts"
    "src/server/api/routers/courses.ts"
    "src/server/api/routers/assignments.ts"
    "src/server/api/routers/notes.ts"
    "src/server/api/routers/ai.ts"
    "src/server/api/routers/calendar.ts"
    "src/server/api/routers/sync.ts"
)

for router in "${API_ROUTERS[@]}"; do
    print_test "Checking router: $(basename $router)"
    if [ -f "$router" ]; then
        print_success "Router exists: $(basename $router .ts)"
    else
        print_fail "Router missing: $router"
    fi
done

# ============================================================================
# 9. Service Implementations Check
# ============================================================================
print_header "9. Service Implementations Check"

SERVICES=(
    "src/server/services/moodle-service.ts"
    "src/server/services/whisper-service.ts"
    "src/server/services/ai-service.ts"
    "src/server/services/google-calendar-service.ts"
    "src/server/services/gmail-service.ts"
    "src/server/services/notion-service.ts"
)

for service in "${SERVICES[@]}"; do
    print_test "Checking service: $(basename $service)"
    if [ -f "$service" ]; then
        print_success "Service exists: $(basename $service .ts)"
    else
        print_fail "Service missing: $service"
    fi
done

# ============================================================================
# 10. UI Components Check
# ============================================================================
print_header "10. UI Components Check"

UI_PAGES=(
    "src/app/dashboard/page.tsx"
    "src/app/dashboard/courses/page.tsx"
    "src/app/dashboard/assignments/page.tsx"
    "src/app/dashboard/notes/page.tsx"
    "src/app/dashboard/notes/pending/page.tsx"
    "src/app/dashboard/assistant/page.tsx"
    "src/app/dashboard/calendar/page.tsx"
    "src/app/dashboard/settings/page.tsx"
    "src/app/dashboard/settings/voice-watcher/page.tsx"
)

for page in "${UI_PAGES[@]}"; do
    print_test "Checking page: $(basename $(dirname $page))/$(basename $page)"
    if [ -f "$page" ]; then
        print_success "Page exists"
    else
        print_fail "Page missing: $page"
    fi
done

# ============================================================================
# 11. Documentation Check
# ============================================================================
print_header "11. Documentation Check"

DOCS=(
    "README.md"
    "GRADUATE_ASSISTANT_COMPLETE.md"
    "PHASE_5_ICLOUD_COMPLETE.md"
    "ICLOUD_VOICE_WATCHER_GUIDE.md"
)

for doc in "${DOCS[@]}"; do
    print_test "Checking documentation: $doc"
    if [ -f "$doc" ]; then
        print_success "Document exists: $doc"
    else
        print_info "Optional document missing: $doc"
    fi
done

# ============================================================================
# 12. Git Repository Check
# ============================================================================
print_header "12. Git Repository Check"

print_test "Checking if directory is a git repository"
if [ -d ".git" ]; then
    print_success "Git repository initialized"

    BRANCH=$(git branch --show-current)
    print_info "Current branch: $BRANCH"

    COMMITS=$(git rev-list --count HEAD)
    print_info "Total commits: $COMMITS"

    print_test "Checking git status"
    if [ -z "$(git status --porcelain)" ]; then
        print_success "Working directory is clean"
    else
        print_info "Working directory has uncommitted changes"
    fi
else
    print_fail "Not a git repository"
fi

# ============================================================================
# Test Summary
# ============================================================================
print_header "Test Summary"

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))

echo -e "${GREEN}Passed:${NC} $TESTS_PASSED / $TOTAL_TESTS"
echo -e "${RED}Failed:${NC} $TESTS_FAILED / $TOTAL_TESTS"

PASS_RATE=$((TESTS_PASSED * 100 / TOTAL_TESTS))
echo -e "${BLUE}Pass Rate:${NC} $PASS_RATE%"

echo ""
if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo -e "${GREEN}✓ System is ready for deployment${NC}"
else
    echo -e "${YELLOW}⚠ Some tests failed. Please review the results above.${NC}"
fi

# ============================================================================
# Generate Report File
# ============================================================================
REPORT_FILE="test-report-$(date +%Y%m%d-%H%M%S).txt"

{
    echo "Graduate Assistant System Test Report"
    echo "======================================"
    echo ""
    echo "Test Date: $(date)"
    echo "Test Directory: $(pwd)"
    echo ""
    echo "Results:"
    echo "--------"
    echo "Total Tests: $TOTAL_TESTS"
    echo "Passed: $TESTS_PASSED"
    echo "Failed: $TESTS_FAILED"
    echo "Pass Rate: $PASS_RATE%"
    echo ""
    echo "Detailed Results:"
    echo "-----------------"
    for result in "${TEST_RESULTS[@]}"; do
        echo "$result"
    done
    echo ""
    echo "System Information:"
    echo "-------------------"
    echo "Node.js: $(node --version 2>/dev/null || echo 'Not installed')"
    echo "npm: $(npm --version 2>/dev/null || echo 'Not installed')"
    echo "TypeScript: $(tsc --version 2>/dev/null || echo 'Not installed')"
    echo "Prisma: $(prisma --version 2>/dev/null | head -n 1 || echo 'Not installed')"
    echo "PM2: $(pm2 --version 2>/dev/null || echo 'Not installed')"
    echo ""
    echo "Git Information:"
    echo "----------------"
    echo "Branch: $(git branch --show-current 2>/dev/null || echo 'N/A')"
    echo "Latest Commit: $(git log -1 --oneline 2>/dev/null || echo 'N/A')"
    echo ""
} > "$REPORT_FILE"

print_info "Full report saved to: $REPORT_FILE"

echo ""
print_header "Test Complete"
echo "Test finished at $(date)"

# Exit with appropriate code
if [ $TESTS_FAILED -eq 0 ]; then
    exit 0
else
    exit 1
fi
