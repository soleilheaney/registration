# Quadball Canada Registration & Events Platform

## Overview and Purpose

The Quadball Canada Registration & Events Platform is a web application designed to streamline sports league management – initially serving **Quadball Canada** (the national quadball governing body) and eventually adaptable to other sports organizations. The platform enables athletes, team leaders, and administrators to handle all essential activities in one place.

**Key Features:**

- **Member Registration & Management:** User accounts, profiles, waivers, and annual memberships
- **Team Setup & Roster Management:** Team creation, player invitations, and roster management
- **Event Creation & Registration:** Tournament/league management with team/individual registration
- **Payments & Finance:** Integration with Stripe for membership and event fees
- **Role-Based Access Control:** Admin, Team Lead, and Player permission layers
- **Communication & Notifications:** Email confirmations and announcements
- **Future Extensibility:** Multi-organization, multi-sport capability

## Tech Stack and Architecture

- **TanStack Start (React framework):** Type-safe React framework with file-based routing and SSR
- **AWS Lambda via SST (Serverless Stack):** Serverless deployment with infrastructure as code
- **Drizzle ORM + PostgreSQL:** Type-safe database client with PostgreSQL
- **Authentication (Better Auth):** Complete user management with OAuth providers
- **Email Provider (Resend):** Developer-focused email API for transactional emails
- **File Storage (AWS S3):** File storage for team logos, profile pictures, etc.
- **UI and Frontend Libraries:** Tailwind CSS with shadcn/ui components

## Project Structure

- `src/` – TanStack Start application
  - `routes/` – Page and API route components with file-based routing
  - `lib/components/` – Reusable UI components
  - `lib/server/` – Server-side logic and database schema
  - `lib/middleware/` – Auth guards and middleware
  - `lib/styles/` – Application styles
- `drizzle/` – Database schema migrations
- `sst.config.ts` – SST configuration and AWS resource definitions

## Local Development Setup

### Prerequisites

- Node.js (>=18) and pnpm/npm
- PostgreSQL 17 (for local development)
- AWS CLI configured (for deployment)

### Setup Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/soleilheaney/registration.git
   cd registration/solstice
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Set up PostgreSQL database:**
   ```bash
   # Install PostgreSQL (if not already installed)
   brew install postgresql@17
   
   # Start PostgreSQL service
   brew services start postgresql@17
   
   # Create database user and set password
   createuser -s postgres
   psql -c "ALTER USER postgres WITH PASSWORD 'postgres';" postgres
   
   # Create the application database
   createdb -U postgres solstice
   ```

4. **Configure AWS credentials and region**
   ```bash
   aws configure sso
   ```
   Or include manual credentials in `~/.aws/credentials` file
   Either way, use profile soleil-dev

5. **Push database schema:**
   ```bash
   pnpm db push
   ```

6. **Run the development server:**
   ```bash
   AWS_PROFILE=soleil-dev npx sst dev
   ```
   Access the app at http://localhost:3000

## Deployment

Deploying to AWS is done via SST:

1. **Configure AWS credentials and region**
2. **Deploy with SST:**
   ```bash
   AWS_PROFILE=soleil-dev npx sst deploy --stage dev
   ```
   For production:
   ```bash
   AWS_PROFILE=soleil-production npx sst deploy --stage production
   ```

## Implementation Plan

The project is divided into six phases, each with specific goals:

1. **Foundation Setup & User Authentication** - Basic infrastructure and auth flows
2. **Member Profiles & Membership Management** - User profiles and membership purchases
3. **Team Management** - Team creation and roster management
4. **Event Management & Registration** - Event creation and registration
5. **Communication & Advanced Features** - Dashboards, notifications, and UI polish
6. **Multi-Organization & Scalability** - Support for multiple organizations

## Issue Watchlist

Always check for breaking changes and updates to TanStack Router:
- https://github.com/TanStack/router/discussions/2863

## Auth

Better Auth is currently configured for OAuth with GitHub, Google, and Discord, but can be easily modified to use other providers.

## Utilities

- [`auth-guard.ts`](./src/lib/middleware/auth-guard.ts) - Middleware for forcing authentication on server functions.
- [`ThemeToggle.tsx`](./src/lib/components/ThemeToggle.tsx) - Toggle between light and dark mode.