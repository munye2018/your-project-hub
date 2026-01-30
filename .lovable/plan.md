

# In-App Notifications System Implementation Plan

## Overview
Build a complete in-app notification system with a bell icon dropdown in the navbar that shows new opportunities and system alerts. The system will leverage the existing `notifications` table and integrate with the opportunity tracking workflow.

---

## What Will Be Built

### 1. Notification Bell Component
A dropdown menu in the navbar (replacing the current static bell) that:
- Shows unread notification count as a badge
- Displays a scrollable list of recent notifications
- Allows marking notifications as read
- Links directly to opportunities when clicked

### 2. Real-time Updates
- Subscribe to the notifications table using Supabase realtime
- New notifications appear instantly without page refresh
- Unread count updates automatically

### 3. Notification Types Supported
- **new_opportunity**: When a high-value opportunity is found (>25% profit margin)
- **price_drop**: When a saved opportunity's price decreases
- **high_value**: Special alerts for exceptional deals (>40% profit margin)
- **system**: Platform updates and announcements

---

## Database Changes

The `notifications` table already exists with the correct schema:
- `id`, `user_id`, `opportunity_id`, `type`, `title`, `message`, `is_read`, `created_at`

**New additions needed:**
- Enable realtime on the notifications table
- Add a database function to auto-create notifications when high-value opportunities are inserted
- Add an index for faster unread notification queries

```text
+-------------------+         +-------------------+
|   opportunities   |  --->   |   notifications   |
+-------------------+         +-------------------+
| profit_percentage |         | user_id           |
| > 25%             |  creates| opportunity_id    |
+-------------------+         | type, title, msg  |
                              +-------------------+
```

---

## Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `src/components/notifications/NotificationBell.tsx` | Bell icon with dropdown showing notifications |
| `src/components/notifications/NotificationItem.tsx` | Individual notification row component |
| `src/hooks/useNotifications.ts` | Hook for fetching, subscribing, and managing notifications |

### Modified Files
| File | Changes |
|------|---------|
| `src/components/layout/Navbar.tsx` | Replace static bell with NotificationBell component |
| `supabase/functions/process-listings/index.ts` | Add notification creation for high-value opportunities |

---

## Implementation Steps

### Step 1: Database Setup
- Enable realtime on the `notifications` table
- Create trigger function to auto-notify users when opportunities with >25% profit are created
- Add performance index on `(user_id, is_read, created_at)`

### Step 2: Create Notifications Hook
Build `useNotifications.ts` with:
- Fetch recent notifications for current user
- Subscribe to realtime inserts
- Mark single/all notifications as read
- Delete old notifications
- Return unread count

### Step 3: Build Notification Components
**NotificationBell.tsx:**
- Popover/dropdown triggered by bell icon
- Badge showing unread count (hidden when 0)
- Header with "Mark all read" action
- Scrollable list of notifications
- Empty state when no notifications

**NotificationItem.tsx:**
- Icon based on notification type
- Title and truncated message
- Relative timestamp ("2 min ago")
- Click to navigate to opportunity and mark as read
- Hover state indicating unread status

### Step 4: Integrate with Navbar
- Import and use NotificationBell component
- Remove the current static Bell button
- Ensure proper z-index for dropdown over map view

### Step 5: Auto-Generate Notifications
Modify `process-listings` edge function to:
- After creating an opportunity with profit_percentage > 25%, create notifications
- Target all users who have matching preferences (region, asset type)
- Use appropriate notification type based on profit level

---

## Technical Details

### Notification Hook API
```text
useNotifications() returns:
  - notifications: Notification[]
  - unreadCount: number
  - loading: boolean
  - markAsRead(id: string): void
  - markAllAsRead(): void
  - deleteNotification(id: string): void
```

### Realtime Subscription
```text
Channel: 'notifications-{userId}'
Event: postgres_changes (INSERT)
Table: notifications
Filter: user_id=eq.{currentUserId}
```

### Dropdown Behavior
- Opens on click, closes on click-outside
- Maximum height of 400px with scroll
- Shows up to 20 most recent notifications
- "View all" link at bottom (future: dedicated notifications page)

---

## User Experience Flow

```text
1. User logs in
   |
2. NotificationBell loads existing notifications
   |
3. Realtime subscription starts
   |
4. When new opportunity is scraped:
   - process-listings creates notification
   - User sees badge count increase
   - Bell icon gets attention indicator
   |
5. User clicks bell
   - Dropdown shows notifications
   - Newest at top
   |
6. User clicks notification
   - Navigates to opportunity (map or detail view)
   - Notification marked as read
   - Count decreases
```

---

## Verification Points

After implementation:
1. Bell icon shows in navbar with unread count badge
2. Clicking bell opens dropdown with notifications list
3. Clicking a notification navigates appropriately
4. "Mark all as read" clears all notifications
5. New notifications appear in realtime when opportunities are created
6. Scraping admin panel remains functional (will verify during implementation)

