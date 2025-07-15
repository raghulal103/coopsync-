# Cooperative ERP Platform

A comprehensive, multi-tenant ERP (Enterprise Resource Planning) web application specifically designed for cooperative societies in India. This platform integrates essential business modules including project management, labour contracts, accounting, payroll, GST compliance, audit trails, asset management, and dividend distribution systems.

## 🎯 Project Overview

This solution addresses the unique operational challenges faced by cooperative societies by providing a scalable, secure, and compliant platform that adheres to Indian financial regulations and labour laws. The architecture emphasizes multi-tenancy, role-based access control, and seamless integration with statutory compliance requirements.

## 🏗️ Architecture

### Technology Stack

#### Backend
- **Framework**: Node.js with Express.js
- **Database**: PostgreSQL (primary), Redis (caching)
- **Authentication**: JWT + OAuth2 with optional biometric integration
- **ORM**: Sequelize with full TypeScript support
- **Security**: Helmet, CORS, Rate limiting, Data sanitization

#### Frontend
- **Framework**: React.js 18 with Hooks
- **Styling**: Tailwind CSS with custom design system
- **State Management**: Zustand + React Query
- **Routing**: React Router v6
- **Forms**: React Hook Form with validation
- **UI Components**: Custom component library

#### DevOps & Deployment
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Monitoring**: Winston (logging), Prometheus + Grafana
- **Cloud**: AWS/Azure compatible

## 🚀 Features

### Core Modules

#### 1. **User Management System**
- Multi-role access control (Admin, Member, Labour, Auditor, Developer, Marketer)
- Tenant-based data isolation
- Biometric/QR code authentication
- Account lockout and security policies

#### 2. **Project Management**
- Project planning and task assignment
- Resource allocation and tracking
- Progress monitoring with Gantt charts
- Budget control and variance analysis

#### 3. **Labour Management**
- QR/biometric attendance tracking
- Shift management and scheduling
- Labour law compliance monitoring
- Daily wage calculations

#### 4. **Payroll Processing**
- Automated salary calculations
- EPF, ESI, and statutory deductions
- Payslip generation and distribution
- Multi-level approval workflows

#### 5. **Accounting & Finance**
- Chart of accounts management
- Automated journal entries
- Bank reconciliation
- Financial reporting

#### 6. **GST Integration**
- GST-compliant invoice generation
- Automated tax calculations
- Monthly/quarterly return filing
- Real-time compliance monitoring

#### 7. **Asset Management**
- Complete asset lifecycle tracking
- Automated depreciation calculations
- Maintenance scheduling
- Asset valuation and reporting

#### 8. **Audit & Compliance**
- Comprehensive audit trail logging
- Real-time compliance alerts
- Internal audit tools
- Regulatory reporting

#### 9. **Dividend Management**
- Shareholder registry management
- Automated dividend calculations
- Voting rights tracking
- Share allocation processes

#### 10. **Subscription Management**
- Flexible billing engine
- Revenue sharing for developers/marketers
- Subscription tier management
- Usage analytics

## 📁 Project Structure

```
cooperative-erp-platform/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── controllers/
│   │   │   └── authController.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js
│   │   │   ├── auditMiddleware.js
│   │   │   ├── errorMiddleware.js
│   │   │   └── tenantMiddleware.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Tenant.js
│   │   │   ├── Role.js
│   │   │   ├── Permission.js
│   │   │   └── index.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   └── [other routes]
│   │   ├── services/
│   │   ├── utils/
│   │   │   └── logger.js
│   │   └── server.js
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   ├── tests/
│   ├── uploads/
│   ├── logs/
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   ├── layout/
│   │   │   ├── ui/
│   │   │   └── forms/
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── users/
│   │   │   └── [other pages]
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── assets/
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   ├── package.json
│   └── tailwind.config.js
├── docker-compose.yml
├── package.json
└── README.md
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- Redis (v6 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-org/cooperative-erp-platform.git
cd cooperative-erp-platform
```

2. **Install dependencies**
```bash
npm run install:all
```

3. **Set up environment variables**
```bash
cp backend/.env.example backend/.env
```

