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
- **Prisma ORM + Database:** Type-safe database client with SQLite (dev) and PostgreSQL (prod)
- **Authentication Provider (Clerk):** Complete user management platform with pre-built UI components
- **Email Provider (Resend):** Developer-focused email API for transactional emails
- **File Storage (AWS S3):** File storage for team logos, profile pictures, etc.
- **UI and Frontend Libraries:** Tailwind CSS with component libraries (Radix UI/Shadcn)

## Project Structure

- `src/` – TanStack Start application
  - `routes/` – Page and API route components with file-based routing
  - `components/` – Reusable UI components
  - `utils/` – Utility functions and API wrappers
  - `server/` – Server-side logic (if separated)
- `prisma/` – Database schema and migrations
- `sst.config.ts` – SST configuration and AWS resource definitions
- `tickets/` – Implementation tickets organized by phase

## Local Development Setup

### Prerequisites

- Node.js (>=18) and npm
- AWS CLI configured (for deployment)

### Setup Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/quadball-platform.git
   cd quadball-platform
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure AWS credentials and region**
   ```bash
   aws configure sso
   ```
   Or include manual credentials in `~/.aws/credentials` file
   Either way, use profile soleil-dev

4. **Run the development server:**
   ```bash
   npx sst dev
   ```
   Access the app at http://localhost:3000

## Deployment

Deploying to AWS is done via SST:

1. **Configure AWS credentials and region**
2. **Deploy with SST:**
   ```bash
   npx sst deploy --stage dev
   ```

## Implementation Plan

The project is divided into six phases, each with specific goals:

1. **Foundation Setup & User Authentication** - Basic infrastructure and auth flows
2. **Member Profiles & Membership Management** - User profiles and membership purchases
3. **Team Management** - Team creation and roster management
4. **Event Management & Registration** - Event creation and registration
5. **Communication & Advanced Features** - Dashboards, notifications, and UI polish
6. **Multi-Organization & Scalability** - Support for multiple organizations

Detailed tickets for each phase are available in the `tickets/` directory.

## Getting Started with Development

To begin implementation:
1. Review the Phase 1 tickets in detail
2. Set up your development environment following the instructions above
3. Start with the "Set up TanStack Start app in SST" ticket

For more information on the implementation plan and architecture decisions, see the detailed tickets in the `tickets/` directory.

## Detailed Setup and Deployment Instructions

### Initial Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/soleilheaney/registration.git
   cd registration/registration-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure AWS credentials:**
   Follow the AWS SSO login instructions from the main README, or run:
   ```bash
   aws sso login --profile soleil-dev
   ```

### Local Development

1. **Start the SST development environment:**
   ```bash
   AWS_PROFILE=soleil-dev npx sst dev
   ```

2. **Access the application:**
   Once you see "Complete" in the SST output (usually within 10 seconds), open http://localhost:3000 in your browser

### Deployment

1. **Deploy to AWS development environment:**
   ```bash
   AWS_PROFILE=soleil-dev npx sst deploy --stage dev
   ```

2. **For production deployment:**
   ```bash
   AWS_PROFILE=soleil-production npx sst deploy --stage production
   ```
