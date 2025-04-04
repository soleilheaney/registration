Perfect. I'll create a detailed README and implementation plan tailored to your current tech stack—SST, React (TanStack Start), Prisma, AWS Lambda—with clear reasoning behind architectural decisions like file structure, auth provider, email service, and database design. I'll break the work into chunk-sized tickets and highlight where changes might be advised as the project scales.

I'll get back to you shortly with the full plan.

# Quadball Canada Registration & Events Platform

## Overview and Purpose

The Quadball Canada Registration & Events Platform is a web application designed to streamline sports league management – initially serving **Quadball Canada** (the national quadball governing body) and eventually adaptable to other sports organizations. The platform enables athletes, team leaders, and administrators to handle all essential activities in one place. Core capabilities include member sign-ups (with annual memberships), team creation and roster management, event scheduling and registration (tournaments, leagues, etc.), payment processing for dues/fees, and role-based admin tools. By centralizing these functions, the platform reduces paperwork and manual coordination, improving the experience for everyone from national administrators to individual players.

**Key Features:**

- **Member Registration & Management:** Athletes can create user accounts, complete their member profiles, sign waivers, and purchase annual memberships. Member data (contact info, emergency contacts, etc.) is stored securely for admin reference. Only active (paid) members are eligible to join teams or events.
- **Team Setup & Roster Management:** Players can form teams or join existing teams. Team leaders (captains/coaches) can invite members to their roster, approve join requests, and manage team information (team name, region, etc.). The system ensures that only valid members can be added to rosters.
- **Event Creation & Registration:** Administrators can create events (tournaments, regional meets, etc.) with details like date, location, divisions, and fees. Teams or individuals can register for events through the platform. The system tracks registrations, enforces requirements (e.g. only teams with sufficient members can register), and collects any entry fees.
- **Payments & Finance:** Integration with a payment processor (e.g. **Stripe**) to collect membership dues and event registration fees online. Payment records tie back to user or team accounts for easy tracking. (Initial versions may support basic payments; advanced features like refunds or installment plans can be added later.)
- **Role-Based Access Control:** Secure permission layers for different roles – **Admins** (organization staff) can manage all data, create events, and view reports; **Team Leads** manage their team roster and event sign-ups; **Players** can view and update their own profile, join teams, and register for events. This ensures users see and do only what their role permits.
- **Communication & Notifications:** The platform will send timely email notifications for key actions – confirmations of membership or event registration, team invitations, and announcements. Admins can contact members or teams through the system (e.g. an email blast to event participants).
- **Future Extensibility:** While built for Quadball Canada’s needs, the architecture will support adding multiple sports organizations with minimal changes. For example, it will be possible to onboard a new sport federation (with its own admins, teams, events) without rebuilding the core system – ensuring a **multi-organization, multi-sport** future.

## Tech Stack and Architecture

This project uses a modern **TypeScript** codebase with a **React** front-end and a serverless back-end. The chosen stack emphasizes developer productivity, scalability, and ease of maintenance, given our small team and the requirement to run on AWS. The major components are:

