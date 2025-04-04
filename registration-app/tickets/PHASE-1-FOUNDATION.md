# Phase 1: Foundation Setup & User Authentication

## Ticket 1.1: Set up TanStack Start app in SST (deploy hello-world to AWS) ✅

**Description:**  
Initialize and configure the project scaffold with TanStack Start and SST deployment setup.

**Acceptance Criteria:**
- ✅ Create basic TanStack Start project structure
- ✅ Set up SST configuration in `sst.config.ts`
- ✅ Configure deployment settings for AWS
- ✅ Ensure app can be run locally with `sst dev`
- ✅ Verify deployment works with `sst deploy`
- ✅ Document setup and deployment process

**Technical Notes:**
- Follow SST's TanStack Start example configuration
- Set up proper environment variables and configuration
- Ensure AWS credentials are configured correctly
- Set region to `ca-central-1` (or preferred region)

**Priority:** High
**Estimated Effort:** 4-6 hours
**Completed:** April 4, 2025

---

## Ticket 1.2: Integrate Clerk and create auth routes ✅

**Description:**  
Add Clerk authentication system to the project and create necessary auth routes.

**Acceptance Criteria:**
- ✅ Set up Clerk account and get API keys
- ✅ Install and configure Clerk's React SDK
- ✅ Wrap app with `<ClerkProvider>`
- ✅ Create sign-in route at `/login` with Clerk's `<SignIn/>` component
- ✅ Create sign-up route at `/signup` with Clerk's `<SignUp/>` component
- ✅ Set up auth protection for authenticated routes
- ✅ Test authentication flow works (sign up, sign in, sign out)

**Technical Notes:**
- ✅ Use Clerk's development mode initially
- ✅ Configure Clerk with allowed redirect URLs
- ✅ Leverage TanStack Router for protected routes (using `_protected` route)
- ✅ Consider adding social login options if desired

**Priority:** High
**Estimated Effort:** 6-8 hours
**Completed:** April 4, 2025

---

## Ticket 1.3: Set up database and Prisma (User model)

**Description:**  
Configure Prisma ORM and establish the initial database schema with the User model.

**Acceptance Criteria:**
- Set up Prisma with appropriate database connection
- Define initial `schema.prisma` with User model
- Establish link between User model and Clerk user ID
- Run initial migration to create database tables
- Create utility for Prisma client instantiation
- Test database connection from Lambda environment

**Technical Notes:**
- The User model should include Clerk userId as primary key or foreign key
- Include basic fields like name, email (can be redundant with Clerk)
- Consider how User model will link to Member model in Phase 2
- Ensure database connection works in both local and deployed environments

**Priority:** High
**Estimated Effort:** 3-5 hours

---

## Ticket 1.4: Establish admin role check

**Description:**  
Implement a mechanism to designate and verify admin users in the system.

**Acceptance Criteria:**
- Add role field to User model (enum: ADMIN/PLAYER) or use Clerk metadata
- Create a mechanism to set admin status (either in DB or Clerk metadata)
- Write utility function to check if current user is admin
- Implement middleware or guard for admin routes
- Test that non-admin users cannot access admin routes

**Technical Notes:**
- For initial implementation, consider hardcoding admin emails in env var
- Or designate first registered user as admin manually
- Create protected route layout for admin routes (e.g., `/admin/_layout.tsx`)
- If using Clerk metadata, update the JWT token with admin role

**Priority:** High
**Estimated Effort:** 3-4 hours

---

## Ticket 1.5: Create basic pages (home, dashboard, admin) and protect admin route

**Description:**  
Build the initial UI pages and implement navigation and route protection.

**Acceptance Criteria:**
- Create public home page with welcome text and login/signup links
- Implement authenticated dashboard page showing user info
- Create admin-only page with basic user listing from database
- Set up navigation bar with conditional links based on auth status
- Implement logout functionality
- Ensure admin route is properly protected

**Technical Notes:**
- Use TanStack Router for route definitions
- Group authenticated routes under `_authed` folder
- Use Clerk's `<SignedIn>` and `<SignedOut>` for conditional rendering
- Include Clerk's `<UserButton/>` for profile/avatar in navbar
- Test different auth scenarios (unauthenticated, authenticated non-admin, admin)

**Priority:** Medium
**Estimated Effort:** 6-8 hours

---

## Ticket 1.6: Deploy and test Phase 1 features in cloud

**Description:**  
Deploy the Phase 1 implementation to a development environment and verify functionality.

**Acceptance Criteria:**
- Deploy app to dev environment with `sst deploy --stage dev`
- Verify Clerk auth works on deployed domain
- Test user sign-up and login flows
- Confirm admin route protection works
- Document any issues or adjustments needed
- Share access with stakeholders for feedback

**Technical Notes:**
- Configure Clerk's allowed domains for the deployed URL
- Check that database connection works in cloud environment
- Verify AWS Lambda permissions are correct
- Test cold start performance

**Priority:** Medium
**Estimated Effort:** 2-3 hours
