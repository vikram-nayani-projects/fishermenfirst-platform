# Fishermen First Platform

A regulatory compliance platform for Alaska's TEM (Trawl Electronic Monitoring) and Rockfish programs, providing fishermen and managers with essential data services for quota management and compliance tracking.

## Overview

This platform serves the Alaska fishery industry by:

- **TEM Program Compliance**: 4-trip average calculations for vessels ≥60ft (must average ≤300,000 lbs pollock)
- **Rockfish Program Management**: Quota allocations, transfers, and salmon bycatch monitoring
- **User Management**: Role-based access for vessel operators, program managers, and administrators
- **Emergency Data Operations**: CSV upload system for data recovery and bulk updates

## Tech Stack

- **Frontend**: Next.js with React
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Authentication**: Magic Links (passwordless)
- **Deployment**: Vercel (planned: app.fishermenfirst.org)

## Quick Start

1. **Clone and install:**
   ```bash
   git clone https://github.com/yourusername/fishermenfirst-platform.git
   cd fishermenfirst-platform
   npm install
   ```

2. **Environment setup:**
   ```bash
   cp .env.example .env.local
   # Add your Supabase credentials
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

## Core Features

### TEM Program
- Automatic 4-trip average calculations
- Egregious trip tracking (>335,000 lbs)
- Real-time compliance status
- Landing data entry and validation

### Rockfish Program
- Quota allocation management
- Inter-vessel quota transfers
- Salmon bycatch monitoring
- Species-specific tracking

### Admin Interface
- User management with role-based permissions
- CSV data upload with validation
- Emergency SQL tools for data recovery
- System health monitoring

## User Roles

- **vessel**: Vessel operators (can only see their own data)
- **tem_manager**: TEM program managers (TEM data access)
- **rockfish_manager**: Rockfish program managers (Rockfish data access)
- **admin**: Full system access and user management

## Database Schema

### Core Tables (7)
- `users` - User accounts and role assignments
- `vessels` - Vessel registry and specifications
- `tem_pollock_landings` - TEM landing data
- `tem_four_trip_calculations` - Compliance calculations
- `rp_quota_allocations` - Rockfish quota assignments
- `rp_quota_transfers` - Inter-vessel quota transfers
- `rp_salmon_bycatch` - Salmon bycatch monitoring

## Development

### Key Scripts
```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm test             # Run tests
```

### Testing Data
Use the provided scripts to create test data:
```bash
node scripts/create-test-data-final.js
node scripts/test-after-sql.js
```

## Deployment

The platform is designed for:
- **Marketing site**: fishermenfirst.org (Squarespace)
- **Application**: app.fishermenfirst.org (Vercel + Supabase)

## Support

For issues or questions:
- Check `docs/TROUBLESHOOTING.md`
- Review `docs/DEVELOPMENT_LOG.md` for implementation details
- Contact: [Your contact information]

## License

[Your license choice]