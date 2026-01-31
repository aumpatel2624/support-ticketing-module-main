# AI Coding Agent Prompt: Support Ticketing System Dashboard Implementation

## Project Overview
Implement a comprehensive dashboard statistics system for a support ticketing platform with role-based views. All analytics should be consolidated into a single dashboard page - there is NO separate analytics page.

## User Roles & Access Levels
1. **Super Admin** - Full system access plus system health monitoring
2. **Admin** - Team management and operational oversight  
3. **Team Member** - Agent view with personal performance metrics
4. **Normal User** - Customer view showing only their own tickets

---

## ADMIN DASHBOARD REQUIREMENTS

### Primary KPIs (4 Cards at the Top)

**Card 1: Active Tickets**
- Show total count of open tickets (all statuses except Closed)
- Include week-over-week trend (percentage change compared to last week)
- Display trend with up/down arrow and color (green for decrease, red for increase)

**Card 2: SLA Risk**
- Show count of tickets approaching or breaching SLA deadlines
- Calculate percentage of total active tickets at risk
- Include week-over-week trend
- Color code: Red if percentage is high, yellow if medium, green if low

**Card 3: Average Response Time**
- Calculate mean time to first response across all tickets
- Show in hours or hours:minutes format
- Include week-over-week trend
- Lower is better - show green arrow for improvement

**Card 4: Average Resolution Time**
- Calculate mean time from ticket creation to closure
- Show in hours or days as appropriate
- Include week-over-week trend
- Lower is better

### Secondary Metrics (4 Cards Below KPIs)

**Card 5: Team Capacity**
- Show number of active agents vs total agents
- Display as percentage
- Example: "12/15 agents (80%)"
- Visual progress bar optional

**Card 6: First Contact Resolution**
- Calculate percentage of tickets resolved on first interaction (no back-and-forth)
- Include trend indicator
- Higher is better

**Card 7: Ticket Backlog**
- Count tickets older than 48 hours that are still unassigned
- Include trend (increasing backlog is bad)
- Alert styling if count is high

**Card 8: Resolution Rate Today**
- Show tickets resolved today vs tickets created today
- Display as ratio and percentage
- Example: "Resolved 45 / Created 38 (118%)"
- Green if ratio > 100%, red if < 100%

### Charts Section (4 Visualizations)

**Chart 1: Ticket Volume Trends (Line Chart)**
- X-axis: Time period (allow user to select 7/30/90 days)
- Y-axis: Ticket count
- Two lines overlaid:
  - Blue line: Tickets Created
  - Green line: Tickets Resolved
- Show the gap between creation and resolution
- Include data points on hover

**Chart 2: Ticket Distribution (Two Donut Charts Side by Side)**

Left Donut - By Status:
- Segments: New, Assigned, In Progress, Pending, Resolved, Closed
- Each segment different color
- Show percentage and count on hover
- Center text shows total count

Right Donut - By Priority:
- Segments: Critical, High, Medium, Low  
- Color code: Red (Critical), Orange (High), Yellow (Medium), Blue (Low)
- Show percentage and count on hover

**Chart 3: Category Analysis (Horizontal Bar Chart)**
- Show top 10 ticket categories by volume
- Sort from highest to lowest (descending)
- Display count on each bar
- Bar color can be consistent or gradient
- Labels on left side showing category names

**Chart 4: SLA Performance (Stacked Bar Chart)**
- X-axis: Priority levels (Critical, High, Medium, Low)
- Y-axis: Ticket count
- Each bar split into 3 segments stacked:
  - Green: SLA Met (resolved within SLA)
  - Yellow: At Risk (approaching deadline)
  - Red: Breached (missed SLA)
- Show percentage labels on segments
- Tooltip shows exact counts

### Data Tables Section (2 Tables)

**Table 1: Critical Tickets**

Columns needed:
- Ticket ID (clickable link)
- Subject (truncate if too long)
- Priority (badge: Critical or High only)
- Assigned To (agent name or "Unassigned")
- Age (how long since created, e.g., "2d 5h")
- SLA Status (badge: Met/At Risk/Breached with colors)

Filters and sorting:
- Only show tickets with Priority = Critical OR High
- Sort by SLA urgency (Breached first, then At Risk, then Met)
- Limit to 10 rows
- Add "View All Critical Tickets" link below table

**Table 2: Agent Performance Overview**

Columns needed:
- Agent Name (with avatar if available)
- Assigned Count (tickets currently assigned)
- Resolved Count (tickets resolved, can filter by time period)
- Avg Resolution Time (in hours, lower is better)
- Active Status (online/offline indicator)