Edit the `.env` file with your configuration:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cooperative_erp_dev
DB_USERNAME=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=development

# Additional configurations...
```

4. **Set up the database**
```bash
# Create database
createdb cooperative_erp_dev

# Run migrations
cd backend
npm run migrate

# Seed initial data
npm run seed
```

5. **Start the development servers**
```bash
# From project root
npm run dev

# Or start individually
npm run backend:dev  # Backend on port 5000
npm run frontend:dev # Frontend on port 3000
```

### Docker Setup

1. **Using Docker Compose**
```bash
docker-compose up --build
```

This will start:
- Backend API (port 5000)
- Frontend app (port 3000)
- PostgreSQL database (port 5432)
- Redis cache (port 6379)

## 📊 API Documentation

The API documentation is available at:
- **Development**: http://localhost:5000/api-docs
- **Swagger UI**: Interactive API documentation with request/response examples

### Authentication

All API endpoints (except public routes) require authentication:

```bash
# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# Use the token in subsequent requests
curl -X GET http://localhost:5000/api/v1/users \
  -H "Authorization: Bearer <your-token>"
```

## 🔐 Security Features

### Multi-Factor Authentication
- TOTP-based MFA with QR code setup
- Backup codes for recovery
- SMS/Email-based verification

### Role-Based Access Control
- Hierarchical role system
- Permission-based access control
- Tenant-specific role isolation

### Security Monitoring
- Real-time security event logging
- Failed login attempt tracking
- Suspicious activity alerts

### Data Protection
- End-to-end encryption
- GDPR compliance
- Data retention policies
- Audit trail maintenance

## 🏢 Multi-Tenant Architecture

### Tenant Isolation
- **Database Level**: Tenant-specific schemas
- **Application Level**: Request-level tenant context
- **File Storage**: Tenant-specific directories

### Tenant Management
- Self-service tenant registration
- Subscription management
- Usage analytics and billing
- Feature flag management

## 📋 Compliance Features

### Indian Regulatory Compliance
- **GST**: Complete GST filing and reporting
- **Labour Laws**: Attendance and wage compliance
- **Financial Regulations**: Accounting standard adherence
- **Cooperative Laws**: Society-specific requirements

### Audit & Reporting
- Comprehensive audit trails
- Real-time compliance monitoring
- Automated report generation
- Exception handling and alerts

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### End-to-End Tests
```bash
npm run test:e2e
```

## 🚢 Deployment

### Production Build
```bash
npm run build
```

### Docker Deployment
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Environment-Specific Configurations
- **Development**: Local development with hot reload
- **Staging**: Production-like environment for testing
- **Production**: Optimized build with security hardening

## 📈 Performance Monitoring

### Metrics Collection
- **Application Performance**: Response times, error rates
- **Database Performance**: Query optimization, connection pooling
- **User Analytics**: Feature usage, user behavior

### Alerting
- **System Health**: CPU, memory, disk usage
- **Application Errors**: Error tracking and notification
- **Business Metrics**: Revenue, user adoption

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow ESLint and Prettier configurations
- Write comprehensive tests
- Update documentation
- Follow semantic versioning

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- **Email**: support@cooperativeerp.com
- **Documentation**: https://docs.cooperativeerp.com
- **Issues**: GitHub Issues tracker

## 🗺️ Roadmap

### Phase 1 (Current)
- ✅ Core infrastructure and user management
- ✅ Authentication and authorization
- ✅ Multi-tenant architecture
- ✅ Basic audit logging

### Phase 2 (Next)
- 🔄 Complete all ERP modules
- 🔄 Advanced reporting and analytics
- 🔄 Mobile application
- 🔄 API integrations

### Phase 3 (Future)
- 📋 AI-powered insights
- 📋 Advanced workflow automation
- 📋 IoT device integration
- 📋 Blockchain integration for transparency

## 🙏 Acknowledgments

- The cooperative society community for requirements and feedback
- Open source contributors and maintainers
- Technology partners and service providers

---

**Built with ❤️ for Cooperative Societies in India**