# 🚀 Project Decypher

**Reviving Lost Languages Through Intelligent Design**

An AI-powered SaaS platform for ancient text decryption and translation. Built with Next.js, TypeScript, and modern web technologies.

## ✨ Technology Stack

This scaffold provides a robust foundation built with:

### 🎯 Core Framework
- **⚡ Next.js 15** - The React framework for production with App Router
- **📘 TypeScript 5** - Type-safe JavaScript for better developer experience
- **🎨 Tailwind CSS 4** - Utility-first CSS framework for rapid UI development

### 🧩 UI Components & Styling
- **🧩 shadcn/ui** - High-quality, accessible components built on Radix UI
- **🎯 Lucide React** - Beautiful & consistent icon library
- **🌈 Framer Motion** - Production-ready motion library for React
- **🎨 Next Themes** - Perfect dark mode in 2 lines of code

### 📋 Forms & Validation
- **🎣 React Hook Form** - Performant forms with easy validation
- **✅ Zod** - TypeScript-first schema validation

### 🔄 State Management & Data Fetching
- **🐻 Zustand** - Simple, scalable state management
- **🔄 TanStack Query** - Powerful data synchronization for React
- **🌐 Axios** - Promise-based HTTP client

### 🗄️ Database & Backend
- **🗄️ Prisma** - Next-generation Node.js and TypeScript ORM
- **🔐 NextAuth.js** - Complete open-source authentication solution

### 🎨 Advanced UI Features
- **📊 TanStack Table** - Headless UI for building tables and datagrids
- **🖱️ DND Kit** - Modern drag and drop toolkit for React
- **📊 Recharts** - Redefined chart library built with React and D3
- **🖼️ Sharp** - High performance image processing

### 🌍 Internationalization & Utilities
- **🌍 Next Intl** - Internationalization library for Next.js
- **📅 Date-fns** - Modern JavaScript date utility library
- **🪝 ReactUse** - Collection of essential React hooks for modern development

## 🎯 Why This Scaffold?

- **🏎️ Fast Development** - Pre-configured tooling and best practices
- **🎨 Beautiful UI** - Complete shadcn/ui component library with advanced interactions
- **🔒 Type Safety** - Full TypeScript configuration with Zod validation
- **📱 Responsive** - Mobile-first design principles with smooth animations
- **🗄️ Database Ready** - Prisma ORM configured for rapid backend development
- **🔐 Auth Included** - NextAuth.js for secure authentication flows
- **📊 Data Visualization** - Charts, tables, and drag-and-drop functionality
- **🌍 i18n Ready** - Multi-language support with Next Intl
- **🚀 Production Ready** - Optimized build and deployment settings
- **🤖 AI-Friendly** - Structured codebase perfect for AI assistance

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- SQLite (included with Node.js)

### Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env and update NEXTAUTH_SECRET with a secure random string
# Generate one with: openssl rand -base64 32
```

3. **Initialize the database:**
```bash
npm run db:push
npm run db:seed
```

4. **Start the development server:**
```bash
npm run dev
```

5. **Open your browser:**
Navigate to [http://localhost:3000](http://localhost:3000)

### Demo Account

For testing, you can use the demo account:
- **Email:** demo@projectdecypher.com
- **Password:** demo123

## 🔐 Authentication

The application uses NextAuth.js for authentication with credentials provider:

- **Sign Up:** `/auth/register` - Create a new account
- **Sign In:** `/auth/login` - Sign in to your account
- **Dashboard:** `/dashboard` - View your uploads and statistics
- **Protected Routes:** Upload and translations pages require authentication

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/          # NextAuth authentication routes
│   │   ├── upload/         # File upload endpoint
│   │   ├── process/        # Text processing endpoint
│   │   ├── translations/   # Translations API
│   │   └── dashboard/      # Dashboard stats API
│   ├── auth/              # Authentication pages (login, register)
│   ├── dashboard/         # User dashboard
│   ├── upload/            # File upload page
│   ├── translations/      # Translations library
│   └── page.tsx           # Homepage
├── components/
│   ├── providers/         # React providers (Session)
│   └── ui/                # shadcn/ui components
├── lib/
│   ├── auth.ts            # NextAuth configuration
│   ├── db.ts              # Prisma client
│   └── get-session.ts     # Server session helper
└── types/
    └── next-auth.d.ts     # NextAuth type definitions
```

