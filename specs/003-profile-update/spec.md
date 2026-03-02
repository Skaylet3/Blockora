# Feature Specification: User Profile Update

**Feature Branch**: `003-profile-update`
**Created**: 2026-03-02
**Status**: Draft
**Input**: User description: "there's profile edit function on the frontend but there's no this on the backend, we need to add this function to the backend and integrate it to the frontend. That function must change only the name of the user, that 'displayName' field, on the frontend just add field called 'Name' and integrate that 'save' button to be updating the profile with that data, but make it future proof for other fields, don't make it one field proof only, just imagine we have more that one field to change."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Edit Display Name (Priority: P1)

A logged-in user navigates to their Profile Settings page. They see a "Name" field pre-populated
with their current display name (if one exists). They type a new name and click Save. The name
is persisted and reflected immediately in the UI without a full page reload.

**Why this priority**: This is the core deliverable of the feature — giving users the ability to
personalize their identity within the application. Without it, the profile page is purely
decorative.

**Independent Test**: Open the Profile Settings page while authenticated, enter a name in the
"Name" field, click Save, reload the page, and verify the name is still shown.

**Acceptance Scenarios**:

1. **Given** the user is authenticated and on the Profile Settings page, **When** they enter a
   valid name and click Save, **Then** the name is persisted and shown in the Name field after
   the save completes.
2. **Given** the user already has a display name set, **When** they open the Profile Settings
   page, **Then** the Name field is pre-populated with their current display name.
3. **Given** the user clears the Name field and clicks Save, **Then** the system accepts an
   empty display name (name is optional) and the field remains blank on reload.
4. **Given** the user enters a name and clicks Cancel, **Then** any unsaved changes are
   discarded and the field reverts to the previously saved value.

---

### User Story 2 - Extensible Profile Fields (Priority: P2)

The profile update mechanism is designed to accept multiple profile fields in a single save
operation. When additional editable fields are introduced in future (e.g., bio, avatar URL,
time zone), the same Save action and underlying API contract can carry them without requiring
architectural changes.

**Why this priority**: The user explicitly requested a future-proof design. This story does not
require implementing new fields now — it governs how the system is structured so new fields
cost less to add later. It is a constraint on the P1 implementation, not a separate deliverable.

**Independent Test**: Adding a second editable profile field (e.g., "Bio") requires only: (a)
adding the field to the UI form, (b) including it in the update request payload, and (c) adding
it to the backend validation schema — with no changes to API routing, controller signatures, or
frontend wiring logic.

**Acceptance Scenarios**:

1. **Given** the profile update API contract, **When** a new optional field is added to the
   request payload, **Then** the system accepts it without breaking existing clients that
   do not send the new field.
2. **Given** a partial update payload (only some fields provided), **When** the save is
   triggered, **Then** only the provided fields are updated; omitted fields retain their
   current values.

---

### Edge Cases

- What happens when the Name field contains only whitespace? The system MUST trim leading and
  trailing whitespace before saving; a whitespace-only name MUST be treated as empty.
- What happens if the save request fails due to a network error? The UI MUST display a clear
  error message and allow the user to retry without losing their entered value.
- What happens if the user submits the form with no changes made? The save action completes
  normally (no error) and the existing values are retained.
- What happens if the Name field exceeds a maximum length? The system MUST reject names longer
  than 100 characters with a clear validation message shown in the UI.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Profile Settings page MUST display an editable "Name" field mapped to the
  user's display name.
- **FR-002**: The "Name" field MUST be pre-populated with the user's current display name when
  the page loads.
- **FR-003**: The Save button MUST submit a profile update request and persist all provided
  field values to the system.
- **FR-004**: The system MUST expose a profile update endpoint that accepts a partial payload —
  only fields included in the request are updated; absent fields retain their current values.
- **FR-005**: The profile update endpoint MUST require authentication; unauthenticated requests
  MUST be rejected.
- **FR-006**: The profile retrieval endpoint MUST return the user's `displayName` so the
  frontend can pre-populate the form on load.
- **FR-007**: Display names MUST be trimmed of leading/trailing whitespace before persistence.
- **FR-008**: Display names MUST be limited to a maximum of 100 characters; requests exceeding
  this limit MUST be rejected with a descriptive validation error.
- **FR-009**: Display names MUST be optional — saving with an empty name MUST be accepted.
- **FR-010**: The Cancel button MUST discard unsaved changes and restore the form to its last
  saved state without making a server request.
- **FR-011**: The frontend MUST display a success notification when the save completes.
- **FR-012**: The frontend MUST display a clear error notification when the save fails,
  preserving the user's entered values so they are not lost.

### Key Entities

- **User**: An authenticated account. Has a `displayName` (optional, ≤100 characters) that is
  independently mutable without affecting authentication credentials (email, password).
- **Profile Update Payload**: A partial record of mutable user profile fields. Currently
  supports `displayName`. Designed to accept additional optional fields in future iterations
  without breaking clients that send only a subset of fields.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can update their display name from the Profile Settings page in under
  30 seconds from page load to visible save confirmation.
- **SC-002**: After saving, the updated name is visible in the Name field without requiring a
  manual page refresh.
- **SC-003**: The profile form pre-populates correctly with the user's existing display name
  on 100% of authenticated page loads where a name has previously been saved.
- **SC-004**: An invalid update (e.g., name exceeding 100 characters) is rejected with a
  user-readable validation message — not a generic or raw server error.
- **SC-005**: Adding a second editable profile field in a future iteration requires changes
  only to the form UI, the payload shape, and the backend validation schema — no changes to
  API routing, authentication middleware, or controller wiring.

## Assumptions

- Email is intentionally read-only and excluded from the profile update scope; changing email
  requires a separate, security-sensitive flow that is out of scope for this feature.
- Authentication credentials (password) are not changed via this endpoint.
- The existing user profile retrieval endpoint will be extended to return `displayName`; no
  separate profile retrieval endpoint is required.
- The frontend Profile Settings page already exists and renders — this feature wires it to
  real data and replaces the current placeholder save behaviour.
