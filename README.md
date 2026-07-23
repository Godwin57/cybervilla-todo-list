# CyberVilla Task Management Dashboard

A modern, responsive full-stack task management application built to handle dynamic state and secure database mutations. Developed as a technical assessment for CyberVilla Technologies.

🔗 **[View Live Deployment](https://your-vercel-link-here.vercel.app)**

## 🚀 Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS (with Dark/Light mode support)
- **Database:** PostgreSQL (Hosted on Supabase)
- **ORM:** Prisma v7 (Utilizing Supabase Connection Pooling & Serverless Adapters)
- **Architecture:** React Server Actions & Optimistic UI Updates

## ⚡ Features

- **Serverless Data Fetching:** Utilizes Next.js Server Actions to execute secure, direct-to-database mutations without building intermediate API routes.
- **Optimistic UI:** Implements React's `useOptimistic` hook for zero-latency visual feedback during network requests.
- **Connection Pooling:** Configured with Prisma v7 and Supabase's transaction connection pooler (IPv4 compatible) to guarantee database stability in serverless environments.
- **Responsive Design:** Pixel-perfect, mobile-first interface adhering to modern UI/UX principles.

## 🛠️ Local Development Setup

To run this application locally, you will need Node.js and a PostgreSQL database.

**1. Clone the repository**
\`\`\`bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
\`\`\`

**2. Install dependencies**
\`\`\`bash
npm install
\`\`\`

**3. Configure Environment Variables**
Rename `.env.example` to `.env` and add your database connection strings:
\`\`\`env
DATABASE_URL="postgres://[user]:[password]@[host]:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgres://[user]:[password]@[host]:5432/postgres"
\`\`\`

**4. Sync the Database**
Push the Prisma schema to your PostgreSQL instance:
\`\`\`bash
npx prisma db push
\`\`\`

**5. Start the Application**
\`\`\`bash
npm run dev
\`\`\`
