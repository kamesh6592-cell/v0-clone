# AJ STUDIOZ - Project Details

## 🎨 Overview

**AJ STUDIOZ** is an AI-powered development platform that enables users to generate and preview React components and applications using natural language prompts. It features dual AI provider support (v0 SDK and Claude API), authentication, multi-tenant database architecture, and real-time streaming responses.

## 🌟 Key Features

### Dual AI Provider Support
- **v0 SDK Integration**: Full v0 Platform API integration with streaming support
- **Claude API Integration**: Direct Anthropic Claude API for intelligent code generation
- **Provider Toggle**: Switch between AI providers seamlessly in the UI
- **Streaming Toggle**: Enable/disable real-time streaming responses (v0 only)

### Authentication & Multi-Tenant Architecture
- **Anonymous Access**: Create up to 3 chats per day without registration
- **Guest Access**: Auto-generated accounts with 5 chats per day
- **User Registration**: Full accounts with 50 chats per day
- **Session Management**: Secure authentication with NextAuth.js
- **User Navigation**: Dropdown with user info and sign-out options

### Database & Data Management
- **PostgreSQL Database**: Using Nile DB for scalable data storage
- **Drizzle ORM**: Type-safe database operations
- **Multi-Tenant Design**: Ownership mapping for users' chats and projects
- **Rate Limiting**: IP-based and user-based limits to prevent abuse

### UI/UX Features
- **Modern Interface**: Clean, responsive design with dark mode support
- **Split-Screen Layout**: Chat interface and live preview panel
- **Logo Integration**: Custom AJ STUDIOZ branding throughout
- **Mobile Responsive**: Optimized for all screen sizes
- **Real-time Preview**: See generated components instantly

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 15.5.0 with Turbopack
- **UI Library**: React 19.1.0
- **Styling**: Tailwind CSS 4
- **Components**: Radix UI primitives
- **Icons**: Lucide React
- **Type Safety**: TypeScript 5

### Backend
- **Runtime**: Node.js with Next.js API routes
- **AI SDKs**: 
  - v0-sdk ^0.15.0
  - @anthropic-ai/sdk ^0.36.1
  - @ai-sdk/anthropic ^1.0.8
- **Authentication**: NextAuth.js 5.0.0-beta.25
- **Database**: 
  - PostgreSQL (Nile DB)
  - Drizzle ORM ^0.44.5
  - Drizzle Kit ^0.31.4

### Development Tools
- **Package Manager**: npm
- **Build System**: Next.js with Turbopack
- **Code Quality**: TypeScript strict mode
- **Version Control**: Git

## 📁 Project Structure

```
aj-studioz-v0-clone/
├── app/                          # Next.js app directory
│   ├── (auth)/                   # Authentication pages
│   │   ├── login/
│   │   ├── register/
│   │   └── auth.ts
│   ├── api/                      # API routes
│   │   ├── auth/                 # NextAuth endpoints
│   │   ├── chat/                 # Chat creation and messaging
│   │   └── chats/                # Chat management
│   ├── chats/                    # Chat pages
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Homepage
├── components/                   # React components
│   ├── ai-elements/              # AI-specific UI components
│   ├── chat/                     # Chat interface components
│   ├── shared/                   # Shared components (header, etc.)
│   └── ui/                       # UI primitives
├── contexts/                     # React contexts
│   ├── provider-context.tsx      # API provider state
│   └── streaming-context.tsx     # Streaming state
├── lib/                          # Utilities and helpers
│   ├── db/                       # Database configuration
│   │   ├── migrations/           # SQL migrations
│   │   ├── schema.ts             # Database schema
│   │   └── queries.ts            # Database queries
│   ├── env-check.ts              # Environment validation
│   └── utils.ts                  # Utility functions
├── public/                       # Static assets
│   └── aj-logo.jpg               # AJ STUDIOZ logo
├── .env.example                  # Environment template
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
└── README.md                     # Documentation
```

## 🔧 Setup Instructions

### Prerequisites
- Node.js 22+ 
- npm 9+
- PostgreSQL database (Nile DB recommended)
- v0 API key
- Anthropic API key

### Environment Variables

Create a `.env` file with the following variables:

