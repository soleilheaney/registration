# Phase 3: Team Management

## Ticket 3.1: Schema update – Team and TeamMembership

**Description:**  
Update the database schema to add Team models and establish relationships with Members.

**Acceptance Criteria:**
- Create Team model with fields for name, organization, region, etc.
- Implement TeamMembership join table for many-to-many relationship
- Add role field in TeamMembership (PLAYER, LEAD)
- Establish proper relationships and constraints
- Run database migration
- Update Prisma client

**Technical Notes:**
- Include organizationId field for future multi-org support
- Consider adding a unique code or slug for team identification
- Design for flexibility (multiple team leads, players on multiple teams)
- Consider adding created/updated timestamps for auditing

**Priority:** High
**Estimated Effort:** 3-4 hours

---

## Ticket 3.2: Team creation page

**Description:**  
Implement functionality for users to create new teams and become team leads.

**Acceptance Criteria:**
- Create "Create a Team" UI in the dashboard
- Implement form with team details (name, location, etc.)
- Add validation for required fields
- Create server action to save team to database
- Automatically assign creator as team LEAD
- Redirect to team page after creation
- Display appropriate success/error messages

**Technical Notes:**
- Ensure only authenticated users can create teams
- Consider if membership requirements apply to team creation
- Generate a unique team code if implementing invite system
- Store the creating user as LEAD in TeamMembership table

**Priority:** High
**Estimated Effort:** 5-7 hours

---

## Ticket 3.3: Team roster page with list management

**Description:**  
Create team detail page showing roster and implement management functions for team leads.

**Acceptance Criteria:**
- Create team page at `/teams/[teamId]` or similar
- Display team details and roster of members
- Show membership status of each player
- Allow team lead to add new players by email
- Implement player removal functionality
- Ensure appropriate access control (team members only)
- Add UI for editing team information (for team lead)

**Technical Notes:**
- Verify current user is part of team before showing page
- Implement different views/actions based on role (lead vs player)
- Fetch team data with members in single query if possible
- Consider UX for adding multiple players

**Priority:** High
**Estimated Effort:** 8-10 hours

---

## Ticket 3.4: Team member invitation system

**Description:**  
Implement a system for team leads to invite new members to their team.

**Acceptance Criteria:**
- Create UI for team lead to enter email address for invitation
- Implement server endpoint to send invitation email
- Generate unique invitation token or code
- Create invite acceptance page/flow
- Handle scenarios where invitee is already a member or not
- Update team roster when invitation is accepted
- Show pending invitations to team lead

**Technical Notes:**
- Store invitations in database with status and expiration
- Send emails using Resend service
- Create proper redirect flow if user needs to sign up first
- Consider implementing a simplified version initially if needed

**Priority:** Medium
**Estimated Effort:** 8-10 hours

---

## Ticket 3.5: Remove player from team

**Description:**  
Allow team leads to remove players and players to leave teams.

**Acceptance Criteria:**
- Add "Remove" button for team leads next to each player
- Implement confirmation dialog before removal
- Create server endpoint to handle player removal
- Allow players to leave team themselves (except last lead)
- Send notification to affected player when removed
- Update UI immediately after successful action

**Technical Notes:**
- Ensure proper permission checks (only leads can remove others)
- Add safeguard to prevent team having zero leads
- Use soft delete or keep audit trail if needed
- Consider impact on related data (e.g., event registrations)

**Priority:** Medium
**Estimated Effort:** 3-5 hours

---

## Ticket 3.6: Admin view teams

**Description:**  
Create admin interface to view and manage all teams in the system.

**Acceptance Criteria:**
- Create admin page at `/admin/teams` or similar
- Display table of all teams with key information
- Show number of players and other relevant stats
- Allow basic filtering or sorting
- Link to detailed team view for each team
- Consider adding admin actions (edit, delete, etc.)

**Technical Notes:**
- Write efficient Prisma query to fetch teams with counts
- Consider pagination for large number of teams
- Reuse team detail page with admin privileges if possible
- Ensure admin-only access to this page

**Priority:** Low
**Estimated Effort:** 4-6 hours

---

## Ticket 3.7: Enforce membership for teams

**Description:**  
Ensure only active members can be added to teams.

**Acceptance Criteria:**
- Check membership status when adding player to team
- Show appropriate error message if trying to add inactive member
- Clearly communicate membership requirement to users
- Handle edge cases (e.g., expired membership after joining team)
- Document policy for team leads

**Technical Notes:**
- Add validation in server endpoints for adding team members
- Check `isActiveMember` field before allowing addition
- Consider UI indicators to show which members can be added
- Decide on policy for expired memberships (remove from team?)

**Priority:** Medium
**Estimated Effort:** 2-3 hours

---

## Ticket 3.8: Email notifications for teams

**Description:**  
Implement email notifications for team-related actions.

**Acceptance Criteria:**
- Send email when player is added to a team
- Implement invitation email if using invite system
- Send notification to team lead when player requests to join (if implemented)
- Include relevant information in each email type
- Test all email flows

**Technical Notes:**
- Use Resend service for sending emails
- Create templates for different notification types
- Consider frequency and importance of notifications
- Include opt-out link if appropriate

**Priority:** Low
**Estimated Effort:** 3-5 hours