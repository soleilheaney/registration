# Phase 4: Event Management and Registration

## Ticket 4.1: Add Event and EventRegistration schema

**Description:**  
Update the database schema to add Event and EventRegistration models.

**Acceptance Criteria:**
- Create Event model with fields for name, description, dates, location, type
- Add fields for max participants, registration deadline, fee, etc.
- Implement EventRegistration model linking events to teams/members
- Support both team-based and individual events
- Run database migration
- Update Prisma client and queries

**Technical Notes:**
- Include organizationId field for future multi-org support
- Add eventType enum (Tournament, League, Scrimmage, etc.)
- Design registration model to handle both team and individual registrations
- Consider payment tracking fields in registration
- Add status field for registrations (pending, confirmed, etc.)

**Priority:** High
**Estimated Effort:** 3-4 hours

---

## Ticket 4.2: Event creation form (admin)

**Description:**  
Build admin interface for creating new events.

**Acceptance Criteria:**
- Create event creation form at `/admin/events/new` or similar
- Include fields for all event details (name, dates, location, etc.)
- Add option to set event as team-based or individual
- Implement fee configuration if applicable
- Add validation for required fields
- Create server action to save event to database
- Redirect to event detail page after creation

**Technical Notes:**
- Ensure admin-only access to this functionality
- Consider date picker components for start/end dates
- Add rich text editor for description if needed
- Link to Stripe product creation if implementing per-event products

**Priority:** High
**Estimated Effort:** 6-8 hours

---

## Ticket 4.3: Events listing page & eligibility logic

**Description:**  
Create public page listing all upcoming events with registration capabilities.

**Acceptance Criteria:**
- Implement `/events` page showing all upcoming events
- Display key event details (name, date, location, etc.)
- Show registration status (open, closed, etc.)
- Implement logic to determine user eligibility to register
- Show Register button only for eligible users
- Add filtering options (by date, type, etc.)

**Technical Notes:**
- Create efficient query to fetch upcoming events
- Implement eligibility logic based on event type:
  - For team events: user must be team lead of an unregistered team
  - For individual events: user must be active member and not registered
- Consider caching for performance if many events
- Ensure clear communication about eligibility requirements

**Priority:** High
**Estimated Effort:** 5-7 hours

---

## Ticket 4.4: Team event registration & payment

**Description:**  
Implement functionality for team leads to register their teams for events.

**Acceptance Criteria:**
- Add registration flow when team lead clicks "Register" for event
- If multiple teams, allow selection of which team to register
- Create server endpoint to handle registration
- Integrate Stripe checkout for event fees
- Create success/cancel pages for payment flow
- Update registration status based on payment
- Send confirmation email after successful registration

**Technical Notes:**
- Reuse Stripe checkout implementation from membership
- Consider creating Stripe Products for events or use dynamic checkout
- Update EventRegistration record when webhook confirms payment
- Handle edge cases (registration closing during process, etc.)

**Priority:** High
**Estimated Effort:** 8-10 hours

---

## Ticket 4.5: Individual event registration

**Description:**  
Implement registration flow for individual-based events.

**Acceptance Criteria:**
- Create registration flow for individual events
- Implement any event-specific questions or options
- Handle payment process similar to team registration
- Create server endpoint for individual registration
- Send confirmation email after successful registration
- Update event page to show registered status

**Technical Notes:**
- Reuse payment flow from team registration
- Ensure correct EventRegistration record with memberId instead of teamId
- Consider priority if implemented (e.g., waitlist functionality)
- Implement cancellation flow if needed

**Priority:** Medium
**Estimated Effort:** 6-8 hours

---

## Ticket 4.6: Admin event participants list

**Description:**  
Create detailed event view for admins showing all registrations.

**Acceptance Criteria:**
- Implement event detail page with admin view
- Show list of all registered teams/individuals
- Display payment status and registration details
- Add functionality to export participant list (CSV)
- Implement basic filtering or sorting
- Add admin actions (approve, remove, etc.) if needed

**Technical Notes:**
- Create efficient query to fetch event with all registrations
- Consider separate tabs for different registration statuses
- Implement export functionality using server-side generation
- Ensure admin-only access to this view

**Priority:** Medium
**Estimated Effort:** 5-7 hours

---

## Ticket 4.7: Event details and public view

**Description:**  
Create public event detail page with appropriate information for different user types.

**Acceptance Criteria:**
- Implement public event page at `/events/[eventId]`
- Show comprehensive event details
- Display different information based on user role:
  - Admin: full details and management options
  - Team lead of registered team: confirmation and team info
  - Regular user: general event info and registration option if eligible
- Show list of participating teams if appropriate
- Link to registration flow

**Technical Notes:**
- Fetch appropriate data based on user role
- Consider what information should be public vs. private
- Optimize queries to avoid overfetching
- Implement proper authorization checks

**Priority:** Medium
**Estimated Effort:** 5-7 hours

---

## Ticket 4.8: Admin override registration

**Description:**  
Allow admins to manually manage event registrations.

**Acceptance Criteria:**
- Add functionality for admin to close registrations
- Implement deadline enforcement in registration flows
- Allow admin to manually mark registration as paid
- Add ability for admin to add team/individual directly
- Implement removal of registration if needed
- Log all administrative actions

**Technical Notes:**
- Create server endpoints for each admin action
- Ensure proper authorization checks
- Consider audit trail for manual changes
- Update UI immediately after actions

**Priority:** Low
**Estimated Effort:** 4-6 hours

---

## Ticket 4.9: Email confirmations for event registration

**Description:**  
Implement email notifications for event-related actions.

**Acceptance Criteria:**
- Send confirmation email after successful event registration
- Notify admin when new registration occurs
- Include all relevant event details in emails
- Add calendar invite attachment if possible
- Implement proper error handling for email failures

**Technical Notes:**
- Use Resend service for sending emails
- Create templates for different notification types
- Consider HTML email with formatting for better readability
- Test all email scenarios

**Priority:** Medium
**Estimated Effort:** 3-5 hours