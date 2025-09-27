# Quickstart Guide: FishermenFirst Analytics Platform

## Overview
This quickstart guide demonstrates the core functionality of the FishermenFirst Analytics Platform by walking through key user scenarios for both TEM and Rockfish programs.

## Prerequisites
- Node.js 18+ installed
- Access to Supabase project
- n8n instance for email processing
- Test email accounts configured

## Environment Setup

### 1. Clone and Install
```bash
git clone [repository-url]
cd fishermen-first
npm install
```

### 2. Environment Configuration
Create `.env.local`:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]

# Email Processing
N8N_WEBHOOK_URL=your-n8n-webhook-url
N8N_API_KEY=your-n8n-api-key

# Application
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

### 3. Database Setup
```bash
# Initialize Supabase
npx supabase init
npx supabase start

# Run migrations
npx supabase migration up

# Seed test data
npm run db:seed
```

### 4. Start Development Server
```bash
npm run dev
```

## Test Scenarios

### Scenario 1: TEM Vessel Portal - 4-Trip Calculation

**User Story**: A TEM vessel operator views their trip average calculations and violations.

**Steps**:
1. Navigate to `http://localhost:3000`
2. Click "TEM Portal"
3. Enter test vessel email: `vessel-alaska-dawn@test.com`
4. Check email for magic link and click to authenticate
5. Dashboard should display:
   - Current 4-trip average status
   - Recent landings
   - Any violations or alerts

**Expected Results**:
- User authenticated successfully
- Vessel-specific data displayed
- 4-trip calculations shown correctly
- No access to Rockfish data

**Test Data**:
```sql
-- Vessel: F/V Alaska Dawn (≥60ft vessel)
INSERT INTO vessels (id, vessel_name, registration_number, length_feet, owner_name)
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Alaska Dawn', 'AK-1234', 72, 'John Fisher');

-- Recent landings for 4-trip calculation
INSERT INTO tem_pollock_landings (vessel_id, landing_date, pounds, season_year, season_type)
VALUES
  ('550e8400-e29b-41d4-a716-446655440000', '2025-03-01', 285000, 2025, 'A_SEASON'),
  ('550e8400-e29b-41d4-a716-446655440000', '2025-03-03', 295000, 2025, 'A_SEASON'),
  ('550e8400-e29b-41d4-a716-446655440000', '2025-03-05', 305000, 2025, 'A_SEASON'),
  ('550e8400-e29b-41d4-a716-446655440000', '2025-03-07', 315000, 2025, 'A_SEASON');
```

**Validation**:
- Average should be 300,000 lbs (exactly at threshold)
- No violation triggered
- Next landing >300k average should trigger violation

---

### Scenario 2: TEM Manager Portal - Violation Review

**User Story**: A TEM manager reviews violations and generates compliance reports.

**Steps**:
1. Navigate to `http://localhost:3000/tem/managers`
2. Authenticate as manager: `tem-manager@test.com`
3. Access "Violations" tab
4. Review pending violations
5. Generate compliance report for current season

**Expected Results**:
- Manager can see all TEM vessel data
- Violations listed with penalty calculations
- Compliance report generated successfully
- Export functionality works

**Test Data**:
```sql
-- Create violation for testing
INSERT INTO tem_violations (vessel_id, calculation_id, violation_date, average_pounds, penalty_amount, violation_number)
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'calc-id', '2025-03-10', 310000, 750.00, 1);
```

---

### Scenario 3: Rockfish Vessel Portal - Quota Tracking

**User Story**: A Rockfish vessel operator monitors quota usage and receives alerts.

**Steps**:
1. Navigate to `http://localhost:3000/rockfish`
2. Authenticate as vessel: `vessel-pacific-star@test.com`
3. View quota dashboard
4. Check for alerts (should show 90% warning)
5. View landing history

**Expected Results**:
- Real-time quota balances displayed
- Alert shown for 90% usage threshold
- Progressive alerts (80%, 90%, 95%) functioning
- Landing history accessible

**Test Data**:
```sql
-- Vessel: F/V Pacific Star
INSERT INTO vessels (id, vessel_name, registration_number, length_feet, owner_name)
VALUES ('660e8400-e29b-41d4-a716-446655440001', 'Pacific Star', 'AK-5678', 58, 'Sarah Ocean');

-- Quota allocation at 90% usage
INSERT INTO rp_quota_allocations (vessel_id, species_code, season_year, initial_allocation, current_allocation, used_pounds)
VALUES ('660e8400-e29b-41d4-a716-446655440001', 'POP', 2025, 100000, 100000, 90000);
```

---

### Scenario 4: Rockfish Manager Portal - Quota Transfer

**User Story**: A Rockfish manager approves a quota transfer between vessels.

