# Quickstart: Todo Frontend Integration

**Feature**: 001-todo-frontend-integration
**Date**: 2026-03-05

Manual integration test scenarios to verify the feature works end-to-end.

---

## Prerequisites

- Backend running with `006-todo-api` changes deployed
- Frontend running locally (`yarn dev` in apps/web)
- Logged-in user account available

---

## Scenario 1: Todo Page Loads Real Data

1. Open `/todo` in browser
2. **Expect**: Loading skeleton shown briefly, then real todos appear (or empty state if none)
3. Refresh the page
4. **Expect**: Same todos still shown (data is persisted, not mock)

---

## Scenario 2: Create Todo via FAB

1. On `/todo`, click the floating + button (bottom-right)
2. **Expect**: A dialog opens with Title, Description, and Priority fields
3. Enter title "Integration test todo", leave description empty, leave priority as default
4. Click Save/Create
5. **Expect**: Dialog closes, new todo appears at top of list with "Lowest" priority indicator
6. Refresh page
7. **Expect**: Todo still visible

---

## Scenario 3: Toggle Completion

1. On `/todo`, click the checkbox on any active todo
2. **Expect**: Checkbox immediately fills green (optimistic), todo moves toward bottom or stays (based on filter)
3. Switch to "Completed" filter tab
4. **Expect**: The toggled todo appears there
5. Refresh page
6. **Expect**: Todo still shows as completed in the Completed tab

---

## Scenario 4: Edit Todo

1. Hover over a todo card, click the Edit (pencil) icon
2. Change the title, click Save
3. **Expect**: Title updates immediately in the list
4. Click the todo to open the detail modal
5. Click the title text to enter edit mode in modal
6. Change description, click Save
7. **Expect**: Description updates
8. Refresh page — **Expect**: Changes persist

---

## Scenario 5: Change Priority

1. Click any todo to open the detail modal
2. Change the Priority dropdown (e.g., from Lowest to Highest)
3. **Expect**: Priority color indicator updates (red = Highest, zinc = Lowest)
4. Close modal, reopen it
5. **Expect**: Priority still shows Highest
6. Refresh page — **Expect**: Priority persists

---

## Scenario 6: Delete Todo

1. Click any todo to open the detail modal
2. Click the red "Delete" button
3. **Expect**: Modal closes, todo removed from list
4. Refresh page — **Expect**: Todo is gone

---

## Scenario 7: Filter Tabs

1. Have at least one active and one completed todo
2. Click "Active" filter tab
3. **Expect**: Only active todos shown
4. Click "Completed" tab
5. **Expect**: Only completed todos shown
6. Click "All" tab
7. **Expect**: All todos shown

---

## Scenario 8: Block Promotion End-to-End

1. Navigate to `/blocks`
2. Filter by type "Task" or find a TASK-type block
3. Click the ListTodo icon (green on hover) on a TASK block card
4. **Expect**: Toast "Added to todo list" appears
5. Navigate to `/todo`
6. **Expect**: The block's title appears as a new todo with Lowest priority
7. Refresh page — **Expect**: Promoted todo persists

---

## Scenario 9: Error Handling

1. Disconnect from the internet (or stop the API server)
2. Open `/todo`
3. **Expect**: Error state shown with a "Retry" button
4. Click Retry
5. **Expect**: Attempt made again (fails again since disconnected)
6. Reconnect, click Retry
7. **Expect**: Todos load successfully

---

## Scenario 10: Filter Persistence on Create

1. Switch to "Active" filter tab (no todos shown if all completed)
2. Click FAB, create a new todo
3. **Expect**: New todo appears (it's ACTIVE, matches the filter)
4. Switch to "Completed" tab, create another todo
5. **Expect**: New todo NOT in the completed list (it's ACTIVE, doesn't match) — or auto-switch to All