Features:
- Show all active agents in the system
- Make columns sortable
- Rows clickable to view agent details
- Default sort by Resolved Count descending

### Additional Widgets

**Peak Hours Heatmap**
- Create a grid: 7 rows (days of week) x 24 columns (hours of day)
- Each cell colored based on ticket volume intensity
- Darker color = more tickets created
- Tooltip on hover shows exact count
- Helps identify when most tickets come in

**SLA Compliance Gauge**
- Circular gauge/speedometer showing percentage of tickets meeting SLA
- Color zones:
  - 0-70%: Red zone
  - 70-90%: Yellow zone  
  - 90-100%: Green zone
- Display exact percentage in center
- Calculate as: (tickets meeting SLA / total closed tickets) × 100

---

## SUPER ADMIN DASHBOARD REQUIREMENTS

### System Health Banner (Prominent Top Section)

Display these metrics in a colored banner:

**System Status**
- Show current status: Healthy / Degraded / Down
- Visual indicator: Green circle (Healthy), Yellow (Degraded), Red (Down)
- Make it very prominent

**API Uptime**
- Show percentage uptime over last 30 days
- Example: "99.8% uptime"

**Total Users**
- Count of all registered users in system
- Include week-over-week trend

**Storage Used**
- Show current storage used vs total capacity
- Example: "45 GB / 100 GB (45%)"
- Visual progress bar
- Alert if nearing capacity

**Active Sessions**
- Count of users currently logged in
- Real-time or near real-time

**System Version**
- Display current version number
- Optional: Show "Update Available" indicator

### Additional Platform Analytics Charts

**User Activity Chart (Line Chart)**
- Two lines:
  - Daily or Weekly active users
  - New user registrations
- Time period: Last 30 days
- Helps track platform growth

**Role Distribution (Pie Chart)**
- Show breakdown of users by role:
  - Super Admin
  - Admin
  - Team Member
  - Normal User
- Display count and percentage for each
- Use different colors per role

### System Performance Table

Display these metrics in a table or card grid:

**Database Performance**
- Average query response time (milliseconds)
- Connection pool status (active/idle connections)
- Flag if performance is degraded

**Email Delivery Metrics**
- Total sent
- Successfully delivered
- Bounced
- Failed
- Calculate delivery rate percentage

**Notification System**
- Push notifications sent
- Push notifications delivered  
- Delivery rate percentage
- Flag delivery issues

**Background Jobs Status**
- Jobs queued (waiting)
- Jobs processing (running now)
- Jobs completed (successful)
- Jobs failed (errors)
- Alert if failure rate is high

### Audit & Security Widget

**Recent Admin Actions Log**
- Show last 10 admin actions
- Display: Timestamp, Admin name, Action performed
- Examples: "User created", "Settings changed", "Ticket reassigned"
- Clickable for more details

**Failed Login Attempts**
- Count of failed logins in last 24 hours
- Alert if unusually high
- Optional: Show IP addresses if security concern

**Unusual Activity Alerts**
- Display any flagged unusual patterns
- Could be: Multiple logins from different locations, mass ticket creation, etc.
- Leave empty if no alerts

### Important Note
Super Admin dashboard should INHERIT ALL metrics from Admin dashboard (all KPIs, charts, tables, and widgets listed above), PLUS the additional system health and platform analytics sections.

---

## TEAM MEMBER DASHBOARD REQUIREMENTS

### Personal Performance KPIs (4 Cards at Top)

**Card 1: Assigned to Me**
- Show total count of tickets currently assigned to logged-in agent
- Break down by status: New / In Progress
- Example: "15 tickets (5 new, 10 in progress)"

**Card 2: Completed Today**
- Count of tickets resolved by this agent today
- Show progress toward daily target
- Example: "8 / 20 (40%)"
- Display progress bar
- Target number can be configurable per agent

**Card 3: Average Resolution Time**
- Show agent's personal average resolution time
- Also show team average for comparison
- Calculate difference/comparison
- Example: "Your avg: 4.5h | Team avg: 5.2h (13% faster)"
- Green text if better than team, red if worse

