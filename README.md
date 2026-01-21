# Adminizer - Nonprofit Document Management System

A comprehensive document management and business operations platform designed specifically for nonprofit organizations.

## Features

### 📄 Document Management
- Upload, organize, and manage documents by category
- Document expiration tracking and alerts
- Tag-based organization and search
- Secure file storage with role-based access

### 🏢 Multi-tenant Architecture
- Organization-based data isolation
- Role-based access control (Master Admin, Admin, User)
- User invitation and management system

### 🔗 OAuth Integration
- Seamless integration with popular business tools
- Secure OAuth 2.0 authentication
- Support for Google Workspace, QuickBooks, Slack, and more

### 📊 Business Operations Dashboard
- Dedicated operation pages for different business functions
- HR, Accounting, Legal, Branding, and more
- Integration management with contact tracking

### 🔐 Security & Compliance
- Row-level security (RLS) with Supabase
- Secure file storage and access controls
- Audit trails and activity tracking

## Demo Mode

This application includes a comprehensive demo mode for portfolio demonstration:

### To Enable Demo Mode:
1. Set `VITE_DEMO_MODE=true` in your environment variables
2. The application will use sample data instead of connecting to Supabase
3. All features are functional with realistic demo data

### Demo Features:
- **Sample Organization**: "Acme Nonprofit Foundation"
- **Demo Users**: Admin, staff, and volunteer accounts
- **Sample Documents**: Various document types across all categories
- **OAuth Simulation**: Demonstrates OAuth flows without real connections
- **Full Functionality**: All features work with demo data

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Build Tool**: Vite
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Routing**: React Router DOM

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone [repository-url]
cd adminizer
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```

4. For demo mode, set:
```bash
VITE_DEMO_MODE=true
```

5. For production, configure Supabase:
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_DEMO_MODE=false
```

6. Start the development server
```bash
npm run dev
```

## Database Schema

The application uses a comprehensive database schema including:

- **user_profiles**: User management with roles and organization association
- **organizations**: Multi-tenant organization structure
- **documents**: Document storage with metadata and categorization
- **user_invitations**: User invitation system
- **oauth_configs**: OAuth provider configurations
- **oauth_connections**: User OAuth connections and tokens

## Deployment

### Demo Version (Portfolio)
```bash
# Set demo mode
VITE_DEMO_MODE=true

# Build and deploy
npm run build
```

### Production Version
```bash
# Configure Supabase environment variables
# Build and deploy
npm run build
```

## Architecture Highlights

### Security
- Row-Level Security (RLS) for data isolation
- JWT-based authentication
- Secure file upload and storage
- Role-based access control

### Scalability
- Multi-tenant architecture
- Efficient database queries with proper indexing
- Optimized file storage with Supabase Storage

### User Experience
- Responsive design for all devices
- Intuitive navigation and workflows
- Real-time updates and notifications
- Comprehensive search and filtering

## Contributing

This is a portfolio project demonstrating full-stack development capabilities including:

- Modern React development with TypeScript
- Database design and management
- Authentication and authorization
- File upload and management
- OAuth integration
- Multi-tenant architecture
- Security best practices

## License

This project is for portfolio demonstration purposes.