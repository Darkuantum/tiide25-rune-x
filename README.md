# 🚀 Rune-X

**Interpreting the Past. Empowering the Future.**

An advanced multimodal AI platform for ancient script interpretation, reconstruction, and semantic analysis. Built with Next.js 15, TypeScript, and modern web technologies.

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Technology Stack](#-technology-stack)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [API Endpoints](#-api-endpoints)
- [Core Modules](#-core-modules)
- [Features](#-features)
- [Development](#-development)
- [Deployment](#-deployment)
- [License](#-license)

## ✨ Overview

Rune-X is a production-grade, multimodal artificial intelligence platform designed to automate the interpretation of ancient scripts and inscriptions. It addresses the critical gap between digitised heritage content and the ability to interpret, annotate, and make this content usable for research and cultural preservation.

### Problem Statement

Digitised ancient manuscripts, inscriptions, and archaeological texts often remain inaccessible due to:
- Irregular or damaged glyphs
- Lack of automated recognition systems
- Missing contextual information
- Limited expert availability
- No standardized semantic representation

### Solution

Rune-X provides a comprehensive platform that:
- Automates glyph recognition from images
- Reconstructs damaged characters using AI
- Provides semantic translations with confidence scores
- Tracks provenance and metadata
- Exports to scholarly formats (TEI-XML, JSON-LD)

## 🏗️ Architecture

Rune-X integrates three technically robust components:

### 1. **Glyph Tokenisation Engine (GTE)**
- **Purpose**: Isolates and represents individual glyphs from irregular or damaged inscriptions
- **Technology**: OCR (Tesseract.js, Google Gemini Vision)
- **Features**:
  - Multi-script support (Oracle Bone, Bronze, Seal Script, Traditional Chinese, etc.)
  - Bounding box detection
  - Stroke count analysis
  - Contour complexity metrics

### 2. **Semantic Transformer Model (STM)**
- **Purpose**: Infers phonetic, semantic, or structural meaning from visual and contextual cues
- **Technology**: Google Gemini AI, contextual embeddings
- **Features**:
  - Character-level semantic analysis
  - Context-aware translation
  - Multi-language support
  - Confidence scoring

### 3. **Generative Reconstruction Module (GRM)**
- **Purpose**: Restores damaged glyphs using evidence-driven synthesis techniques
- **Technology**: Google Gemini 2.0 Flash, visual AI
- **Features**:
  - Damaged glyph detection (confidence < 0.7)
  - Context-aware reconstruction
  - Historical period consideration
  - Evidence-driven synthesis

### System Flow

```
Image Upload → File Storage → OCR (GTE)
                               ↓
                         Glyph Database ← Match/Create
                               ↓
                    Semantic Analysis (STM)
                               ↓
                         Translation DB
                               ↓
                    Reconstruction (GRM) → Version Control
                               ↓
                    Export (TEI-XML, JSON-LD, CSV)
```

## 🛠️ Technology Stack

### Core Framework
- **Next.js 15.5.9** - React framework with App Router, Server Components
- **TypeScript 5** - Type-safe development
- **React 19** - Latest React with Server Components

### UI & Styling
- **Tailwind CSS 4** - Utility-first CSS framework
- **shadcn/ui** - High-quality component library built on Radix UI
- **Lucide React** - Beautiful icons
- **Framer Motion** - Animation library
- **Next Themes** - Dark mode support

### Forms & Validation
- **React Hook Form 7.60** - Performant form library
- **Zod 4** - TypeScript-first schema validation
- **@hookform/resolvers** - Form validation integration

### State & Data
- **Zustand 5** - Lightweight state management
- **TanStack Query 5.82** - Server state management
- **TanStack Table 8.21** - Headless table library
- **Axios 1.10** - HTTP client with proxy support

### Database & ORM
- **Prisma 6.11** - Next-generation ORM
- **SQLite** - Embedded database (development)
- **PostgreSQL** - Production database (recommended)

### Authentication
- **NextAuth.js 4.24** - Complete authentication solution
- **bcryptjs** - Password hashing

### AI & Image Processing
- **@google/generative-ai 0.21** - Google Gemini API
- **Tesseract.js 5.1** - OCR engine
- **Sharp 0.34** - High-performance image processing

### Advanced UI Components
- **@dnd-kit** - Drag and drop functionality
- **Recharts 2.15** - Chart library
- **React Markdown 10.1** - Markdown rendering
- **React Syntax Highlighter** - Code highlighting
- **Date-fns 4.1** - Date utilities

### Developer Experience
- **ESLint 9** - Code linting
- **Prettier** - Code formatting (via Tailwind)
- **TypeScript** - Type checking
- **tsx** - TypeScript execution

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **SQLite** (included with Node.js)
- **Google Gemini API Key** (optional, for best results)

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd tiide25-rune-x
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp example.env .env
```

Edit `.env` and configure:
```env
# Database
DATABASE_URL="file:./db/dev.db"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<generate-with: openssl rand -base64 32>"

# AI Processing (Optional - better accuracy)
GOOGLE_GEMINI_API_KEY="your_gemini_api_key"
ENABLE_OCR_FALLBACK="true"  # Enable dev fallback if no API key

# Proxy (Optional - for restricted networks)
HTTP_PROXY="http://127.0.0.1:1080"
HTTPS_PROXY="http://127.0.0.1:1080"
```

4. **Initialize the database:**
```bash
npm run db:push    # Create database schema
npm run db:seed    # Seed with sample data
```

5. **Start the development server:**
```bash
npm run dev
```

6. **Open your browser:**
Navigate to [http://localhost:3000](http://localhost:3000)

### Demo Account

For testing, use the seeded demo account:
- **Email:** `demo@runex.com`
- **Password:** `demo123`

## 📁 Project Structure

```
tiide25-rune-x/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.ts                # Database seeding script
│   └── db/                    # SQLite database files
├── public/
│   └── images/                # Static images
├── scripts/
│   └── dev-with-port-fallback.js  # Dev server with port fallback
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   │   ├── [...nextauth]/   # NextAuth.js handler
│   │   │   │   └── register/        # User registration
│   │   │   ├── admin/         # Admin endpoints
│   │   │   │   └── reset/           # Database reset
│   │   │   ├── batch/         # Batch processing
│   │   │   ├── dashboard/     # Dashboard stats
│   │   │   ├── export/        # Export functionality
│   │   │   ├── glyphs/        # Glyph management
│   │   │   ├── process/       # Main processing endpoint
│   │   │   ├── translations/  # Translation management
│   │   │   ├── upload/        # File upload
│   │   │   └── uploads/[id]/  # Serve uploaded files
│   │   ├── auth/              # Auth pages
│   │   │   ├── login/         # Login page
│   │   │   └── register/      # Registration page
│   │   ├── dashboard/         # User dashboard
│   │   ├── translations/      # Translation library
│   │   ├── upload/            # Upload interface
│   │   │   ├── page.tsx       # Main upload page
│   │   │   └── ResultsDisplay.tsx  # Results component
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Homepage
│   │   └── globals.css        # Global styles
│   ├── components/
│   │   ├── providers/         # React context providers
│   │   │   └── session-provider.tsx
│   │   └── ui/                # shadcn/ui components
│   ├── hooks/
│   │   └── use-toast.ts       # Toast notifications
│   ├── lib/
│   │   ├── ai-processor.ts    # AI processing logic (GTE + STM)
│   │   ├── auth.ts            # NextAuth configuration
│   │   ├── db.ts              # Prisma client
│   │   ├── export.ts          # Export utilities (TEI-XML, JSON-LD)
│   │   ├── fetch-with-proxy.ts # Proxy support
│   │   ├── get-session.ts     # Server session helper
│   │   ├── grm.ts             # Generative Reconstruction Module
│   │   └── utils.ts           # Utility functions
│   └── types/
│       └── next-auth.d.ts     # NextAuth type augmentation
├── .env                       # Environment variables
├── example.env                # Example environment config
├── next.config.ts             # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies and scripts
```

## 🗄️ Database Schema

### Core Models

#### User
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  password  String   # Hashed with bcrypt
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  uploads   Upload[]
  feedback  Feedback[]
}
```

#### Upload
```prisma
model Upload {
  id            String   @id @default(cuid())
  userId        String
  originalName  String
  filePath      String
  processedAt   DateTime?
  status        ProcessingStatus @default(PENDING)
  
  # Enhanced metadata for Rune-X
  provenance    String?  # Excavation ID, catalogue number
  imagingMethod String?  # Photography, CT, multispectral
  metadata      String?  # JSON additional context
  scriptType    String?  # Detected script type
  
  user          User       @relation(...)
  glyphs        GlyphMatch[]
  translations  Translation[]
  versions      ReconstructionVersion[]
  exports       Export[]
}
```

#### AncientScript
```prisma
model AncientScript {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  region      String?
  timePeriod  String?
  
  glyphs      Glyph[]
}
```

#### Glyph
```prisma
model Glyph {
  id          String   @id @default(cuid())
  scriptId    String
  symbol      String   # Unicode or image representation
  name        String?
  description String?  # Semantic meaning
  strokeCount Int?
  radicals    String?  # JSON array of components
  confidence  Float    @default(0.0)
  
  script      AncientScript @relation(...)
  matches     GlyphMatch[]
  translations Translation[]
}
```

#### GlyphMatch (GTE Output)
```prisma
model GlyphMatch {
  id              String   @id @default(cuid())
  uploadId        String
  glyphId         String
  confidence      Float
  boundingBox     String?  # JSON: {x, y, width, height}
  position        Int?     # Position in text
  
  # GTE metrics
  strokeCount     Int?
  contourComplexity Float?
  isReconstructed Boolean @default(false)
  
  upload          Upload @relation(...)
  glyph           Glyph  @relation(...)
}
```

#### Translation (STM Output)
```prisma
model Translation {
  id             String   @id @default(cuid())
  uploadId       String
  originalText   String
  translatedText String
  confidence     Float
  language       String
  context        String?
  
  upload         Upload @relation(...)
}
```

#### ReconstructionVersion (GRM Output)
```prisma
model ReconstructionVersion {
  id                  String   @id @default(cuid())
  uploadId            String
  versionNumber       Int
  reconstructedGlyphs String   # JSON
  confidence          Float
  method              String?  # "gemini-grm"
  
  upload              Upload @relation(...)
}
```

### Database Commands

```bash
# Push schema to database
npm run db:push

# Generate Prisma Client
npm run db:generate

# Create migration
npm run db:migrate

# Seed database with sample data
npm run db:seed

# Reset database (WARNING: deletes all data)
npm run db:reset
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/[...nextauth]` - NextAuth.js authentication handler
- `GET /api/auth/session` - Get current session

### Upload & Processing
- `POST /api/upload` - Upload image file
- `POST /api/process` - Process uploaded image (OCR + Translation)
- `GET /api/process?uploadId={id}` - Get processing results
- `POST /api/batch` - Batch process multiple uploads

### Data Management
- `GET /api/translations` - Get user's translations
- `GET /api/translations?filter=all` - Get all translations with details
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/uploads/{id}` - Serve uploaded image file

### Export
- `GET /api/export?uploadId={id}&format={TEI_XML|JSON_LD|CSV}` - Export translation

### Admin
- `POST /api/admin/reset` - Reset database (admin only)

### Advanced
- `POST /api/glyphs` - Advanced glyph processing with AI
- `GET /api/route` - Root API route

## 🧩 Core Modules

### 1. AI Processor (`src/lib/ai-processor.ts`)

**Main Functions:**
- `extractTextFromImage(imagePath)` - OCR using Tesseract or Gemini
- `matchGlyphs(text, db, translationContext)` - Match glyphs to database
- `generateTranslation(text, glyphs)` - Generate semantic translation
- `processAncientText(imagePath, db)` - Complete processing pipeline

**OCR Providers:**
1. **Google Gemini Vision** (primary, requires API key)
2. **Tesseract.js** (fallback, local)
3. **Development fallback** (for testing without APIs)

**Processing Pipeline:**
```typescript
Image → OCR → Glyph Matching → Translation → Database Storage
```

### 2. Generative Reconstruction Module (`src/lib/grm.ts`)

**Main Functions:**
- `reconstructGlyph(imagePath, boundingBox, context)` - Reconstruct single glyph
- `batchReconstructGlyphs(imagePath, glyphs, context)` - Batch reconstruction
- `needsReconstruction(glyph)` - Determine if reconstruction needed

**Reconstruction Criteria:**
- No symbol detected
- Confidence < 0.7
- Bounding box too small (< 10px)

**Output Format:**
```typescript
{
  reconstructedGlyph: string
  confidence: number
  method: "gemini-grm"
  reconstructionDetails: string
}
```

### 3. Export Module (`src/lib/export.ts`)

**Export Formats:**
- **TEI-XML** - Text Encoding Initiative standard for scholarly texts
- **JSON-LD** - Linked Data format with semantic web compatibility
- **CSV** - Simple tabular format for spreadsheet analysis

**Export Functions:**
- `exportToTEI(data)` - Generate TEI-XML
- `exportToJSONLD(data)` - Generate JSON-LD
- `exportToCSV(data)` - Generate CSV

## ✨ Features

### User Features
- 🔐 **Authentication** - Secure sign up/login with NextAuth.js
- 📤 **File Upload** - Drag and drop or click to upload images
- 🤖 **AI Processing** - Automated glyph recognition and translation
- 📊 **Dashboard** - Personal statistics and upload history
- 📚 **Translation Library** - Browse and search translations
- 📤 **Export** - Download in TEI-XML, JSON-LD, or CSV formats
- 🎨 **Modern UI** - Responsive design with dark mode support

### Technical Features
- ✅ **Type Safety** - Full TypeScript coverage
- 🔒 **Authentication** - Session-based auth with NextAuth.js
- 🗄️ **Database ORM** - Type-safe Prisma queries
- 🎯 **Form Validation** - Zod schemas with React Hook Form
- 📱 **Responsive** - Mobile-first Tailwind CSS design
- 🌐 **Proxy Support** - HTTP/HTTPS proxy for restricted networks
- 🔄 **Batch Processing** - Process multiple files in parallel
- 📊 **Progress Tracking** - Real-time processing progress
- 🎨 **Component Library** - Reusable shadcn/ui components
- 🌙 **Dark Mode** - System preference support

### AI Capabilities
- 🔍 **Multi-script OCR** - Oracle Bone, Bronze, Seal, Traditional Chinese, etc.
- 🧠 **Semantic Analysis** - Context-aware character interpretation
- 🔧 **Glyph Reconstruction** - AI-powered damaged character restoration
- 📖 **Translation** - Semantic translation with confidence scores
- 🎯 **Confidence Metrics** - Per-glyph and per-translation confidence
- 📝 **Metadata Tracking** - Provenance, imaging method, version control

## 🛠️ Development

### Environment Configuration

**Required Variables:**
```env
DATABASE_URL="file:./db/dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<generate-random-secret>"
```

**Optional AI Variables:**
```env
GOOGLE_GEMINI_API_KEY="your_api_key"  # Best accuracy
HUGGINGFACE_API_KEY="your_token"      # Alternative
ENABLE_OCR_FALLBACK="true"            # Dev mode fallback
```

**Optional Proxy Variables:**
```env
HTTP_PROXY="http://127.0.0.1:1080"
HTTPS_PROXY="http://127.0.0.1:1080"
```

### Development Scripts

```bash
# Development
npm run dev              # Start dev server with port fallback

# Building
npm run build            # Build for production (standalone)
npm start                # Start production server

# Code Quality
npm run lint             # Run ESLint

# Database
npm run db:push          # Push schema to database
npm run db:generate      # Generate Prisma Client
npm run db:migrate       # Create migration
npm run db:seed          # Seed database
npm run db:reset         # Reset database
```

### Development Workflow

1. **Feature Development:**
   - Create feature branch
   - Implement changes with TypeScript
   - Test locally with `npm run dev`
   - Run linting: `npm run lint`

2. **Database Changes:**
   - Modify `prisma/schema.prisma`
   - Run `npm run db:push` (development)
   - Or `npm run db:migrate` (production)
   - Update seed script if needed

3. **API Development:**
   - Add routes in `src/app/api/`
   - Use `getSession()` for authentication
   - Implement Zod validation
   - Return proper error codes

4. **Component Development:**
   - Use shadcn/ui components from `src/components/ui/`
   - Follow TypeScript best practices
   - Implement responsive design
   - Add proper accessibility

### Code Style

- **TypeScript**: Strict mode enabled
- **Formatting**: Prettier via Tailwind
- **Linting**: ESLint with Next.js config
- **Naming**: camelCase for variables, PascalCase for components
- **File Structure**: Feature-based organization

## 🚢 Deployment

### Production Build

```bash
# Build standalone application
npm run build

# Output: .next/standalone/
# Includes all dependencies and static files
```

### Deployment Options

#### Option 1: Standalone Server
```bash
NODE_ENV=production node .next/standalone/server.js
```

#### Option 2: Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY .next/standalone ./
COPY public ./public
COPY .next/static ./.next/static
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server.js"]
```

#### Option 3: Vercel
```bash
vercel deploy
```

### Environment Variables for Production

```env
# Database - Use PostgreSQL in production
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Authentication
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="<strong-secret-key>"

# AI Keys
GOOGLE_GEMINI_API_KEY="<your-key>"

# Proxies (if needed)
HTTP_PROXY="http://proxy:port"
HTTPS_PROXY="http://proxy:port"
```

### Production Checklist

- [ ] Set strong `NEXTAUTH_SECRET`
- [ ] Configure production database (PostgreSQL recommended)
- [ ] Add Google Gemini API key
- [ ] Enable HTTPS
- [ ] Configure CORS if needed
- [ ] Set up monitoring and logging
- [ ] Configure backups
- [ ] Test all authentication flows
- [ ] Test file upload limits
- [ ] Verify AI processing works

## 🎯 Supported Scripts

Rune-X is designed to support multiple ancient scripts:

- **Oracle Bone Script** (甲骨文) - Ancient Chinese inscriptions (1200-1050 BCE)
- **Bronze Script** (金文) - Bronze vessel inscriptions (1046-256 BCE)
- **Seal Script** (篆书) - Ancient Chinese seal script (221 BCE)
- **Traditional Chinese** - Classical Chinese texts
- **Classical Latin** - Ancient Roman inscriptions
- **Ancient Greek** - Classical Greek texts
- **Cuneiform** - Ancient Mesopotamian writing
- **Egyptian Hieroglyphs** - Ancient Egyptian writing systems

## 📖 Documentation

- [AI Setup Guide](./AI_SETUP.md) - Configure AI processing
- [AI Implementation Summary](./AI_IMPLEMENTATION_SUMMARY.md) - Technical details
- [Migration Guide](./MIGRATION_GUIDE.md) - Database migrations
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues

## 🤝 Contributing

This project is for ancient language decryption and cultural heritage preservation. Contributions are welcome:

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

**Areas for Contribution:**
- New script support
- Improved OCR accuracy
- Better reconstruction algorithms
- UI/UX improvements
- Documentation
- Bug fixes

## 📝 License

This project is part of the Rune-X initiative by Zhicong Technology for cultural heritage preservation.

## 🙏 Acknowledgments

- Built with Next.js and TypeScript
- UI components from shadcn/ui
- AI processing powered by Google Gemini
- OCR by Tesseract.js
- Database management by Prisma

---

**Rune-X** - Interpreting the past. Empowering the future. 🚀

**Version:** 0.1.0  
**Last Updated:** December 2024  
**Status:** Production-ready

For questions or support, please open an issue on the repository.
