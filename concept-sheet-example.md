# Meeting

**Type:** Entity  
**Bounded Context:** Meetings  
**Aggregate Root:** Yes

## 1. Definition

**Short description:**  
A scheduled or ongoing interaction between participants where agents may observe, summarize, and create action items.

**Ubiquitous language:**  
- "Meeting" refers to a specific scheduled call (not a recurring series).  
- “Live meeting” = meeting with status `in_progress`.

## 2. Structure

**Fields:**
- `id: MeetingId` (UUID, immutable)
- `workspaceId: WorkspaceId`
- `topic: string`
- `timeRange: TimeRange` (Value Object)
- `status: MeetingStatus` = `scheduled | in_progress | completed | cancelled`
- `participants: Participant[]`
- `summaryId?: SummaryId`
- `externalIds?: { zoom?: string; meet?: string; }`

**Relationships:**
- Belongs to `Workspace`
- Has many `Participants`
- Has at most one `Summary`
- References external call by provider-specific IDs

## 3. Lifecycle

**States:**
- `scheduled`
- `in_progress`
- `completed`
- `cancelled`

**Valid transitions:**
- `scheduled → in_progress`
- `scheduled → cancelled`
- `in_progress → completed`
- `in_progress → cancelled`

## 4. Invariants / rules

- `timeRange.end > timeRange.start`
- `status = completed` ⇒ `summaryId` MAY be set but is not required.
- A meeting with `status != scheduled` cannot change `timeRange`.
- Only future meetings can be cancelled.

## 5. Commands (use cases touching Meeting)

- `ScheduleMeeting`
- `StartMeeting`
- `CompleteMeeting`
- `CancelMeeting`
- `RegenerateSummary`

## 6. Events

- `MeetingScheduled`
- `MeetingStarted`
- `MeetingCompleted`
- `MeetingCancelled`
- `MeetingSummaryGenerated`

## 7. Implementation links

- **Domain class:** `apps/core/domain/meetings/Meeting.ts`
- **Repository:** `apps/core/infra/d1/MeetingRepository.ts`
- **DB schema:** `schema.sql: meetings` table
- **API types:** `@api/contracts/meeting.ts` (`MeetingDto`)
