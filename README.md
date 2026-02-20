# AI Dashboard

A Next.js dashboard for AI-powered document analysis.

## Features

- User Authentication (Login/Signup with Approval)
- Workspace Management
- Document Processing (PDF/YouTube)
- AI Analysis using Groq and Firecrawl

## Deployment on Vercel

To deploy this project on Vercel, follow these steps:

### 1. Database Setup
- Use a PostgreSQL database (e.g., [Neon](https://neon.tech/)).
- Copy your connection string.

### 2. Environment Variables
Configure the following environment variables in Vercel:
- `DATABASE_URL`: Your PostgreSQL connection string.
- `JWT_SECRET`: A secure random string for signing tokens.
- `GROQ_API_KEY`: Your Groq API key.
- `FIRECRAWL_API_KEY`: Your Firecrawl API key.

### 3. Build Configuration
Vercel should automatically detect the framework. If not, use:
- **Build Command**: `prisma generate && next build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 4. Prisma Initialization
Before the first build, make sure to push your schema to the production database by running:
```bash
npx prisma db push
```
(You can also add this to your build command if you want it to happen automatically: `prisma generate && prisma db push --accept-data-loss && next build`, but be careful with data loss).

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env.local` and fill in the values.
3. Generate Prisma client:
   ```bash
   npx prisma generate
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