## 🗄️ Database

The project uses Prisma ORM with SQLite. Key models:

- **User** - User accounts with authentication
- **Upload** - Uploaded files and their processing status
- **AncientScript** - Supported ancient scripts
- **Glyph** - Individual glyphs/symbols
- **GlyphMatch** - Matched glyphs in uploads
- **Translation** - Translation results
- **Feedback** - User feedback on translations

### Database Commands

```bash
# Push schema changes to database
npm run db:push

# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database with sample data
npm run db:seed

# Reset database (WARNING: deletes all data)
npm run db:reset
```

## ✨ Features

### Core Functionality

- **🔐 User Authentication** - Secure sign up and login with NextAuth.js
- **📤 File Upload** - Upload images of ancient manuscripts and inscriptions
- **🤖 AI Processing** - Automated glyph recognition and tokenization
- **📖 Translation** - Semantic translation with confidence scores
- **📊 Dashboard** - User dashboard with statistics and activity
- **📚 Translation Library** - Browse and search your translations
- **🎨 Modern UI** - Beautiful, responsive interface with dark mode support

### Technical Features

- **Type Safety** - Full TypeScript coverage
- **Form Validation** - Zod schema validation with React Hook Form
- **Protected Routes** - Authentication-based route protection
- **Database ORM** - Prisma for type-safe database access
- **Responsive Design** - Mobile-first design with Tailwind CSS
- **Component Library** - shadcn/ui for consistent UI components

## 🛠️ Development

### Environment Variables

Required environment variables (see `.env.example`):

```env
DATABASE_URL="file:./db/dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

### Building for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

The build output is optimized for standalone deployment.

## 📁 Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable React components
│   └── ui/             # shadcn/ui components
├── hooks/              # Custom React hooks
└── lib/                # Utility functions and configurations
```

## 🎨 Available Features & Components

This scaffold includes a comprehensive set of modern web development tools:

### 🧩 UI Components (shadcn/ui)
- **Layout**: Card, Separator, Aspect Ratio, Resizable Panels
- **Forms**: Input, Textarea, Select, Checkbox, Radio Group, Switch
- **Feedback**: Alert, Toast (Sonner), Progress, Skeleton
- **Navigation**: Breadcrumb, Menubar, Navigation Menu, Pagination
- **Overlay**: Dialog, Sheet, Popover, Tooltip, Hover Card
- **Data Display**: Badge, Avatar, Calendar

### 📊 Advanced Data Features
- **Tables**: Powerful data tables with sorting, filtering, pagination (TanStack Table)
- **Charts**: Beautiful visualizations with Recharts
- **Forms**: Type-safe forms with React Hook Form + Zod validation

### 🎨 Interactive Features
- **Animations**: Smooth micro-interactions with Framer Motion
- **Drag & Drop**: Modern drag-and-drop functionality with DND Kit
- **Theme Switching**: Built-in dark/light mode support

### 🔐 Backend Integration
- **Authentication**: Ready-to-use auth flows with NextAuth.js
- **Database**: Type-safe database operations with Prisma
- **API Client**: HTTP requests with Axios + TanStack Query
- **State Management**: Simple and scalable with Zustand

### 🌍 Production Features
- **Internationalization**: Multi-language support with Next Intl
- **Image Optimization**: Automatic image processing with Sharp
- **Type Safety**: End-to-end TypeScript with Zod validation
- **Essential Hooks**: 100+ useful React hooks with ReactUse for common patterns

## 🤝 Get Started with Z.ai

1. **Clone this scaffold** to jumpstart your project
2. **Visit [chat.z.ai](https://chat.z.ai)** to access your AI coding assistant
3. **Start building** with intelligent code generation and assistance
4. **Deploy with confidence** using the production-ready setup

## 📝 License

This project is part of the Project Decypher initiative by Zhicong Technology.

## 🤝 Contributing

This is a project for ancient language decryption and cultural heritage preservation. Contributions that improve accuracy, add new script support, or enhance the user experience are welcome.

---

**Project Decypher** - Reviving lost languages through intelligent design 🚀