- **TanStack Start (React framework):** This is a full-stack React framework powered by TanStack Router, offering intuitive file-based routing, server-side rendering (SSR), and integrated server functions. TanStack Start provides a type-safe, client-first development experience while still supporting SSR and even streaming responses ([TanStack Start](https://tanstack.com/start#:~:text=SSR%2C%20Streaming%20and%20Server%20RPCs)). We chose TanStack Start over alternatives like Next.js or Remix to leverage its strong typing and flexibility. It allows deploying the app “anywhere JS can run,” including serverless environments ([TanStack Start](https://tanstack.com/start#:~:text=Deploy%20Anywhere)). In practice, we use TanStack Start to handle both the UI and our API endpoints (via server functions or API route handlers) within one unified project.
- **AWS Lambda via SST (Serverless Stack):** The application is deployed on AWS using **SST (Serverless Stack)**, which manages our infrastructure as code and deploys our TanStack Start app to AWS Lambda. AWS Lambda gives us a scalable, pay-per-use backend – ideal for a sports site that might see bursts of activity around events and minimal load at other times. Serverless architecture means we don’t maintain servers; it automatically scales and is cost-efficient for intermittent workloads ([Build a full-stack serverless app with SST - LogRocket Blog](https://blog.logrocket.com/build-full-stack-serverless-app-sst/#:~:text=Serverless%20computing%20has%20revolutionized%20the,highly%20scalable%20and%20reliable%20applications)). SST in particular simplifies development and deployment: it provisions all necessary AWS resources and lets us develop locally with a live Lambda environment, so we can focus on writing code without manual AWS config ([Build a full-stack serverless app with SST - LogRocket Blog](https://blog.logrocket.com/build-full-stack-serverless-app-sst/#:~:text=One%20of%20the%20key%20benefits,reduces%20the%20chance%20of%20errors)). Using SST, the TanStack Start app is wrapped as an SST `TanstackStart` site, which handles building and deploying the React SSR app to AWS Lambda and Amazon CloudFront. This setup provides out-of-the-box support for custom domains, AWS credential management, and easy integration with other AWS services (S3 buckets, etc.) via SST ([TanstackStart | SST](https://sst.dev/docs/component/aws/tanstack-start#:~:text=Link%20resources%20to%20your%20TanStack,access%20it%20in%20your%20app)) ([TanstackStart | SST](https://sst.dev/docs/component/aws/tanstack-start#:~:text=const%20bucket%20%3D%20new%20sst.aws.Bucket%28)).
- **Prisma ORM + Database:** We use **Prisma** as our Object-Relational Mapper to interact with the database. Prisma provides a **type-safe** database client for Node.js/TypeScript, meaning our database queries are verified at compile time against the schema. This greatly reduces runtime errors and boosts developer confidence and productivity ([TypeScript & Prisma | TypeScript ORM for SQL Databases](https://www.prisma.io/typescript#:~:text=Prisma%20is%20an%20ORM%20for,to%20interact%20with%20your%20database)). The Prisma schema (defined in `prisma/schema.prisma`) serves as a single source of truth for our data model – tables like Users, Teams, Events, etc. – and Prisma Migrate will manage schema migrations in a controlled way. For the database itself, during development we can start with SQLite (for simplicity), and in production we plan to use a relational database like **PostgreSQL** (likely hosted on AWS RDS or Aurora Serverless). Prisma supports all common SQL databases, so switching from SQLite to Postgres is straightforward ([Should you use Prisma ORM as a Node.js/TypeScript ORM? | Prisma Documentation](https://www.prisma.io/docs/orm/overview/introduction/should-you-use-prisma#:~:text=This%20is%20the%20main%20use,these%20application%20and%20deployment%20models)). The database strategy is to use a single logically shared database for all organizations (multi-tenant with organization IDs scoping the data), rather than one database per org, to keep things simple and allow cross-org analytics if needed. Sensitive data (like passwords) isn’t stored in our DB because we delegate authentication to an external provider (see below).
- **Authentication Provider (Clerk):** For user authentication and management, we integrate **Clerk**. Clerk is a developer-friendly platform that provides pre-built UI components for sign up, sign in, profile management, and robust APIs for session management and security ([Clerk | Authentication and User Management](https://clerk.com/#:~:text=The%20most%20comprehensive%20User%20Management,Platform)). We chose Clerk to avoid reinventing auth – it supports email/password login, social logins, passwordless options, and handles multi-factor auth and session security out of the box. Clerk’s React library will let us embed <Signin/> and <Signup/> forms seamlessly into the app. It also includes an admin dashboard for user accounts, which is useful for troubleshooting. Clerk’s emphasis on a **complete user management platform** means we get features like user profile data, avatars, and even organization management. For this project, we will use Clerk to manage users and rely on its JWT-based authentication to secure our API routes. Role information (admin, team lead, player) can be stored in Clerk’s user metadata or within our database for checking permissions. (Clerk does offer an out-of-the-box “Organizations” feature with roles ([Next.js: Implement basic Role Based Access Control (RBAC) with metadata](https://clerk.com/docs/references/nextjs/basic-rbac#:~:text=To%20control%20which%20users%20can,roles%20as%20part%20of%20the)), which might be leveraged in the future to model multi-organization support. Initially, we might implement a simpler custom role check using user metadata or a roles table, as the app’s roles are domain-specific.)
- **Email Provider (Resend):** Email communications (such as confirmation emails, password resets, team invitations, etc.) are handled via **Resend**, a transactional email service. Resend is a highly developer-focused email API – it’s designed for easy integration with straightforward REST/SDKs and ensures high deliverability (avoiding spam folders) ([Resend: Email for developers | Y Combinator](https://www.ycombinator.com/companies/resend#:~:text=Email%20for%20developers)). We selected Resend for its simplicity and “it just works” ethos; developers can trigger emails with a few lines of code and trust that they will be sent reliably. Using Resend’s Node.js SDK and API key (stored securely in our environment), the app can send templated emails for various workflows. For example, when a user registers for an event, the backend will call Resend’s API to email a registration confirmation. Resend also provides useful features like test mode, analytics, and an intuitive dashboard for email logs, which will help us verify that emails are delivered successfully during testing ([Resend · Email for developers · Resend](https://resend.com/#:~:text=Resend%20is%20an%20email%20platform,Resend%20helps%20avoid%20spam%20folders)). In the future, we could integrate advanced email features (scheduling, batch emails) since Resend supports those as well ([Email API · Start sending today · Resend](https://resend.com/features/email-api#:~:text=Do%20more%20with%20your%20emails,trigger%20batch%20emails%20with%20ease)) ([Email API · Start sending today · Resend](https://resend.com/features/email-api#:~:text=Send%20emails%20at%20a%20specific,time%20without%20additional%20complexity)).
- **File Storage (AWS S3):** Any uploaded files (such as team logos, event images, or document attachments) will be stored in **Amazon S3** via SST. SST makes it easy to define an S3 Bucket in our infrastructure code and link it to the TanStack Start app ([TanstackStart | SST](https://sst.dev/docs/component/aws/tanstack-start#:~:text=sst)). We’ll use S3 for its durability and scalability – for example, if we allow players to upload a profile picture or if we need to store signed waiver PDFs, these will reside in S3. The app will store only the S3 object keys in the database. Access control policies on the bucket (configured via SST) will ensure that only our app (and authorized users) can read/write the files. In the future, to serve images/documents efficiently, we can use CloudFront CDN in front of S3 if needed (SST can configure that too). For now, a private bucket with pre-signed URLs for download/upload will suffice for security.
- **UI and Frontend Libraries:** On the frontend, we use **Tailwind CSS** for styling to allow rapid design iteration using utility classes (the TanStack Start example integrates Tailwind by default). Tailwind will help maintain consistent styling without writing a lot of custom CSS, which is ideal given our team’s limited design resources. We are also considering using a component kit such as **Radix UI** (possibly via the Shadcn UI library) or Material UI for pre-built accessible components. This will let us assemble forms, modals, navigation menus, etc., without building everything from scratch, which accelerates development for our novice front-end contributor. The overall frontend is a single-page app enhanced with React’s capabilities, but thanks to SSR via TanStack Start, users will still get fast initial page loads and good SEO. We will heavily use **TanStack Router** for routing (already baked into Start) and likely **TanStack Query** for data fetching and caching on the client side, to handle server state like fetching event lists or team rosters.

**Project Structure:**

The codebase follows a monorepo-style **single repository** containing both the frontend code and infrastructure definitions. This is facilitated by SST, which uses AWS CDK under the hood to define resources in code, and by TanStack Start’s full-stack framework which blurs the line between front and back end. Key parts of the repository structure include:

- `app/` or `src/` (TanStack Start application):
  - `src/routes/` – Contains the page and API route components. TanStack Start uses file-based routing; for example, `src/routes/index.tsx` might be the home page, `src/routes/events/index.tsx` the events list page, etc. Special files like `__root.tsx` define layout for the app, and subfolders (e.g. an `_authed/` folder) can group routes that require authentication. We will define protected routes for dashboards that only certain roles can access (e.g. `src/routes/admin/__root.tsx` for an admin layout). The route files can define server-side code via TanStack’s server functions, which run on the server (Lambda) to handle form submissions, etc.
  - `src/components/` – Reusable UI components (forms, buttons, nav bars, etc.) that are used across pages.
  - `src/utils/` – Utility functions, e.g. formatting dates, helper functions to call external APIs (like Resend or Stripe), and perhaps wrappers for server functions.
  - `src/server/` – (If using a custom server directory) Code related to backend logic like route handlers, though TanStack may not separate this explicitly; it might all live alongside routes. Alternatively, we might keep Prisma client initialization and any domain-specific logic here.
  - Entry points: `src/ssr.tsx` (for server-side rendering bootstrap), `src/client.tsx` (client-side hydration bootstrap), `src/router.tsx` (TanStack Router configuration), and generated files like `routeTree.gen.ts` (which TanStack Router might generate for type-safe routes).
- `prisma/` – Contains `schema.prisma` (defining the database schema and models for members, teams, events, etc.) and migration files. Also, a Prisma client is generated here which we import in our server code to query the DB.
- `sst.config.ts` – The SST configuration file defining our stack. Here we instantiate an `sst.Stack` that likely includes a `new sst.aws.TanstackStart(...)` to deploy the web app, plus other resources: e.g. `new sst.aws.Auth(...)` if we were using AWS Cognito (not in our case), or `new sst.aws.Bucket(...)` for file storage, etc. This file is the entry to provisioning AWS resources and hooking them up. It also sets the default AWS region, stage, and any required permissions (for example, allowing our Lambda functions to access the database or S3).
- Other configs: standard files like `package.json` (with scripts for dev and deploy, e.g. `sst dev`, `sst deploy`), TypeScript config, ESLint config, etc., and environment files. We will use a `.env` file (or SST Secrets) to store sensitive config like database URL, Clerk API keys, Stripe secret keys, Resend API key, etc. SST can load these into Lambda environment variables in production.

**Monorepo vs Multi-repo:** We decided to keep a single repository (monorepo) for this project, containing both the frontend application and backend infrastructure code. This approach offers easier code sharing (for example, sharing TypeScript types between front-end and back-end logic, or reusing validation schemas) and simplifies coordination between team members. With SST managing both the React app and AWS resources, a monorepo allows us to deploy everything together with one command. It also reduces complexity for our non-technical contributor – they can pull one repo and have all the code needed to run the app locally. In the future, if the project grows to include additional distinct services (for example, a separate mobile app or a separate marketing website), we can still house them in a monorepo as separate packages. But for now, one repo with clear structure is the most straightforward. We acknowledge alternatives (like separating the front-end into its own repo and the back-end infra into another) but given our small team and the integrated nature of TanStack Start, the benefits of a monorepo outweigh the overhead of managing multiple repositories.

**Architectural Decisions and Trade-offs:**

Every tech choice was made considering the team’s strengths and the project requirements:

- Using **serverless (Lambda)** via **SST** was chosen over a traditional Node server or container-based deployment because it minimizes DevOps work (no need to maintain an EC2 or Kubernetes cluster) and automatically scales per request. This suits the usage pattern of a sports site (mostly idle, with occasional heavy use during registration periods) – we only pay for what we use. The trade-off is that cold starts could introduce slight latency, but AWS’s provisioned concurrency or SST’s support for warming Lambdas can mitigate this if needed. Also, SST’s local dev proxy means we can develop as if it were a normal server, which eases the learning curve.
- We chose **Prisma ORM** for database access to leverage type safety and faster development. As a data engineer, the developer is comfortable with SQL, but writing raw SQL or using a lower-level ORM would be more time-consuming and error-prone. Prisma’s migrations and schema definition keep the data model synchronized with code, which is useful as the schema evolves (e.g., adding new entities for events or payments). A possible downside is that Prisma adds an abstraction layer and has a learning curve, but its documentation and community support are excellent. Performance-wise, for our scale (hundreds or thousands of users, not millions), Prisma’s query performance is more than sufficient; direct SQL micro-optimizations are not a priority at this stage. We’ll monitor and ensure that we don’t run into connection pooling issues on Lambda – using something like the Data API for Aurora or setting `connection_limit` properly if needed.
- For **authentication**, outsourcing to Clerk was a conscious decision to save development time and enhance security. The alternative, AWS Cognito or building a custom auth system, would have been far more complex to implement and maintain (and Cognito’s developer experience is notoriously difficult for small teams). Clerk provides a polished user experience (with embeddable components for sign-in, etc.) and handles tricky parts like email verification, password resets, and multi-factor auth. It also easily integrates with our React app (they even have an example of Clerk + TanStack Start, indicating good compatibility). The trade-off is vendor lock-in and cost (Clerk has pricing after a certain user count), but for an early-stage project with a sponsor organization, the cost is justified by the faster development. Clerk also will allow our collaborator to focus on building features rather than dealing with OAuth flows or hashing passwords.
- Implementing **RBAC (role-based access control)** will require either using Clerk’s built-in roles/organization features or rolling a simple solution. We decided to keep roles flexible in our database so that we’re not limited by Clerk’s structure. Each user in our system will have an associated role (or multiple roles) that we store in a `roles` field or a separate table (e.g. a user could be `Player` in general, and have a relation to a `Team` as a `TeamLead`, and a flag if they are also an `Admin`). In practice, we might use Clerk’s **public metadata** to store roles on the JWT token for quick checks in the front-end and back-end ([Next.js: Implement basic Role Based Access Control (RBAC) with metadata](https://clerk.com/docs/references/nextjs/basic-rbac#:~:text=To%20build%20a%20basic%20RBAC,a%20network%20request%20each%20time)). This way, when a user logs in, their token tells us their role, and we can conditionally render admin pages or protect API routes. The justification for this approach is to ensure **security** (no privilege escalation) and to make it easy to extend roles (e.g., adding a “Coach” or “Referee” role later). We will be careful to test these permissions thoroughly. The team leads and admin roles will be assigned manually for now (e.g., first admin user can assign others, or we seed the initial admin in the database). Clerk’s organization feature could allow an admin to invite other admins or manage roles through Clerk’s UI in the future, but that might be explored down the line when multi-org support is implemented.
- **Stripe for payments** is chosen (though not explicitly mandated in the brief, it’s an industry standard). Stripe offers a straightforward way to handle one-time payments (like membership fees or event fees) and has a great API and dashboard. We plan to use Stripe Checkout or Stripe Elements to handle credit card input securely (so the card data never touches our servers). The platform will record Stripe payment IDs in the database to correlate payments with memberships or registrations. The trade-off here is that we must implement webhook handling to confirm payment success (again using a serverless function via TanStack Start or SST). We’ll likely include a webhook route that Stripe can call, which then updates the relevant records (e.g. marks a membership as paid). The alternative could have been PayPal or direct bank transfers, but Stripe’s developer experience and user experience are superior. We may need to ensure that the production deployment has the proper domain and HTTPS for Stripe webhooks to reach it.
- **Extensibility for multiple organizations** influenced our data modeling from the start. We introduced an `Organization` model in the schema to represent the sports body (e.g., Quadball Canada). All other main entities (members, teams, events) have a relation to an Organization. For now, we will only have one organization (QC), but by designing the schema this way, adding another (e.g., “Quadball USA” or even a different sport like “Frogball Federation”) would be possible by just seeding a new org record. The application logic will then scope data queries by organization as appropriate. We considered tenancy isolation – whether each organization’s data should live in a separate schema or database – but decided that a unified schema with org IDs is simpler and sufficient. If down the road an organization needs separate subdomain and branding, we can implement routing logic (like org slug in the URL) or even deploy separate instances of the app per org if necessary. But ideally, one deployment can serve multiple orgs by checking the org context of each user (possibly using Clerk organizations to have separate sign-in realms if needed). This design is a bit more complex upfront (ensuring every query filters by org), but it **prevents costly re-engineering later** when expanding to new groups.

Finally, given that one developer has stronger backend skills and the other is just learning frontend, the architecture deliberately leans on technologies that simplify frontend work (Clerk’s pre-built UI, Tailwind for styling, perhaps a component library). It also leverages AI coding assistance (e.g. GitHub Copilot, Cursor, Claude) for boilerplate to help us move faster. We acknowledge that TanStack Start is a relatively new framework (beta status), which is a trade-off: we get cutting-edge features and type-safety, but documentation might be evolving. We mitigate this risk by actively referring to TanStack’s examples (they even have an example integrating Clerk and one for Prisma) and being ready to contribute fixes if we encounter issues. The decision to use a newer framework was made for the long-term benefits of type-safe routing and full-stack integration, which we believe will pay off in maintainability as the project grows.

## Local Development Setup

Setting up the project for local development is straightforward. You will need **Node.js (>=18)** and **npm** installed. We also recommend having the AWS CLI configured with your credentials, because SST uses your AWS config for deploying (though you won’t need to deploy just to run locally).

**1. Clone the repository:**

```bash
git clone https://github.com/your-org/quadball-platform.git
cd quadball-platform
```

**2. Install dependencies:**

```bash
npm install
```

This will install both the application dependencies and SST itself.

**3. Set up environment variables:**

Create a `.env` file in the project root (there is likely an `.env.example` to follow). At minimum, you need to provide:
- **Database URL**: e.g. `DATABASE_URL="postgresql://user:pass@localhost:5432/quadball"` (for local dev you might use a local Postgres or SQLite. If using SQLite, your `DATABASE_URL` would look like `file:./dev.db` and Prisma will create a `dev.db` file).
- **Clerk API keys**: Clerk provides a **Publishable Key** (for frontend) and a **Secret Key**. In development, you can use Clerk’s development instance or test keys. Set `CLERK_PUBLISHABLE_KEY=` and `CLERK_SECRET_KEY=` accordingly.
- **Resend API key**: After signing up for Resend, get your API key and set `RESEND_API_KEY=`.
- **Stripe keys** (if payments are implemented in dev): `STRIPE_PUBLIC_KEY=` and `STRIPE_SECRET_KEY=`, and possibly a `STRIPE_WEBHOOK_SECRET=` for verifying webhooks.
- Other config like `SESSION_SECRET` (if TanStack Start requires a session signing key for server functions), and any feature flags.

For any third-party services (Clerk, Resend, Stripe), you may need to configure allowed callback URLs or domains in their dashboards. For development, you’ll likely run on `http://localhost:3000`, so make sure to add that in Clerk’s allowed origins.

**4. Initialize the database (dev environment):**

If using SQLite, this step is simple – Prisma will create the file on migration. If using Postgres locally, ensure the database is running and the URL is correct. Run Prisma migrations to create the schema:

```bash
npx prisma migrate dev --name init
```

This will apply the initial database schema (creating tables for users, teams, etc.) to your dev DB. You can also use `npx prisma studio` to open Prisma Studio, a web UI to inspect the DB, which is handy for verifying data or manually creating records (like an admin user).

**5. Run the development server:**

We use SST’s dev server which in turn runs TanStack Start in development mode. Start it with:

```bash
npm run dev
# which internally might run: npx sst dev
```

On first run, SST will ask for a stage name (you can just enter `dev` or your name). It might also do an initial deploy of stub resources to AWS (setting up some CloudFormation stacks). However, for everyday development, `sst dev` will **not** do a full deploy – instead, it runs the app locally. The console will show logs both from SST and the app. Once it’s ready, you should see output indicating the local server is running, typically at **http://localhost:3000** (SST will proxy to the TanStack dev server).

Open your browser to `http://localhost:3000`. You should see the application’s homepage or login screen. From here, you can navigate through the app. When you make code changes, SST will live-reload or restart the necessary functions automatically. For front-end changes, Vite’s hot module replacement should update the browser without full reload.

**6. Using Clerk in dev:** When testing authentication flows locally, Clerk will show a default sign-in/sign-up UI if configured correctly with your dev origin. Users you create will show up in the Clerk dashboard. Alternatively, Clerk allows an "Development Instance" mode where you don’t even need to have an internet connection – you can create users directly in the app for testing. Refer to Clerk’s docs for running in development – but typically, as long as your Clerk Publishable Key is set, the <SignIn/> component will render a working form.

**7. Testing emails in dev:** Since we don’t want to send real emails during development, you have a few options:
   - Use Resend’s **Test Mode** (Resend allows sending emails to a special address or using a flag so that emails are not actually delivered).
   - Or use a dummy SMTP service or an ethereal email account. For simplicity, you might skip actually sending emails until you can test in a staging environment. But if needed, Resend’s dashboard can show logs of emails even if they are not delivered.
   - We will likely implement a toggle in our config (like `ENABLE_EMAILS`) that we can turn off to prevent accidentally spamming when testing.

**8. Running Prisma and other tools:** If you need to generate Prisma client after changing the schema, run `npx prisma generate`. SST’s workflow might do that automatically on deploy, but during dev, you’ll manually do it. Also, ensure you have `tsc --noEmit` or similar in the dev script if you want TypeScript type-checking continuously (TanStack Start and Vite handle a lot, but it’s good to ensure types are checked).

By following these steps, you should have the app running locally. The local stack will use local resources (local DB, etc.) and won’t affect production.

## Deployment (Production)

Deploying to AWS is done via SST, which uses CloudFormation under the hood to create AWS resources. Before deploying, ensure you have AWS credentials configured (e.g., in `~/.aws/credentials` or environment variables `AWS_ACCESS_KEY_ID`, etc.) and that your AWS account has permission to create the necessary resources (Lambda, API Gateway or CloudFront, S3, etc.).

**1. AWS Infrastructure Setup:** Define your target region (e.g., `us-west-2` or if Quadball Canada prefers Canadian servers, `ca-central-1` for Montreal). In `sst.config.ts`, set the region and perhaps a custom domain if you have one. For example, if the site will be hosted at **quadball.ca**, configure the SST TanstackStart with `domain: "app.quadball.ca"` (and set up DNS accordingly). If no custom domain initially, SST will output a default CloudFront URL for your app.

**2. Production Database:** Set up a production database instance. For instance, create an AWS RDS Postgres database or use a service like PlanetScale for MySQL. Take note of the connection string. In AWS, you might use Secrets Manager to store the DB credentials and configure the Lambda to access the secret. However, since our app is deployed via SST, the simplest method is to set environment variables in the SST config. For example, in `sst.config.ts`, you can do:

```ts
new sst.Secret(this, "DB_CONNECTION", {
  value: process.env.DATABASE_URL // ensure this is set locally when deploying
});
new sst.aws.TanstackStart("WebApp", {
  environment: {
    DATABASE_URL: sst.Secret.from("DB_CONNECTION"),
    CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY,
    CLERK_SECRET_KEY: sst.Secret.from("CLERK_SECRET"), 
    // ... etc for other secrets
  },
  // other config like domain
});
```

(The above is conceptual – actual syntax might differ, but SST allows injecting env vars and referencing secrets securely). Make sure to also run `prisma migrate deploy` as part of your deployment process (SST can run build commands – perhaps we add a post-deployment step or include migration in the lambda startup, though ideally migration is a separate step run via CLI).

**3. Deploy via SST:** Run the command:

```bash
npx sst deploy --stage prod --region ca-central-1
```

This will build the application (production optimized build) and upload it to AWS. SST will create a CloudFormation stack that typically includes:
   - An AWS Lambda function for server-side rendering and API routes.
   - Amazon CloudFront distribution (if using SST’s default for TanStackStart) to serve the app with global edge caching. CloudFront will invoke Lambda@Edge or Lambda in region for SSR.
   - An S3 bucket for storing static assets (the build outputs, if any static files).
   - Any other linked resources (e.g., the S3 bucket we defined for file uploads, DynamoDB or others if we had).
   - If domain is configured, an ACM certificate for TLS and DNS records (this may require you to own the domain and possibly use Route53 or provide a DNS validation).

Monitor the deployment logs; SST will indicate the endpoint URL when done. For example, it might say: “Deployed site to https://abcd1234.cloudfront.net” or your custom domain.

**4. Post-deployment steps:** After the first deployment, you might need to do some one-time setup:
   - Set up Clerk’s allowed redirect URLs to include your production domain.
   - Set up Stripe webhooks to point to your domain’s webhook endpoint (if implementing payments).
   - Possibly seed the database with initial data: e.g., create the Quadball Canada organization entry, and create an initial admin user (you can do this via a temporary script or via Prisma Studio connecting to prod DB). Alternatively, use Clerk’s invite or an admin signup link to get your account in and then use a database query to mark it as admin.
   - Verify that the Lambdas have access to the database. If using RDS inside a VPC, your Lambda will need to be in that VPC with proper security group. SST can attach the Lambda to a VPC if configured. Ensure the connection string is correct and reachable (we might opt for a managed cloud DB with a public URL for simplicity, which is easier for Lambda to connect).
   - Test the production site: try signing up a new user, ensure emails send (for real, not just test mode), create a test team, etc. Monitor CloudWatch logs via SST or AWS console for any errors.

**5. Ongoing Deployment:** For subsequent updates, the same `sst deploy` command (with the appropriate stage) will push incremental changes. Thanks to infrastructure as code, changes to resources (like adding a new bucket or environment variable) are tracked and applied. We will use Git for version control, so each feature or fix can be merged and then deployed. We might also set up CI/CD in the future to deploy on push to main branch. SST integrates well with GitHub Actions.

**6. Monitoring & Logging:** The production environment will rely on AWS’s monitoring. CloudWatch Logs will capture our Lambda logs (which include our app’s console logs). We should implement some basic logging in critical parts of the code (e.g., log when a payment webhook is received or when an unauthorized access is attempted, etc.). For error tracking, we may integrate a tool like **Sentry** or use SST’s built-in error notifications. Since the team will likely actively monitor initial launch, manual checking of logs is okay, but long-term, setting up alerts for failed payments or high error rates would be wise.

**7. Scaling and Maintenance:** The app will automatically scale by virtue of being serverless – AWS will run more Lambdas in parallel if needed. The database is a fixed size, so if the user base grows significantly, we might need to scale the DB instance (RDS) or move to a more scalable option like Aurora Serverless or a cluster. Prisma and the rest of the stack should handle thousands of users easily, but we will keep an eye on performance (e.g., use indexes in the DB, optimize any N+1 query patterns, etc.). We’ll also use caching where appropriate – TanStack Query will cache API calls on the client, and we might use a CDN for images. SST and CloudFront ensure that static assets (JS bundles, etc.) are cached globally.

In summary, deploying and running the app in production is made simpler by SST, which ties together our React app and AWS resources. We intentionally chose technologies that require minimal manual server admin, so we can focus on features and rely on managed services for the heavy lifting (auth, email, payments, etc.). The result will be a robust platform for Quadball Canada that can scale in functionality (as we add more features) and scope (onboarding more organizations), with a maintainable codebase that a small team can handle.

---

# Phased Implementation Plan

To tackle the project in an organized way, we will break development into **phases**. Each phase delivers a set of features or improvements, roughly in order of priority. Within each phase, the work is divided into manageable **tickets** (tasks) that can be implemented and tested, ideally in the span of a day or two each. This phased approach helps focus on the most critical functionality first (e.g., getting members and teams in place before events), and also provides clear milestones for progress.

Given our team composition (a backend-heavy developer and a novice frontend contributor), the plan is structured so that early phases build the core backend and data model, while later phases (or parallel tasks) can focus on refining the UI/UX. We will also leverage the strengths of each team member: the experienced dev can set up complex infrastructure and data logic, whereas the newer dev can pick up isolated frontend tasks (like creating a form or page layout) with guidance and AI assistance. Each phase includes **justification** for the choices and notes on tools or best practices applied.

### Phase 1: Foundation Setup & User Authentication

**Goal:** Establish the project scaffold, core infrastructure, and user authentication flow. By the end of this phase, we have a deployed skeleton application where users can sign up, log in, and see a basic dashboard page, and an admin can log in with elevated permissions. This sets the stage for building domain-specific features in subsequent phases.

- **Project Scaffolding & Stack Configuration:** Initialize a new TanStack Start React project and integrate it with SST. This involves setting up the repository with the TanStack Start file structure (`src/routes`, etc.) and writing the `sst.config.ts` to deploy the app. Ticket: *Set up TanStack Start app in SST (deploy hello-world to AWS)*. We’ll verify that we can run `sst dev` and see the starter page locally, and `sst deploy` to a test environment. Justification: Doing this first ensures our dev and deployment pipeline works from day one, catching any config issues early. Using SST’s minimal example ([TanstackStart | SST](https://sst.dev/docs/component/aws/tanstack-start#:~:text=Deploy%20a%20TanStack%20Start%20app,that%E2%80%99s%20in%20the%20project%20root)), we link our app and confirm AWS integration.
- **Choose and Configure Auth System (Clerk):** Add Clerk to the project. This includes signing up for a Clerk account, obtaining dev and prod API keys, and installing Clerk’s React SDK. We will create a Clerk application (with social login if desired) named for Quadball Canada. In code, wrap our app with Clerk’s <ClerkProvider> and add <SignIn /> and <SignUp /> components on the appropriate routes. Ticket: *Integrate Clerk and create auth routes*. For TanStack Start, we might create routes like `/signin` and `/signup` that render those components, and protect other routes using Clerk’s `SignedIn` component or by checking session in server functions. Justification: Authentication is fundamental – doing it early allows the rest of the app to assume a logged-in user context. Clerk was chosen to save time and provide a secure, tested auth solution (avoiding pitfalls of custom auth) ([Clerk | Authentication and User Management](https://clerk.com/#:~:text=The%20most%20comprehensive%20User%20Management,Platform)).
- **Basic User Model & Prisma Setup:** Define the initial database schema with Prisma. The first version of `schema.prisma` will have a **User** model at least. Even though Clerk manages most user fields, we might still keep a User table to link to domain info (or we use Clerk user ID as primary key in our Member table – see next phase). For now, create a simple User table with an `id` (string, matching Clerk’s user ID) and maybe name/email fields (though redundancy with Clerk, but could help with queries). Run the migration to create the table. Ticket: *Set up database and Prisma (User model)*. Also, write a small script or use Prisma Studio to create a test admin user entry if needed (or we mark someone as admin via metadata later). Justification: We need a place to attach domain-specific data. Even if Clerk holds authentication, Prisma gives us a structured DB for everything else. This also tests our database connection from the Lambda environment early.
- **Role Management Basics:** Implement a strategy for differentiating admin users. E.g., extend the User model with a `role` field (enum: ADMIN/PLAYER) or a boolean `isAdmin`. Alternatively, use Clerk’s **roles/metadata**: for instance, set a Clerk user metadata like `{ role: 'admin' }` for the initial admin. For the first pass, we can hardcode a list of admin emails in an env var (not ideal long-term, but quick start) or designate the first registered user as admin manually. Ticket: *Establish admin role check*. This involves writing a middleware or a simple utility that checks the current user’s role before allowing access to admin routes. In TanStack Start, we might create an `admin/_layout.tsx` route that on load, verifies Clerk.user.role === 'admin' and redirects if not. Justification: We want to lock down admin capabilities from the start so we don’t accidentally expose management features. Using a role flag is straightforward and will later be expanded to include team leads.
- **Initial Pages & Navigation:** Build a minimal UI to test the above: 
  - A public home page (`routes/index.tsx`) with basic welcome text and a call-to-action to log in or sign up.
  - Auth pages for sign-in/up (as integrated above).
  - An “Authenticated Landing” page – e.g. `routes/dashboard.tsx` that shows once logged in (Clerk provides a <UserButton/> to show user profile/avatar, which we can include in a navbar). For now, the dashboard can just say “Hello [Name], your role is X”.
  - An admin-only page (`routes/admin/index.tsx`) which is protected. It could simply list all users from the database as a test (calling Prisma to fetch User records). This will test end-to-end: a Clerk-authenticated session hitting a TanStack server function to query the DB. Ticket: *Create basic pages (home, dashboard, admin) and protect admin route*. We’ll use TanStack Router’s features to define these routes, possibly grouping under an `_authed` folder as in the Clerk example ([React TanStack Start Start Clerk Basic Example | TanStack Start Docs](https://tanstack.com/start/latest/docs/framework/react/examples/start-clerk-basic#:~:text=)).
  - Set up navigation: e.g., if a user is signed in and an admin, show a link to “Admin Panel”; if signed in and not admin, maybe no admin link. A simple top navigation bar that changes whether user is logged in (Clerk <SignedIn> vs <SignedOut> components).
  - Ensure logout functionality works (Clerk <SignOutButton/> or similar).
  
  Justification: These pages form the scaffold of the app. We keep them very simple initially (no fancy styling, just text and a couple of links) because the priority is making sure the plumbing (auth, routing, db) works. This also gives our non-tech collaborator a starting point to see the app structure and maybe try styling the pages later.

- **Deployment of Phase 1:** Once the above is working locally, deploy to a dev environment (maybe a separate `dev` stage in SST). This will put the app on the internet behind auth, which we can then share with stakeholders for early feedback. We will test that a user can sign up (maybe with a test email), login, and that our admin route is indeed secure (try logging in as non-admin and hitting `/admin` to ensure it redirects or denies). Also test that the Clerk integration works on the deployed domain (may need to configure that domain in Clerk settings). Ticket: *Deploy and test Phase 1 features in cloud*.

**Phase 1 Justification:** Laying this foundation early means later phases can focus on business logic (membership, teams, etc.) without worrying about “can we log in” or “how do we deploy”. We also validate our tech stack choice right away – if any part is problematic (for example, if TanStack Start had an incompatibility with Clerk or Prisma), we discover it now, not deep into development. By having authentication in place, all subsequent features (which require logged-in users) can be built and tested properly. Additionally, the collaborator can start learning the codebase structure from these simple pages and experiment with making small changes (like tweaking the dashboard text or adding a CSS style) to get comfortable.

### Phase 2: Member Profiles & Membership Management

**Goal:** Implement the core models and flows for membership: capturing member details, enforcing annual membership status, and (optionally in this phase) integrating payments for membership fees. By the end of Phase 2, users will be able to enter or update their profile information and purchase a membership, and admins can view a list of all members.

- **Member Profile Model:** Extend the database schema to include a **Member (Profile)** model. Depending on how we integrated Clerk, we have two options:
  1. Make the Member model essentially our “User” domain model, with a 1-1 relation to Clerk user (e.g., Member has Clerk `userId` as primary key or foreign key). It contains fields like full name, birthdate, contact info, address, etc., as required by Quadball Canada.
  2. Or expand the existing User table with these profile fields. 
   
  We’ll likely go with a separate `Member` model linked to `User` for clarity. Also, create a model for **MembershipPurchase** or **MembershipStatus** to track if the member has paid for the current season. A simple approach is to give Member a field `membershipValidUntil: Date` or a boolean `isActiveMember` plus maybe `membershipYear`. However, a more normalized approach: a Membership record with fields (memberId, season/year, purchaseDate, paymentId, etc.). For Phase 2, we can simplify and just have `isActiveMember` and update it when paid, but keep in mind multi-season support if needed. Ticket: *Prisma schema update – Member and Membership*.
  
  Run `prisma migrate dev` to update the dev DB. Ensure relationship between Member and User (if separate) is set (e.g., one-to-one).
  
- **Member Profile UI:** Create a page for users to fill in their profile details. For example, `routes/dashboard/profile.tsx` which shows a form (name, DOB, etc.). Use React form handling (could integrate TanStack Form or just use useState for simplicity). On submit, call a TanStack Start server action or API route to save the data to the DB via Prisma. Ticket: *Implement profile form (frontend)* and *Profile update route (backend)*. The server action will likely need the user’s ID (which we get from Clerk’s session) to identify which Member to update. Make sure to protect this route so users can only edit their own profile (we can enforce by using the session userId in the query).
  
  Initially, this profile form can be basic. We’ll include validation for required fields (maybe client-side and server-side). This is a good task where the new developer can work on the form UI and validation, using AI to help with form libraries or accessible markup.
  
- **Membership Purchase Flow (Stripe Integration):** Quadball Canada likely requires players to pay an annual fee. We’ll integrate **Stripe Checkout** for this. Create a backend route (server function) to initiate checkout: for example, `POST /api/create-checkout-session`. It will accept the current user’s ID (from session) and perhaps the membership type (if there are categories, but assume one standard fee). It calls Stripe’s SDK to create a checkout session with line item “Quadball Canada Membership 2025” for X dollars. Stripe will return a URL for the hosted checkout page. The server function then redirects the user to that URL (or the front-end gets the URL and uses `window.location`). Ticket: *Integrate Stripe Checkout for membership*.
  
  On successful payment, we need to handle the callback. The simplest way: use Stripe’s built-in success URL to a page (e.g., `/membership/success`) that the user sees, and use webhooks to do the backend update. Implement a Stripe webhook handler route (e.g., an API route at `/api/stripe-webhook`) that listens for `checkout.session.completed` events. Upon receiving, verify the event (using Stripe’s signature and the webhook secret), then mark the member as active (update Member.isActiveMember = true, set membershipValidUntil to next year). Ticket: *Implement Stripe webhook and membership activation*.
  
  We may skip some complexity (like handling if they already paid for this year, etc., in Phase 2; just allow one payment and mark active). Also, ensure to test webhook locally using the Stripe CLI, and configure the webhook in Stripe dashboard for prod.
  
  If payment integration is too time-consuming for Phase 2, we could defer it and instead allow admins to manually mark members as paid (or trust members for now). But since payment is a key part, better to include now if possible.
  
- **Membership Status Display:** On the user’s dashboard, show their membership status. E.g., “Membership: Active until [date]” or “Not a member – [Buy now]”. The [Buy now] button starts the Stripe checkout. After returning from checkout (success page), update UI accordingly. Also, possibly disable certain features (like joining a team) if not an active member – but team join comes in next phase, so just plan to enforce later.
  
- **Admin Members Management:** Create an admin page to view all members. Ticket: *Admin view member list*. This page (e.g., `routes/admin/members.tsx`) will query the database for all Member records (optionally filter by active/inactive) and display them in a table. Show key info: name, email (pull from Clerk or store in Member), membership status, team (fill in later when teams exist). This gives admins a quick way to see who has paid. Also, possibly allow admin to edit or activate memberships (e.g., comp a membership). Initially, just read-only list.
  
  This task will involve writing a server query with Prisma to get all members. If many, we might paginate, but likely manageable size. It’s an opportunity for the backend dev to ensure the queries are correct, and for the frontend dev to practice rendering a table, maybe using a library for tables or just HTML table.
  
- **Email Confirmation:** Using Resend, send a welcome email or membership confirmation. For example, after a user signs up (Clerk has their own email verification, but we can also send a custom welcome from our side), or after payment, send a receipt/confirmation email. Ticket: *Send email on membership purchase*. This will involve writing a function triggered in the Stripe webhook handler: use Resend’s SDK to send an email to the user’s email (we have it via Clerk). The email template can be simple (“Hi [Name], thanks for purchasing your Quadball Canada membership...”). We can use a plain text email for now, or integrate a tool like React Email or MJML for nicer formatting. Resend makes it easy to send either raw HTML or using their React Email integration.
  
  We’ll test this in dev by configuring Resend’s test mode or using a personal email. It’s important to ensure our Resend API key is loaded and the network call works from Lambda.

**Justification:** Phase 2 focuses on **members**, the central user entity. Without members, we can’t have teams or events. By implementing profile management and membership payment early, we tackle any complexity around external integration (Stripe, Resend) upfront. It also delivers value – theoretically, after Phase 2, the platform could already function to register members and collect fees, which is a big part of any sports org’s needs.

We integrate Stripe now to avoid accumulating “tech debt” on the payment side; handling money is critical and it’s better to iron out those flows with test users before real launch. By having admin oversight on membership, we prepare for real usage where an admin might need to pull a list of paid members. The use of Resend here demonstrates our notification system on a small scale; in later phases we’ll extend emails to other actions.

From a team perspective, this phase has a mix of front-end (forms, pages), backend (Stripe integration, database work), and external config. Work can be divided such that the experienced dev handles the Stripe and Prisma parts, while the junior dev works on the profile form UI and maybe the admin table (with guidance). Both will pair on ensuring the data flows are correct. We also start getting into validation and user experience (ensuring required profile fields are filled, etc.), which sets the tone for quality going forward.

By the end of Phase 2, we can demonstrate user sign-up, profile completion, and membership purchase, which is a substantial milestone.

### Phase 3: Team Management

**Goal:** Enable the creation and management of teams by users (team leads), and allow players to join teams. This phase introduces another major entity (Team) and the relationships between members and teams, including assigning the team lead role. After this phase, the system will support club/team organization which is necessary before implementing events.

- **Team Model & Relationships:** Update the Prisma schema to add a **Team** model. Include fields like `name`, `organizationId` (to support multi-org), maybe `city/region`, and a unique code or slug. Establish relations: A Team can have many Members. This is a many-to-many (a member could technically be on multiple teams, though in sports usually one primary team per season; but consider coaches or multi-team players for generality). We’ll use a join table, e.g., `TeamMembership` with memberId, teamId, and a role field (PLAYER or LEAD). Alternatively, since we have distinct roles, we might store team leads separately: perhaps Team has a `captainId` field referencing Member, and also a TeamMembership table for all players. To keep it flexible (someone could be an assistant captain), a join table with role makes sense. Ticket: *Schema update – Team and TeamMembership*. Migrate the database.
  
  Also consider: team belongs to an Organization (we include orgId from the start for future-proofing). For now, all teams will have Quadball Canada’s org id.
  
- **Create Team Flow:** Logged-in users should be able to create a new team. Provide a UI on the dashboard like “Create a Team”. This leads to a form asking for team name (and maybe other info like location). On submit, call a server action to create the Team record and a TeamMembership entry linking the user as a LEAD (or mark them as captain). The user now effectively becomes a team lead. Ticket: *Team creation page*. This involves front-end form and back-end logic.
  
  After creating, redirect the user to the team page.
  
- **Team Page & Roster Management:** Create a page for each team where the team lead can manage the roster. For example, `routes/teams/[teamId].tsx` which shows team info and a list of members on the team. Only team members (especially the lead) should access this page – enforce via server check that the current user is part of the team. On this page:
  - Show team details (name, etc., and maybe an edit option for the lead to change team info).
  - List of players on the team. For each player, show name and maybe membership status (the lead might need to know if a player hasn’t paid membership).
  - Provide controls for the team lead: e.g., a button to “Invite Player” and a button to remove a player.
  
  Ticket: *Team roster page with list management*. The invite can work as follows:
    - When “Invite Player” is clicked, prompt for an email address. The server then sends an invite email via Resend to that address containing a link. The link could be a special URL like `/join-team?code=XYZ` or a magic link with token. Simpler: we create an invite record in the DB (or just generate a token containing teamId and maybe expiration, store it in a separate Invite table).
    - The email to the invited user includes the team name and a call-to-action to join. If the recipient already has an account, they click and, after login, we add them to the team. If they don’t, the link can direct them to sign up (we might append a Clerk sign-up with redirect to accept invite).
    - This invite system can get complex; as an MVP, we might skip implementing invite tokens in Phase 3 and do something simpler: e.g., instruct team leads to tell players to sign up and search the team name to request join. So alternative approach:
    
  - **Join Team Request:** Allow a member to request to join a team. We can have a public page listing teams (or at least a way to find a team by code or name). For MVP, maybe not a search (since limited number of teams, leads can directly add players by email if known). But if skipping invites, we do:
    - A member can go to a “Teams” page that lists all teams (or just a “join by code” if we implement team code).
    - The member clicks “Join” on a team, which creates a TeamMembership with status “PENDING” or something.
    - The team lead, on their roster page, sees pending requests and can approve/deny.
  
  This is a more workflow-heavy approach. It might be easier to do the invite because that puts control in the lead’s hands to add people.
  
  Given time, Phase 3 could implement a basic invite: the lead enters an email, and if that email is already registered in Clerk, we immediately add that user to the team (and send a notification “You’ve been added to Team X”). If not registered, we send an invite email telling them to sign up and join.
  
  Perhaps an easier mechanism: If the team lead knows the person’s email, just add them (TeamMembership entry) and mark as pending until they accept. But acceptance requires login...
  
  To not overcomplicate: We might restrict Phase 3 to **Team creation** and **Lead adding players by email** (with assumption that leads will only add those who gave consent).
  We will note to refine invites in future.
  
  Another ticket: *Remove player from team*. Implement a button for lead to remove a player (deletes TeamMembership). Also, allow leaving team: a player can remove themselves (except maybe not if they are the sole lead, we need at least one lead).
  
- **Team List & Browsing:** For admin, provide a page listing all teams (like `admin/teams`). Similar to members list. Shows team names, number of players, maybe region. Ticket: *Admin view teams*. Admin can click a team to see details (could reuse the Team page view but with admin privileges to edit anything if needed).
  
  For players, a page to find teams to join might not be needed if invites are used. But if no invite implemented, we need a way for players to join. Possibly we allow public team pages where if not a member, there's a “request to join” button.
  
  Considering timeline, maybe implement a simple version: team leads manage roster by adding/removing for now. We can skip building a public team directory in Phase 3. If a player has no team, they rely on their lead to add them or give them an invite link.
  
- **Enforce Membership for Teams:** Ensure only active members can join or be added to a team. In the server logic for adding a player, check `member.isActiveMember`. If not, return error (or add but mark as pending until they pay). We might decide that you simply cannot be added until membership is paid – this will encourage players to pay. Communicate this on the UI (if a lead tries to add a member who exists but is not active, show “This player hasn’t paid membership yet”). If the email is not found in system, we still allow invite, but mention they’ll need to pay on signup.
  
- **Email Notifications for Teams:** Use Resend to notify:
  - If a player was added to a team (send them an email: “You have been added to Team X. If this was unexpected, contact support.”).
  - If an invite is sent, obviously the invite email itself.
  - If using join requests, send email to team lead when someone requests to join.
  
  These can be added as small tickets like *Email on team invite* and *Email on team join confirmation*. For MVP, at least implement the invite email if doing invites.
  
**Justification:** Teams are the backbone of events in a team sport. This phase is a bit complex due to the invite/join logic – it's the first time we have to handle complex interactions between users in the system. By doing it in Phase 3, we already have a stable user/membership base (Phases 1-2) to build on. 

We use straightforward data models (Team, TeamMembership) to allow flexibility (multiple leads, future support for multi-team players). The trade-off is added complexity in code to manage invites and permissions. We mitigate that by tackling one scenario at a time: initially focusing on the case where a team lead invites existing members or adds by email, and deferring a full-fledged “team discovery” feature.

From a development standpoint, Phase 3 will see more collaboration between front and back logic. There’s opportunity for the newer dev to create UI for listing team members and the invite modal, while the experienced dev handles the tricky parts like ensuring the database transactions (creating team + setting lead, or adding a member) are done correctly and securely.

We’ll be careful with permissions: e.g., any API route that adds/removes team members will verify that the requester is either an admin or the team’s lead. This likely means writing a helper to check user’s role on a given team. Possibly caching the user’s roles (Clerk’s token might hold if they are a team lead if we put that in metadata, but that might not scale well for multiple teams). Instead, just query the DB to see if there’s a TeamMembership making them lead.

Completing Phase 3 means we can manage teams and have rosters of players, which leads naturally into Phase 4 to tie teams to events.

### Phase 4: Event Management and Registration

**Goal:** Introduce events (tournaments, etc.) and allow teams (or individuals) to register for them. Provide admin tools to create events and manage registrations. By end of this phase, the platform can facilitate an end-to-end flow: an admin sets up an event, teams sign up for it, and we can list participants.

- **Event Model:** Add an **Event** model to the Prisma schema. Key fields: name, description, date (maybe start and end dates), location (could be simple string for now), type (team event vs individual event), max teams or participants, registration deadline, and possibly a fee. Also an `organizationId` to scope it. We may also add a `eventType` enum (e.g., “Tournament”, “League”, “Scrimmage”) if needed. For registrations, create either:
  - A join model `EventRegistration` (teamId, eventId, plus maybe status and payment info).
  - Or separate if individuals can register: if event is individual type, link memberId; if team type, link teamId. We can use one table with nullable teamId or memberId, or use two tables. Simpler: one `EventRegistration` with columns: eventId, teamId, memberId, and we enforce that either teamId or memberId is set depending on event.isTeamBased.
  
  Migration: *Add Event and EventRegistration schema*. Possibly also a field in Event for price/fee (and currency).
  
- **Admin Creates Event:** Build a form/page for admins to create new events. `routes/admin/events/new.tsx` – fields for all the event info. On submit, create the Event record in DB. If fee > 0, also maybe create a product in Stripe or plan to use a Stripe Checkout flow similar to membership. But we can leave payment integration for event registration to a later sub-step. Ticket: *Event creation form (admin)*.
  
  Once created, redirect to event detail page (admin view). Admin event detail can show an empty list of registrations initially, and maybe a link or code to share for teams to register.
  
- **List Events (Public):** Everyone (logged in users) should be able to see a list of upcoming events. Create `routes/events/index.tsx` which fetches all events (or all upcoming events) from DB and displays them. Show key details and whether registration is open or closed. If user is eligible to register, show a Register button. Eligibility depends on event type:
  - If event is team-based: user must be a team lead of a team, and that team not yet registered, and team has enough players maybe.
  - If individual: user simply must be an active member and not already registered.
  
  Ticket: *Events listing page & eligibility logic*.
  
- **Team Event Registration:** For a team event, the team lead will click “Register” on an event. This brings up a form or prompt to select which team (if the user leads multiple teams – rare, but possible e.g., a coach for two teams). Likely the user will only have one team. On submission, create an EventRegistration linking the team and event. Mark status as PENDING or CONFIRMED depending on payment. If there’s a fee for the event, redirect to Stripe checkout similar to membership. Possibly use a simpler approach: let them register and mark as unpaid, and have an option to pay later or invoice. But ideally, require payment upfront via Stripe.
  
  So integrate Stripe for event fees: This can reuse some code – just different product description. We might consider using Stripe Products for events, but simplest is on-the-fly Checkout sessions. Ticket: *Team event registration & payment*.
  
  After registering, send a confirmation email to the team lead (and maybe all players or just the lead) via Resend: “Your team [X] has registered for [Event]. We received your payment of $Y. We’ll be in touch with details.”
  
  Update the event detail page to show the team as registered (for admin and possibly for others).
  
- **Individual Event Registration:** If the event is marked as individual (for example, a fantasy tournament where players sign up solo or a volunteer signup), then any active member can register themselves. The flow: on clicking register, maybe ask a few questions (or just confirm), then create EventRegistration with memberId. If a fee, handle Stripe payment by the member. Confirmation email to the member.
  
  We might implement this if needed; if Quadball events are always team-based, it could be lower priority. But building it with the same table is not much extra.
  
- **Event Details and Participants List:** Create an Event page (for each event) showing details. For an admin or team leads of participating teams, show more info:
  - Admin view: on their event page, list all registered teams/players, with contact info, payment status, etc. Possibly allow exporting the list (CSV download). Ticket: *Admin event participants list*.
  - Team lead view: on event page, if their team is registered, show maybe a “your team is registered” and any additional info (like a link to roster check).
  - General view: maybe list teams attending (if not sensitive), so players know who’s going.
  
  If we have pending approvals (some events might not auto-confirm teams until admin approves, e.g., limited slots or competitive selection), we could incorporate a status field. But perhaps out of scope unless needed.
  
- **Closing Registration & Admin Actions:** Provide admin the ability to close registrations (maybe by setting a deadline field, which the UI respects). Also allow admin to mark a registration as paid if offline payment (if someone didn’t use Stripe). Possibly allow admin to add a team to an event manually (for edge cases). These are smaller tickets that can be done if needed: *Admin override registration*.
  
- **Notifications:** 
  - Email notifications to admins when a new team registers (so they know to review).
  - Email reminders to team leads before event (this could be Phase 5 if scheduling emails).
  
  At least implement: *Email confirmation to team lead on successful registration* (if fee paid).
  
**Justification:** Phase 4 delivers the marquee functionality: event management. This is typically the most complex part because it ties together members, teams, payments, and involves more business rules (like eligibility). By having done membership and teams first, we now use those pieces here. 

The phased approach ensures that by the time we implement events, we have confidence in our auth, database, and payment integrations, because Stripe and others were already exercised with memberships. We are basically repeating known patterns (creating a Stripe checkout, writing a webhook for confirmation) in a new context.

We prioritize team-based event registration because Quadball is primarily a team sport. Individual events are secondary, but we account for them in the data model to avoid rework if one comes up (for example, a referee clinic where individuals register).

From a code architecture perspective, events add another layer of conditionals and permissions:
- Only admins can create events – enforced via route protection.
- Only eligible users can register – enforced via checks and disabling UI appropriately.
- This will require some dynamic UI states, which the frontend dev can implement (e.g., if not eligible, show a tooltip “must be team lead of a team to register”).
- We’ll likely implement a helper to determine `canRegister(user, event): boolean` that encapsulates those rules (active membership, role, etc.).

We also further utilize our third-party services: Resend for notifications (ensuring we keep stakeholders informed via email) and Stripe for collecting event fees if any. By now, we have multiple webhook types (membership and events), so we might generalize some of that code or at least ensure they don’t conflict.

Completing Phase 4 means the platform is functionally ready for a typical season: register members, form teams, sign up teams for a tournament. The remaining phases will refine and extend these capabilities.

### Phase 5: Communication & Advanced Features

**Goal:** Add auxiliary features that improve user experience and admin control, and ensure the platform is production-ready. This includes advanced communication tools (news announcements, bulk emails), refining the role-based controls, and any other quality-of-life improvements (like better UI, validation, and monitoring).

- **Role-Based Dashboards & UX:** Now that we have multiple roles and features, refine the navigation and experience for each role:
  - **Admin Dashboard:** Create a central admin dashboard page that highlights key data: number of active members, upcoming events, recent registrations, perhaps some quick actions (create event, view payments). This could be mostly informational with cards showing stats. Ticket: *Admin dashboard page*. This provides a one-stop for admins after login, rather than navigating through lists.
  - **Team Lead Dashboard:** When a team lead logs in, their dashboard (the same as user dashboard but with conditional content) should show their team(s) and any pending actions (e.g., “Complete your roster for upcoming event” or “5 players have not paid membership”). We can add these hints by querying relevant data. Ticket: *Team lead dashboard enhancements*.
  - **Player Dashboard:** If a regular player (not lead, not admin) logs in, show maybe upcoming events they are in or suggested events, and their team info if they are on one. Otherwise, prompt “you are not on a team, contact your captain or join a team” (maybe by listing teams if available).
  
  These improvements ensure each type of user sees what they need most prominently.
  
- **Bulk Email/Announcement System:** Provide a way for admins to send an email to many users (for announcements like “Event registration deadline approaching” or newsletters). We can implement a simple form where admin selects target audience (all members, or all team leads, or all participants of a specific event) and writes a message. On submit, the system uses Resend to send out emails to that list. We must be careful with large lists – Resend can handle it, but doing them sequentially might be slow. We might use Resend’s batch API (if available) or simply loop with a slight delay. Given likely a few hundred recipients at most, it’s fine. Ticket: *Admin bulk email tool*.
  
  This could be a page `admin/announce.tsx` with fields for subject and message, and checkboxes for recipients scope. This feature helps non-technical admins avoid needing a separate Mailchimp; everything can be done in-app.
  
- **In-App Notifications (Optional):** If time permits, add a notification center in the app – e.g., a bell icon that shows recent notifications like “Your event registration was approved” or “Team invite from X”. This is a nice-to-have since we have emails. Possibly skip if email suffices.
  
- **File Uploads:** If there is a need for file upload (like uploading a team logo or member profile picture), implement this now. Use the S3 bucket integrated via SST:
  - For example, allow a team lead to upload a team logo on the team page. Use a file input, and on upload, get a pre-signed URL from an API route, then PUT the file to S3. Save the file URL or key in the Team model (add a field `logoUrl`).
  - Or allow members to upload a profile image.
  
  Ticket: *Implement file upload for team logos*. Test that it goes to S3 and the app can retrieve it (maybe show the image in the team page). This showcases the file storage part of our stack.
  
- **Security & Compliance Checks:** Do a pass to ensure we are not exposing data inadvertently:
  - All API routes should verify the user’s identity and authorization. For example, ensure a player cannot call the team-remove API for a team they’re not in. We might write unit tests for critical permission functions.
  - Ensure sensitive fields (like payment info) are not sent to client. We never store card data, but maybe store last4 of card from Stripe if needed for reference.
  - If we have any personal data, ensure our privacy measures: e.g., passwords are not stored (Clerk handles that), and consider encrypting any sensitive info if needed (maybe not needed for standard profile data).
  - Make sure .env secrets are not exposed. (TanStack Start server functions should not leak env to client).
  
  Ticket: *Security review and testing*.
  
- **Performance & Monitoring:** Install monitoring tools if desired. For example, consider adding **Sentry** for error tracking (they have a serverless SDK). Or use AWS CloudWatch alarms for high error rates. Also consider adding a logging library for structured logs. This might be overkill for initial launch but worth noting.
  
  Also optimize performance: use Prisma include/select to avoid over-querying, ensure indexes on important fields (like membership by user, team memberships by teamId).
  
- **UI/UX Polish:** At this stage, spend time improving the UI and fixing any rough edges:
  - Apply consistent styling with Tailwind. Possibly introduce a UI library for any components that we struggled with (modal, dropdowns, etc.).
  - Make the app mobile-friendly (responsive design) as users will likely use phones at events.
  - Ensure forms have proper validation messages, loading states when operations are in progress (disable buttons to prevent double submits).
  - Possibly add pagination or search on admin tables if data is large (like a search bar to find a member by name).
  - Content tweaks: clarify instructions on pages, e.g., on membership page “Complete your membership by paying the annual fee. You must do this before joining a team.”
  
  Ticket: *UI polish sweep* (could be broken into multiple small UI tasks).
  
  This is a good place for the collaborator to take the lead, as these are mostly front-end improvements. Using AI tools, they can implement style changes or add libraries like Headless UI for nicer selects, etc. The experienced dev can review and ensure no new issues are introduced.
  
- **Documentation & Handover:** Write documentation for the system beyond the README:
  - Admin guide: a short document for Quadball Canada admins on how to use the system (creating events, pulling reports, etc.).
  - Developer guide: comments in code or a wiki for how things are structured, so future contributors (or the collaborator as they learn more) understand the architecture. Although the README covers a lot, some internal docs about code style, how to run tests, how to add a new model, etc., can be useful.
  - Set up a backup strategy for the database (even if just manual snapshots initially).
  
  Ticket: *Write admin usage guide*.
  
**Justification:** Phase 5 is about rounding out the platform for real-world use and maintainability. We address communication because keeping members informed is crucial (and email is still the primary channel for official comms). We also take this time to implement any smaller features that were deferred from earlier phases due to time, ensuring no critical gap remains.

Polishing the UI/UX in this phase acknowledges that earlier phases we were fine to have basic, even ugly, pages as long as functionality worked. Now, before launch, we refine the interface so that users find it friendly and professional. This also is where the collaborator’s contributions are most felt, as they can focus on the user-facing aspects with less worry about backend complexities.

By implementing file uploads and any other sport-specific needs (maybe a field for jersey number, or medical info if needed), we ensure the platform isn’t missing something obvious that the organization would need.

Security and performance considerations in this phase mean we don’t launch with glaring vulnerabilities or reliability issues. Given the sensitive personal data and payments involved, a review is justified. Using established providers (Clerk, Stripe) covers a lot of security (passwords, PCI compliance), but we double-check our parts.

At the end of Phase 5, the platform should be ready for a beta launch with Quadball Canada. We will have completed all essential user flows and added convenience features for communication and management. 

### Phase 6: Multi-Organization & Scalability (Future Plan)

**Goal:** Adapt the platform to support multiple organizations or sports without major changes, and outline steps for scaling to a broader user base. (This phase might not be immediately implemented for Quadball Canada launch, but is planned to avoid painting ourselves into a corner.)

- **Organization Abstraction:** If not already in schema, add an **Organization** model. Since we did include `organizationId` in key models, now fully implement it:
  - Populate the Organization table with Quadball Canada as an entry. In the future, other orgs can be added here.
  - Add an admin interface to manage organizations (likely only super-admins can use this, if at all).
  - Ensure all queries throughout the app filter by the current user’s organization. Currently, since only one org, this might have been implicit. But to support multi-org, we might need a way to identify which org’s data to show. If using Clerk Organizations: Clerk could handle org context for users (user can switch org in the UI provided by Clerk). If not, we might derive org from the user’s membership or a subdomain.
  - The simplest for now: each user has an `organizationId` field (maybe each member already did). So, when an admin logs in, we know their org and limit data to that.
  - Ticket: *Multi-org data scoping*: Go through routes (members, teams, events queries) and add `where organizationId = user.orgId`.
  
- **Org-specific Settings:** Each organization might have its own settings: membership fee amount, season dates, custom waiver text, etc. We can add some fields in Organization for these, and then use them in the UI (e.g., display the correct fee). This is prep for scaling to different org needs.
  
- **Custom Domain per Org:** If one day another org uses the platform, they might want their branding. SST and Clerk Org could allow `something.sportsapp.com/orgname` or even custom domain. We document how we would achieve this (perhaps using dynamic routing or deploying separate frontends with different env configurations). Not a ticket to implement now, but a plan.
  
- **Performance Scaling:** If the user base grows (say multiple organizations each with hundreds of users), we should ensure the system scales:
  - The serverless architecture will scale compute easily. We should consider moving to a more scalable database if needed (Aurora Serverless or a connection-pool friendly solution) because many Lambda connections could exhaust a traditional RDS. Using a serverless driver (like PgBouncer or connection pooling via Prisma Data Proxy) could be a solution. Note this for future.
  - Implement caching for expensive operations. For example, if an event roster is viewed frequently by many, maybe cache it in memory or at edge. TanStack Start could allow some SSR caching strategies. Or use CloudFront for certain public data (though since mostly authenticated, maybe not).
  - Consider separating some services if needed (for instance, if event scheduling was heavy, one could move it to a separate function). But currently, one monolithic Lambda is fine.
  
- **Automated Testing:** As platform grows, add a suite of tests (unit tests for critical logic, integration tests for routes). Possibly integrate with CI.
  
- **Onboarding New Org:** Write a runbook or scripts to onboard a new organization: e.g., how to create their admin accounts, how to configure their settings, etc. Possibly create an interface for a super-admin to do this without database fiddling.
  
**Justification:** This phase is about ensuring longevity and extensibility. We design for multi-tenancy early (by Phase 6, we’d implement it if QC is stable and maybe another org is interested). It’s easier to build multi-org support when the system is fresh in mind rather than as a retrofit much later. By doing it in a separate phase, we also avoid over-complicating earlier phases where only one org existed; we first got it working for one, now generalize.

Scalability in terms of performance is addressed here mostly as preparation, because initially the scale might not demand changes. But acknowledging potential bottlenecks (like DB connections) is important so we can plan solutions (Prisma offers a Data Proxy or we could use Planetscale which avoids connection limits by proxy). This ensures the app won’t suddenly choke under success.

---

## Conclusion

By following this phased implementation plan, we build the platform iteratively, delivering value at each stage while keeping the overall architecture aligned with future needs. The choice of a **modern tech stack** (TanStack Start, SST, Prisma, Clerk, etc.) is meant to maximize developer productivity given our resource constraints, without sacrificing scalability. Each tool was chosen with trade-offs in mind, favoring managed solutions for commodity features (auth, email, payments) so we can focus on domain-specific functionality (sports memberships, teams, events). 

The README above provides current and future developers (and stakeholders) with an understanding of the system’s purpose, how it’s designed, and how to run it. The implementation plan breaks down the daunting task into actionable pieces, ensuring that at no point are we trying to “boil the ocean.” We start from a solid foundation (auth and data model), then layer feature on feature – testing and validating at each step – which will lead to a robust final product.

By Phase 5, Quadball Canada will have a fully operational platform to manage their community. And by planning Phase 6, we have laid the groundwork for the platform to evolve into a multi-sport solution, fulfilling the original vision of extensibility. We will continuously gather feedback from real users (players, team leads, admins) as we implement phases, allowing adjustments in subsequent phases to meet user needs better. This agile, phased approach and the rationale behind our tech decisions should set the project up for a successful launch and long-term maintainability.