**Steps**:
1. Navigate to `http://localhost:3000/rockfish/managers`
2. Authenticate as manager: `rockfish-manager@test.com`
3. Access "Transfer Requests" tab
4. Review pending transfer
5. Approve transfer with notes
6. Verify both vessels' quotas updated

**Expected Results**:
- Transfer request visible to manager
- Validation rules enforced
- Atomic quota updates on approval
- Audit trail created

**Test Data**:
```sql
-- Create pending transfer
INSERT INTO rp_quota_transfers (from_vessel_id, to_vessel_id, species_code, transfer_type, pounds, season_year, status)
VALUES (
  '660e8400-e29b-41d4-a716-446655440001',
  '770e8400-e29b-41d4-a716-446655440002',
  'POP',
  'LEASE',
  5000,
  2025,
  'PENDING'
);
```

---

### Scenario 5: Platform Admin - Cross-Program Audit

**User Story**: A platform administrator reviews audit logs across both programs.

**Steps**:
1. Navigate to `http://localhost:3000/admin`
2. Authenticate as admin: `admin@test.com`
3. Access "Audit Logs" section
4. Filter by date range and program
5. Export audit report

**Expected Results**:
- Read-only access to all program data
- Comprehensive audit trail visible
- Export functionality works
- No modification capabilities

---

### Scenario 6: Email Processing - Automated Data Ingestion

**User Story**: TEM landing data received via email is automatically processed.

**Steps**:
1. Send test email to `tem-data@fishermenfirst.org`
2. Include sample landing data attachment
3. Monitor n8n workflow execution
4. Verify data appears in TEM portal
5. Check calculation triggers

**Expected Results**:
- Email parsed successfully
- Landing data extracted and validated
- Database records created
- Calculations triggered automatically
- Error handling for malformed data

**Test Email Content**:
```
Subject: Daily Landing Report - AK-1234 - 2025-03-15

Vessel: AK-1234
Date: 2025-03-15
Species: POLL
Pounds: 285000
Port: Kodiak
```

---

## Integration Testing

### API Contract Testing
```bash
# Run contract tests
npm run test:contracts

# Test TEM API endpoints
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/tem/trip-average/550e8400-e29b-41d4-a716-446655440000?seasonYear=2025&seasonType=A_SEASON

# Test Rockfish API endpoints
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/rockfish/quotas/660e8400-e29b-41d4-a716-446655440001?seasonYear=2025
```

### End-to-End Testing
```bash
# Run full E2E test suite
npm run test:e2e

# Run specific program tests
npm run test:e2e:tem
npm run test:e2e:rockfish
```

## Data Isolation Verification

### Test Program Isolation
1. Authenticate as TEM vessel operator
2. Attempt to access Rockfish endpoints
3. Verify 403 Forbidden responses
4. Check database RLS policies enforced

### Test Role-Based Access
1. Authenticate as vessel operator
2. Attempt to access manager functions
3. Verify proper access restrictions
4. Test admin read-only access

## Performance Testing

### Load Testing
```bash
# Install k6
npm install -g k6

# Run basic load test (25 concurrent users)
k6 run --vus 25 --duration 60s tests/load/basic-load.js

# Test quota updates under load
k6 run --vus 10 --duration 30s tests/load/quota-updates.js
```

## Monitoring & Observability

### Health Checks
- Application: `http://localhost:3000/api/health`
- Database: `http://localhost:3000/api/health/db`
- External services: `http://localhost:3000/api/health/external`

### Logging
```bash
# View application logs
npm run logs

# View database logs
npx supabase logs

# View n8n workflow logs
# Access n8n dashboard at configured URL
```

## Deployment Verification

### Pre-Production Checklist
- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] RLS policies active
- [ ] Email processing configured
- [ ] SSL certificates valid
- [ ] Backup strategy implemented

### Production Deployment
```bash
# Build for production
npm run build

# Run production server
npm start

# Verify health endpoints
curl https://your-domain.com/api/health
```

## Troubleshooting

### Common Issues

**Authentication Problems**:
- Check Supabase configuration
- Verify magic link email delivery
- Test with different email providers

**Data Isolation Issues**:
- Review RLS policy configuration
- Check user role assignments
- Verify JWT token claims

**Calculation Errors**:
- Validate input data formats
- Check business rule implementation
- Review database triggers

**Performance Issues**:
- Monitor database connection pool
- Check index usage
- Review query optimization

### Support Contacts
- Technical Issues: `tech-support@fishermenfirst.org`
- Business Rules: `regulations@fishermenfirst.org`
- Emergency: `emergency@fishermenfirst.org`

---

**Quickstart Complete**: Platform ready for development and testing with comprehensive scenario coverage.