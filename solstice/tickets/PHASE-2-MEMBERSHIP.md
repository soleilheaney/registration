# Phase 2: Member Profiles & Membership Management

## Ticket 2.1: Prisma schema update – Member and Membership

**Description:**  
Extend the database schema to include Member profiles and membership tracking.

**Acceptance Criteria:**
- Create Member model linked to User/Clerk user ID
- Add fields for member profile (name, birthdate, contact info, address, etc.)
- Create model for tracking membership status (MembershipPurchase or similar)
- Implement field for membership validity (e.g., `membershipValidUntil` or `isActiveMember`)
- Run migration to update the database
- Ensure proper relationships between models

**Technical Notes:**
- Consider whether to use a separate Member model or extend User model
- For simplicity in Phase 2, can use a boolean `isActiveMember` and update when paid
- Consider future multi-season support in the model design
- Ensure indexes for efficient querying

**Priority:** High
**Estimated Effort:** 3-4 hours

---

## Ticket 2.2: Implement profile form (frontend)

**Description:**  
Create a user interface for members to enter and edit their profile information.

**Acceptance Criteria:**
- Create profile page at `/dashboard/profile` or similar
- Implement form with fields for all required member information
- Add client-side validation for required fields
- Style form consistently with application design
- Include save/update button with loading state
- Display success/error messages on submission

**Technical Notes:**
- Consider using TanStack Form or simple useState for form handling
- Ensure form is accessible and mobile-friendly
- Possibly use a UI component library for form elements
- Fetch existing profile data if available

**Priority:** Medium
**Estimated Effort:** 6-8 hours

---

## Ticket 2.3: Profile update route (backend)

**Description:**  
Create server endpoint to handle saving member profile information.

**Acceptance Criteria:**
- Implement TanStack Start server action or API route for profile updates
- Ensure route is protected and only allows users to edit their own profile
- Implement server-side validation of submitted data
- Save valid data to the database via Prisma
- Return appropriate success/error responses
- Handle edge cases (e.g., concurrent updates)

**Technical Notes:**
- Use Clerk session to identify the current user
- Apply proper data sanitation and validation
- Consider using a validation library like Zod
- Log significant actions for troubleshooting

**Priority:** Medium
**Estimated Effort:** 4-6 hours

---

## Ticket 2.4: Integrate Stripe Checkout for membership

**Description:**  
Implement payment processing for membership purchases using Stripe Checkout.

**Acceptance Criteria:**
- Set up Stripe account and get API keys
- Create backend route to initiate Stripe Checkout session
- Configure membership fee as line item in Stripe
- Implement client-side integration to redirect to Stripe Checkout
- Create success and cancel pages for post-payment
- Add appropriate error handling

**Technical Notes:**
- Route should be something like `/api/create-checkout-session`
- Use Stripe's SDK to create checkout session
- Set appropriate success and cancel URLs
- For simple MVP, assume one standard membership fee
- Consider testing with Stripe's test mode

**Priority:** High
**Estimated Effort:** 8-10 hours

---

## Ticket 2.5: Implement Stripe webhook and membership activation

**Description:**  
Create webhook handler to process Stripe payment notifications and update membership status.

**Acceptance Criteria:**
- Implement webhook endpoint at `/api/stripe-webhook`
- Verify Stripe signature for security
- Handle `checkout.session.completed` events
- Update member's status to active upon successful payment
- Set appropriate membership validity period
- Implement error handling and logging

**Technical Notes:**
- Use Stripe CLI for local webhook testing
- Configure webhook in Stripe dashboard for production
- Ensure proper error handling and idempotency
- For MVP, can simply mark `isActiveMember = true` and set `membershipValidUntil`
- Consider edge cases (e.g., repeated payments, expired webhook events)

**Priority:** High
**Estimated Effort:** 6-8 hours

---

## Ticket 2.6: Membership status display

**Description:**  
Show membership status on user dashboard and implement "Buy now" functionality.

**Acceptance Criteria:**
- Display current membership status on dashboard
- Show expiration date if membership is active
- Add "Buy now" button for non-members
- Update UI automatically after successful payment
- Clearly communicate benefits of membership

**Technical Notes:**
- Fetch membership status from database
- Connect "Buy now" button to Stripe Checkout flow
- Consider caching status to avoid repeated database queries
- Ensure UI updates correctly after payment process

**Priority:** Medium
**Estimated Effort:** 3-4 hours

---

## Ticket 2.7: Admin view member list

**Description:**  
Create admin interface to view and manage all members in the system.

**Acceptance Criteria:**
- Create admin page at `/admin/members` or similar
- Display table of all members with key information
- Show membership status for each member
- Allow filtering by active/inactive status
- Implement basic sorting functionality
- If possible, allow admin to manually activate memberships

**Technical Notes:**
- Write efficient Prisma query to fetch members
- Consider pagination if member count becomes large
- Use a table component or build one with good UX
- Consider future needs for editing or additional actions

**Priority:** Medium
**Estimated Effort:** 5-7 hours

---

## Ticket 2.8: Send email on membership purchase

**Description:**  
Implement email notifications for membership-related actions using Resend.

**Acceptance Criteria:**
- Set up Resend account and API key
- Create welcome email template for new members
- Implement confirmation email after membership purchase
- Ensure emails contain all required information
- Test email delivery in development environment
- Integrate with Stripe webhook flow

**Technical Notes:**
- Use Resend's SDK to send emails
- Create function that can be called from Stripe webhook handler
- Consider using React Email or similar for HTML templates
- Test with Resend's test mode initially
- Ensure proper error handling if emails fail to send

**Priority:** Low
**Estimated Effort:** 3-5 hours