```env
# Auth Secret - Generate with: openssl rand -base64 32
AUTH_SECRET=your-auth-secret-here

# Database Configuration
POSTGRES_URL="postgres://user:password@host/database"
NILEDB_URL="postgres://user:password@host/database"
NILEDB_PASSWORD="your-password"
NILEDB_USER="your-user-id"
NILEDB_API_URL="https://api.thenile.dev/v2/databases/your-db-id"
NILEDB_POSTGRES_URL="postgres://host/database"

# AI Provider API Keys
V0_API_KEY=your_v0_api_key_here
ANTHROPIC_API_KEY=your_claude_api_key_here

# Optional: Custom API URL
# V0_API_URL=http://localhost:3001/v1
```

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd aj-studioz-v0-clone
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your actual credentials
   ```

4. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   ```
   http://localhost:3000
   ```

## 🚀 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate migration files
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Drizzle Studio
- `npm run db:push` - Push schema changes directly

## 🗄️ Database Schema

### Tables

#### users
- `id` (uuid): Primary key
- `email` (varchar): User email
- `password` (varchar): Hashed password
- `created_at` (timestamp): Account creation time

#### chat_ownerships
- `id` (uuid): Primary key
- `v0_chat_id` (varchar): v0 API chat ID
- `user_id` (uuid): Foreign key to users
- `created_at` (timestamp): Ownership creation time

#### anonymous_chat_logs
- `id` (uuid): Primary key
- `ip_address` (varchar): User IP address
- `v0_chat_id` (varchar): v0 API chat ID
- `created_at` (timestamp): Log creation time

## 🔐 Security Features

- **Password Hashing**: bcrypt-ts for secure password storage
- **Session Management**: Secure HTTP-only cookies
- **CSRF Protection**: Built into NextAuth.js
- **SQL Injection Protection**: Drizzle ORM parameterized queries
- **Rate Limiting**: IP and user-based request limits
- **Environment Variables**: Sensitive data in .env files

## 📊 Rate Limits

| User Type | Chats per Day | Data Persistence |
|-----------|---------------|------------------|
| Anonymous | 3             | None             |
| Guest     | 5             | Session only     |
| Registered| 50            | Permanent        |

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/guest` - Create guest account
- `POST /api/auth/[...nextauth]` - NextAuth endpoints

### Chat Management
- `POST /api/chat` - Create new chat or send message
- `GET /api/chats` - Get user's chats
- `GET /api/chats/[chatId]` - Get specific chat
- `POST /api/chat/fork` - Fork a chat
- `DELETE /api/chat/delete` - Delete a chat
- `POST /api/chats/[chatId]/visibility` - Update chat visibility

## 🎨 Customization

### Branding
- Logo: `public/aj-logo.jpg`
- Favicon: `app/favicon.ico`
- Brand name: Update in `app/layout.tsx` and `components/shared/app-header.tsx`

### AI Providers
- Configure providers in `contexts/provider-context.tsx`
- Add new providers in `app/api/chat/route.ts`

### Styling
- Tailwind config: `tailwind.config.js`
- Global styles: `app/globals.css`
- Component styles: Inline with Tailwind classes

## 📦 Deployment

### Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Deploy to Vercel**
   - Import repository in Vercel dashboard
   - Add environment variables
   - Deploy

3. **Configure Database**
   - Set up Nile DB connection
   - Run migrations in production

### Environment Variables for Production
- Add all `.env` variables in Vercel dashboard
- Use strong `AUTH_SECRET` for production
- Configure database URL for production database

## 🐛 Troubleshooting

### Common Issues

1. **Build Errors**
   - Ensure all environment variables are set
   - Check Node.js version (22+)
   - Clear `.next` folder and rebuild

2. **Database Connection**
   - Verify POSTGRES_URL format
   - Check database credentials
   - Ensure database is accessible

3. **API Errors**
   - Verify API keys are valid
   - Check rate limits
   - Review console logs for details

4. **Migration Failures**
   - For Nile DB: Migrations modified to avoid `DROP CASCADE`
   - Run migrations manually if needed
   - Check database permissions

## 📚 Additional Resources

- [v0 Platform API Documentation](https://v0.dev/docs/api/platform)
- [Anthropic Claude API Documentation](https://docs.anthropic.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [NextAuth.js Documentation](https://next-auth.js.org/)

## 🤝 Contributing

This is a custom project for AJ STUDIOZ. For modifications:
1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## 📄 License

Apache 2.0 - See LICENSE file for details

## 👨‍💻 Maintainer

**AJ STUDIOZ**
- Custom development platform
- Enhanced from v0-clone with dual AI support
- Built with modern web technologies

---

**Version**: 1.0.0
**Last Updated**: October 31, 2025
**Status**: Production Ready ✅
