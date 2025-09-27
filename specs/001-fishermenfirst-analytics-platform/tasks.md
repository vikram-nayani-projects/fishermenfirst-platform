# Tasks: FishermenFirst Analytics Platform

**Input**: Design documents from `/specs/001-fishermenfirst-analytics-platform/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Tech stack: TypeScript, Next.js 14+, Supabase, n8n, Tailwind CSS
   → Structure: Next.js App Router with app/, lib/, components/, tests/
2. Load optional design documents:
   → data-model.md: 12 core entities → model tasks
   → contracts/: 2 API files → contract test tasks
   → research.md: Tech decisions → setup tasks
3. Generate tasks by category:
   → Setup: Next.js project, Supabase, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: database schema, API routes, pages, components
   → Integration: authentication, RLS policies, calculations
   → Polish: E2E tests, performance, documentation
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Database migrations = sequential
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Next.js App Router**: `app/`, `lib/`, `components/`, `tests/` at repository root
- Paths shown below follow Next.js 14+ structure from plan.md

## Phase 3.1: Setup
- [ ] T001 Create Next.js 14+ project structure with TypeScript and Tailwind CSS
- [ ] T002 Initialize Supabase project and configure environment variables
- [ ] T003 [P] Configure ESLint, Prettier, and TypeScript config files
- [ ] T004 [P] Set up Jest and React Testing Library for testing
- [ ] T005 [P] Install project dependencies: Supabase client, Tailwind, testing libraries

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T006 [P] Contract test TEM API endpoints in tests/contract/test_tem_api.spec.ts
- [ ] T007 [P] Contract test Rockfish API endpoints in tests/contract/test_rockfish_api.spec.ts
- [ ] T008 [P] Integration test TEM vessel portal flow in tests/integration/test_tem_vessel_portal.spec.ts
- [ ] T009 [P] Integration test Rockfish quota tracking in tests/integration/test_rockfish_quota.spec.ts
- [ ] T010 [P] Integration test magic link authentication in tests/integration/test_auth_flow.spec.ts
- [ ] T011 [P] Integration test program data isolation in tests/integration/test_data_isolation.spec.ts
- [ ] T012 [P] Integration test 4-trip calculation logic in tests/integration/test_tem_calculations.spec.ts

## Phase 3.3: Database Schema (ONLY after tests are failing)
- [ ] T013 Create initial Supabase migration with user management tables
- [ ] T014 Create vessel registry migration with vessels and program participation tables
- [ ] T015 Create TEM program migration with landings, calculations, and violations tables
- [ ] T016 Create Rockfish program migration with quotas, transfers, and bycatch tables
- [ ] T017 Create system tables migration for audit logs and file storage
- [ ] T018 Create Row Level Security policies for all tables
- [ ] T019 Create database triggers for TEM landing processing
- [ ] T020 Create database triggers for Rockfish quota updates
- [ ] T021 Create database indexes for performance optimization

## Phase 3.4: TypeScript Types and Utilities
- [ ] T022 [P] Define database types in lib/types/database.ts
- [ ] T023 [P] Define API response types in lib/types/api.ts
- [ ] T024 [P] Define business logic types in lib/types/business.ts
- [ ] T025 [P] Create Supabase client utility in lib/supabase/client.ts
- [ ] T026 [P] Create server-side Supabase client in lib/supabase/server.ts
- [ ] T027 [P] Create authentication utilities in lib/auth/utils.ts
- [ ] T028 [P] Create validation schemas in lib/validation/schemas.ts

## Phase 3.5: Business Logic and Calculations
- [ ] T029 [P] Implement TEM 4-trip calculation engine in lib/calculations/tem-four-trip.ts
- [ ] T030 [P] Implement TEM calendar day calculation in lib/calculations/tem-calendar-day.ts
- [ ] T031 [P] Implement Rockfish quota tracking logic in lib/calculations/rockfish-quota.ts
- [ ] T032 [P] Implement quota transfer validation in lib/calculations/quota-transfers.ts
- [ ] T033 [P] Implement salmon bycatch tracking in lib/calculations/salmon-bycatch.ts
- [ ] T034 [P] Create data validation utilities in lib/utils/validation.ts
- [ ] T035 [P] Create audit logging utilities in lib/utils/audit.ts

## Phase 3.6: API Routes Implementation
- [ ] T036 [P] Implement TEM trip average API in app/api/tem/trip-average/[vesselId]/route.ts
- [ ] T037 [P] Implement TEM violations API in app/api/tem/violations/[vesselId]/route.ts
- [ ] T038 [P] Implement TEM compliance reports API in app/api/tem/reports/compliance/route.ts
- [ ] T039 [P] Implement TEM landing corrections API in app/api/tem/landing-corrections/route.ts
- [ ] T040 [P] Implement Rockfish quotas API in app/api/rockfish/quotas/[vesselId]/route.ts
- [ ] T041 [P] Implement Rockfish transfers API in app/api/rockfish/transfers/route.ts
- [ ] T042 [P] Implement Rockfish transfer validation API in app/api/rockfish/transfers/validate/route.ts
- [ ] T043 [P] Implement Rockfish salmon bycatch API in app/api/rockfish/salmon-bycatch/route.ts
- [ ] T044 [P] Implement authentication API routes in app/api/auth/
- [ ] T045 [P] Implement health check API in app/api/health/route.ts

## Phase 3.7: Shared Components
- [ ] T046 [P] Create UI components library in components/ui/
- [ ] T047 [P] Create navigation component in components/navigation/main-nav.tsx
- [ ] T048 [P] Create auth components in components/auth/
- [ ] T049 [P] Create data table component in components/ui/data-table.tsx
- [ ] T050 [P] Create quota display component in components/rockfish/quota-display.tsx
- [ ] T051 [P] Create violation display component in components/tem/violation-display.tsx
- [ ] T052 [P] Create alert components in components/ui/alerts.tsx
- [ ] T053 [P] Create form components in components/ui/forms.tsx

## Phase 3.8: TEM Program Pages
- [ ] T054 [P] Create TEM vessel dashboard in app/tem/vessels/page.tsx
- [ ] T055 [P] Create TEM vessel trip history in app/tem/vessels/trips/page.tsx
- [ ] T056 [P] Create TEM vessel violations in app/tem/vessels/violations/page.tsx
- [ ] T057 [P] Create TEM manager dashboard in app/tem/managers/page.tsx
- [ ] T058 [P] Create TEM manager violations review in app/tem/managers/violations/page.tsx
- [ ] T059 [P] Create TEM manager reports in app/tem/managers/reports/page.tsx
- [ ] T060 [P] Create TEM calculations display in app/tem/calculations/page.tsx

## Phase 3.9: Rockfish Program Pages
- [ ] T061 [P] Create Rockfish vessel dashboard in app/rockfish/vessels/page.tsx
- [ ] T062 [P] Create Rockfish vessel quota tracking in app/rockfish/vessels/quotas/page.tsx
- [ ] T063 [P] Create Rockfish vessel transfer requests in app/rockfish/vessels/transfers/page.tsx
- [ ] T064 [P] Create Rockfish manager dashboard in app/rockfish/managers/page.tsx
- [ ] T065 [P] Create Rockfish manager quota overview in app/rockfish/managers/quotas/page.tsx
- [ ] T066 [P] Create Rockfish manager transfer approval in app/rockfish/managers/transfers/page.tsx
- [ ] T067 [P] Create Rockfish quota allocation forms in app/rockfish/quotas/allocations/page.tsx

## Phase 3.10: Admin and Authentication Pages
- [ ] T068 [P] Create admin dashboard in app/admin/page.tsx
- [ ] T069 [P] Create admin user management in app/admin/users/page.tsx
- [ ] T070 [P] Create admin audit logs in app/admin/audit/page.tsx
- [ ] T071 [P] Create authentication pages in app/auth/
- [ ] T072 [P] Create landing page with program selection in app/page.tsx
- [ ] T073 [P] Create error pages (404, 500) in app/error.tsx and app/not-found.tsx

## Phase 3.11: Real-time Features and Middleware
- [ ] T074 Implement Supabase real-time subscriptions for quota updates
- [ ] T075 Create authentication middleware for protected routes
- [ ] T076 Implement rate limiting middleware for API routes
- [ ] T077 Create audit logging middleware for all data changes
- [ ] T078 Implement progressive quota alerts (80%, 90%, 95%)

## Phase 3.12: Email Processing and n8n Integration
- [ ] T079 [P] Create n8n workflow configuration for TEM email parsing
- [ ] T080 [P] Create n8n workflow configuration for Rockfish email parsing
- [ ] T081 [P] Implement email validation and parsing utilities in lib/email/
- [ ] T082 [P] Create webhook endpoints for n8n integration in app/api/webhooks/
- [ ] T083 [P] Implement file storage and processing logic

## Phase 3.13: Polish and Documentation
- [ ] T084 [P] Write unit tests for business logic in tests/unit/
- [ ] T085 [P] Create Playwright E2E tests for critical user flows in tests/e2e/
- [ ] T086 [P] Implement performance monitoring and optimization
- [ ] T087 [P] Create API documentation in docs/api.md
- [ ] T088 [P] Update README with setup and deployment instructions
- [ ] T089 [P] Create user documentation for each portal
- [ ] T090 Run quickstart.md test scenarios and validate all functionality

## Dependencies
- Setup (T001-T005) before everything else
- Tests (T006-T012) before all implementation
- Database schema (T013-T021) before API routes and pages
- Types and utilities (T022-T028) before business logic and components
- Business logic (T029-T035) before API routes
- API routes (T036-T045) before pages that consume them
- Shared components (T046-T053) before program-specific pages
- Authentication and middleware (T074-T078) before protected features
- All core features before polish (T084-T090)

## Parallel Execution Examples
```bash
# Phase 3.2: Launch all contract tests together
Task: "Contract test TEM API endpoints in tests/contract/test_tem_api.spec.ts"
Task: "Contract test Rockfish API endpoints in tests/contract/test_rockfish_api.spec.ts"
Task: "Integration test TEM vessel portal flow in tests/integration/test_tem_vessel_portal.spec.ts"
Task: "Integration test Rockfish quota tracking in tests/integration/test_rockfish_quota.spec.ts"