**Card 4: Current Workload**
- Calculate as: (assigned tickets / agent's capacity) × 100
- Example: "12 / 15 tickets (80% capacity)"
- Visual gauge or progress bar
- Alert styling if over 90%

### Performance Metrics (4 Cards Below KPIs)

**Card 5: First Response Time**
- Agent's average time to first response
- Also show team average
- Display in minutes if under an hour, hours if longer
- Lower is better

**Card 6: Reopen Rate**
- Percentage of tickets that were reopened after this agent resolved them
- Also show count: "5 reopened / 100 resolved (5%)"
- Lower is better - indicates quality
- Red alert if rate is above threshold (e.g., 10%)

**Card 7: Weekly Target**
- Tickets completed this week vs weekly target
- Example: "12 / 20 (60%)"
- Progress bar visualization
- Color code: Red if behind, yellow if on track, green if ahead

**Card 8: SLA Compliance**
- Percentage of this agent's tickets meeting SLA
- Show count: "45 / 50 met SLA (90%)"
- Green if above 90%, yellow 70-90%, red below 70%

### Charts Section (3 Visualizations)

**Chart 1: My Ticket Trend (Line Chart)**
- X-axis: Last 30 days
- Two lines:
  - Tickets assigned to me
  - Tickets resolved by me
- Shows personal productivity trend
- Helps agent see their workload pattern

**Chart 2: My Tickets by Priority (Donut Chart)**
- Distribution of currently assigned tickets by priority
- Segments: Critical, High, Medium, Low
- Show count and percentage
- Helps agent prioritize work

**Chart 3: My Tickets by Status (Bar Chart)**
- X-axis: Status (New, In Progress, Pending, Resolved, etc.)
- Y-axis: Count
- Simple vertical or horizontal bars
- Quick snapshot of where agent's tickets stand

### Data Tables Section (2 Tables)

**Table 1: My Active Tickets**

Columns needed:
- Ticket ID (clickable)
- Subject (truncated if long)
- Customer name
- Priority (badge)
- Status (badge)
- Age (time since created)
- SLA Countdown (time remaining, e.g., "2h 30m left")
- Quick Actions (buttons: "Take Action", "View Details")

Sorting and features:
- Default sort: By SLA urgency (tickets about to breach shown first)
- Show 15 rows with pagination
- Highlight rows in red if SLA breach imminent
- Filter options: Priority, Status

**Table 2: Recently Completed**

Columns needed:
- Ticket ID
- Subject
- Completed At (timestamp)
- Resolution Time (how long it took)
- Status (should be Resolved or Closed)

Features:
- Show last 5 tickets resolved by this agent
- Most recent first
- Simple, clean display

### Alert Widgets

**SLA Alert Panel** (Red alert box)
- Prominent red-bordered box at top or side
- List tickets assigned to this agent that are at SLA risk
- Show: Ticket ID, Subject, Time remaining
- Quick links to take action
- Only show if there are at-risk tickets

**Pending Actions Panel** (Amber/Yellow alert box)
- Yellow-bordered box
- List tickets waiting for this agent's response
- Show: Ticket ID, Subject, Waiting time
- Quick links
- Only show if there are pending tickets

**Team Leaderboard Widget**
- Show top 5 performers this week
- Rank by tickets resolved
- Display: Rank number, Agent name, Avatar, Ticket count
- Gamification element to motivate
- Highlight current agent if in top 5
- Consider adding badges/icons for 1st, 2nd, 3rd place

---

## NORMAL USER DASHBOARD REQUIREMENTS

### Personal Ticket Stats (4 Cards at Top)

**Card 1: My Open Tickets**
- Simple count of user's tickets that aren't closed
- Example: "5 open tickets"
- Clickable to see list

**Card 2: Awaiting Response**
- Count of tickets where user is waiting for support reply
- Status would be: Assigned, In Progress (but waiting on agent)
- Helps user know what's pending

**Card 3: Resolved This Month**
- Count of tickets closed/resolved in current calendar month
- Shows user their support usage pattern

**Card 4: Average Resolution Time**
- How fast this user's tickets typically get resolved
- Calculate average across all their closed tickets
- Example: "Your tickets resolved in avg 6 hours"
- Informational metric

### Ticket Status Board (Kanban-style Overview)

Create 6 visual cards in a row (or 2 rows on mobile):

1. **New** - Count + icon
2. **Assigned** - Count + icon
3. **In Progress** - Count + icon
4. **Pending** (Customer Action Needed) - Count + icon
5. **Resolved** - Count + icon
6. **Closed** - Count + icon

Design notes:
- Each card different color for visual differentiation
- Large count number
- Status name below
- Optional icon at top
- Cards clickable to filter to that status
- Clean, simple design

### Charts Section (2 Simple Visualizations)

**Chart 1: My Ticket History (Line Chart)**
- X-axis: Last 6 months
- Two lines:
  - Tickets I created
  - Tickets resolved
- Simple, clean design
- Helps user see their support usage over time

**Chart 2: My Tickets by Priority (Donut Chart)**
- Show distribution of their current tickets by priority
- Segments: Critical, High, Medium, Low
- Shows if user has any critical issues pending
- Simple visualization

### Data Tables Section (2 Tables)

**Table 1: My Active Tickets**

Columns needed:
- Ticket ID (clickable to view details)
- Subject
- Status (badge)
- Priority (badge)
- Last Updated (timestamp)
- Assigned Agent (name or "Unassigned")

Features:
- Show ALL user's active tickets (not closed)
- Default sort: By last updated (most recent first)
- Rows clickable to view full ticket details
- Simple pagination if many tickets
- Clean, readable layout

**Table 2: Recent Resolutions**

Columns needed:
- Ticket ID
- Subject  
- Resolved At (timestamp)
- Resolution Summary (agent's resolution notes)

Features:
- Show last 3 resolved tickets
- Most recent first
- Truncate resolution summary if very long
- Link to view full details
- Simple display

### User Action Widgets

**Quick Actions Panel**

Create prominent action panel with:
- Large "Create New Ticket" button (primary CTA)
- "View All My Tickets" link
- "Knowledge Base" or "Help Center" link
- Clean, easy-to-find design
- Consider icon + text layout

**Estimated Wait Time Widget**

- Display current average response time
- Example: "Current wait time: ~2 hours"
- Or: "Typical response: Within 4 hours"
- Informational, sets expectations
- Update periodically based on actual data

**My Most Recent Activity Widget**

- Show timestamp of last interaction
- Show last action taken (e.g., "You replied 2 hours ago")
- Keeps user informed about ticket status
- Optional: Show agent's last action too

---

## DATA CALCULATION REQUIREMENTS

### How to Calculate Each Metric

**Active Tickets**
- Count all tickets where status is NOT "Closed"
- Include: New, Assigned, In Progress, Pending, Resolved

**Week-over-Week Trend**
- Calculate metric for current week (last 7 days)
- Calculate same metric for previous week (days 8-14 ago)
- Formula: ((current - previous) / previous) × 100
- Display as percentage with +/- sign

**SLA Risk Count**
- For each ticket, calculate time remaining until SLA deadline
- Count tickets where time remaining < 2 hours (configurable threshold)
- Also include tickets already past deadline

**Average Response Time**
- For each ticket, calculate: Time of first agent response - Time of ticket creation
- Average across all tickets in time period
- Convert to hours or hours:minutes

**Average Resolution Time**
- For each resolved ticket, calculate: Time of resolution - Time of creation
- Average across all resolved tickets in time period
- Display in appropriate unit (hours if < 24h, days if longer)

**Team Capacity**
- Count agents marked as "active" or "online"
- Divide by total agent count
- Multiply by 100 for percentage

**First Contact Resolution**
- Count tickets resolved with exactly 1 agent response (no back-and-forth)
- Divide by total resolved tickets
- Multiply by 100 for percentage

**Ticket Backlog**
- Count tickets where:
  - Status = "New" (unassigned)
  - Created more than 48 hours ago

**Resolution Rate Today**
- Count tickets resolved today (where resolution timestamp is today)
- Count tickets created today
- Calculate ratio and percentage

**Reopen Rate**
- For given agent, count tickets they resolved that were later reopened
- Divide by total tickets they resolved
- Multiply by 100 for percentage

**SLA Compliance**
- Count tickets meeting SLA (resolved before deadline)
- Divide by total resolved tickets
- Multiply by 100 for percentage

---

## UI/UX REQUIREMENTS

### General Design Principles

**Layout**
- Use grid system for consistent spacing
- Cards should have consistent height in same row
- Responsive design: Stack cards on mobile
- Clean white space, not cluttered

**Colors**
- Use consistent color scheme throughout
- Trend indicators: Green = good/improving, Red = bad/declining, Gray = neutral
- Status badges: Consistent colors (e.g., New = blue, In Progress = yellow, Resolved = green)
- Alert panels: Red for urgent, yellow for warning, green for success

**Typography**
- Large numbers for KPI counts (easy to scan)
- Smaller text for labels and descriptions
- Consistent font sizes across similar elements

**Interactivity**
- Hover effects on clickable elements
- Tooltips on charts for detailed data
- Loading states while data fetches
- Smooth transitions/animations

**Accessibility**
- Proper color contrast ratios
- ARIA labels for screen readers
- Keyboard navigation support
- Text alternatives for visual data

### Performance Considerations

**Data Loading**
- Show skeleton loaders while data fetches
- Don't block entire page - load sections independently
- Cache data where appropriate
- Refresh KPIs every 30-60 seconds automatically

**Chart Performance**
- Limit data points for better rendering
- Use data aggregation for large datasets
- Lazy load charts below the fold
- Optimize re-renders

---

## ROLE-BASED ACCESS CONTROL

**Important Security Rules**

- Normal Users can ONLY see their own tickets and data
- Team Members can see their own tickets + team statistics  
- Admins can see all tickets and all agent statistics
- Super Admins can see everything + system health data

**Data Filtering**
- Apply user role filter on backend before sending data
- Never expose data in frontend that user shouldn't see
- Verify role permissions on every API endpoint

**Route Protection**
- Redirect if user tries to access wrong dashboard
- Normal User accessing /admin/dashboard → redirect to /dashboard
- Check role on route change

---

## API ENDPOINTS NEEDED

Create these endpoints to support the dashboards:

**For Admin Dashboard:**
- GET /api/admin/dashboard/kpis - Returns all KPI data
- GET /api/admin/dashboard/charts - Returns chart data
- GET /api/admin/dashboard/critical-tickets - Returns critical tickets table
- GET /api/admin/dashboard/agent-performance - Returns agent performance table

**For Super Admin Dashboard:**
- GET /api/superadmin/system-health - Returns system health metrics
- GET /api/superadmin/user-activity - Returns user activity data
- GET /api/superadmin/system-performance - Returns system performance data
- GET /api/superadmin/audit-log - Returns recent admin actions

**For Team Member Dashboard:**
- GET /api/agent/dashboard/kpis - Returns agent-specific KPIs
- GET /api/agent/dashboard/my-tickets - Returns agent's assigned tickets
- GET /api/agent/dashboard/performance - Returns agent performance metrics

**For Normal User Dashboard:**
- GET /api/user/dashboard/stats - Returns user ticket statistics
- GET /api/user/dashboard/my-tickets - Returns user's tickets
- GET /api/user/dashboard/history - Returns user ticket history

**Additional Requirements:**
- All endpoints should accept date range parameters where relevant
- Return data in consistent JSON format
- Include proper error handling
- Add pagination where needed (tickets lists)

---

## TESTING REQUIREMENTS

**Functionality to Test:**

1. **Role-based access**
   - Each role sees only their appropriate dashboard
   - Data filtering works correctly
   - Unauthorized access is blocked

2. **Data accuracy**
   - KPI calculations are correct
   - Trends calculate properly
   - Charts display accurate data

3. **Real-time updates**
   - Data refreshes automatically
   - New tickets appear in counts
   - Status changes reflect immediately

4. **Responsive design**
   - Works on desktop, tablet, mobile
   - Charts resize properly
   - Tables scroll or paginate on small screens

5. **Performance**
   - Dashboard loads quickly (< 3 seconds)
   - Charts render smoothly
   - No lag when interacting

---

## IMPLEMENTATION PRIORITY

**Phase 1 - Core Functionality:**
1. Set up routing for different role dashboards
2. Implement basic KPI cards for each role
3. Create data fetching logic and API endpoints
4. Implement role-based access control

**Phase 2 - Visualizations:**
5. Add all required charts using chart library
6. Implement data tables with sorting/filtering
7. Create status boards for normal users

**Phase 3 - Advanced Features:**
8. Add real-time data refresh
9. Implement alert panels and widgets
10. Add heatmaps, gauges, leaderboards

**Phase 4 - Polish:**
11. Responsive design refinements
12. Loading states and animations
13. Error handling and edge cases
14. Performance optimization

---

## NOTES AND CLARIFICATIONS

- There is NO separate analytics page - everything goes on the dashboard
- NO satisfaction ratings or feedback features (those aren't built yet)
- All metrics should be calculated from ticket lifecycle data only
- Focus on clean, professional design that's easy to scan
- Prioritize actionable insights over vanity metrics
- Make sure data loads fast and refreshes automatically

---

## DELIVERABLES

When complete, the system should have:

1. Four distinct dashboard views (Super Admin, Admin, Team Member, Normal User)
2. All KPIs, charts, tables, and widgets as specified above
3. Role-based access control properly enforced
4. Responsive design working on all screen sizes
5. Clean, professional UI that matches the existing app design
6. Fast-loading pages with proper loading states
7. Automatic data refresh capability

Please implement this dashboard system following all the specifications above. Focus on creating a clean, professional, data-driven interface that provides role-appropriate insights to each user type. Use the shadcn Components and maintain the theme of the current existing app