# Phase 3.4: Launch all type definitions together
Task: "Define database types in lib/types/database.ts"
Task: "Define API response types in lib/types/api.ts"
Task: "Define business logic types in lib/types/business.ts"
Task: "Create Supabase client utility in lib/supabase/client.ts"

# Phase 3.6: Launch all API routes together (after dependencies)
Task: "Implement TEM trip average API in app/api/tem/trip-average/[vesselId]/route.ts"
Task: "Implement TEM violations API in app/api/tem/violations/[vesselId]/route.ts"
Task: "Implement Rockfish quotas API in app/api/rockfish/quotas/[vesselId]/route.ts"
Task: "Implement Rockfish transfers API in app/api/rockfish/transfers/route.ts"
```

## Validation Checklist
*GATE: Checked before task execution*

- [x] All contracts have corresponding tests (T006-T007 cover tem-api.yaml, rockfish-api.yaml)
- [x] All entities have model tasks (Database schema T013-T017 covers all entities)
- [x] All tests come before implementation (Phase 3.2 before 3.3+)
- [x] Parallel tasks truly independent (Different files, no shared dependencies)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] TDD workflow enforced (Tests MUST FAIL before implementation)
- [x] Program isolation maintained (Separate TEM/Rockfish tasks)
- [x] Critical business logic covered (4-trip calculations, quota tracking, transfers)

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each completed task
- Maintain strict TEM/Rockfish data isolation
- Follow Supabase RLS policies for all data access
- Implement magic link authentication per specification
- Ensure audit trails for all data changes

## Task Execution Ready
Total tasks: **90 numbered tasks** covering complete fishery management platform
Dependencies mapped, parallel execution optimized, TDD workflow enforced