# Concept Sheet Template (Annotated)

# **Concept Name**
> e.g., “Meeting”, “Agent”, “Workspace”
> This should be the domain name of the core concept. One concept per sheet.

---

## **Metadata**

### **Type:**  
> Entity / Value Object / Aggregate Root / Domain Service  
> **Why:** Clarifies the role the concept plays in the domain model.  
> **How to choose:**  
> - Entity → has identity & changes over time  
> - Value Object → no identity, defined by value, immutable  
> - Aggregate Root → entity that controls invariants for a cluster  
> - Domain Service → logic that doesn’t belong to an entity  

### **Bounded Context:**  
> The domain area this concept belongs to (e.g., Meetings, Billing, Agents).  
> **Why:** Prevents conceptual overload and keeps models modular.  

### **Aggregate Root:** Yes / No
> Only relevant for entities.
> **Why:** Defines the consistency boundary & what invariants it controls.

### **Criticality:** Core / Supporting / Experimental
> How essential this concept is to the business.
> **Why:** Helps prioritize development and documentation efforts.
> - Core: Essential business functionality
> - Supporting: Important but not core business value
> - Experimental: New concepts being explored

---

# **1. Definition**

### **Short Description:**  
> A one-sentence, plain-English definition.  
> **Why:** Ensures shared understanding across engineering/product.  

### **Ubiquitous Language:**  
> Precise meaning, acceptable synonyms, exclusions.  
> **Why:** Prevents terminology drift.  
> **Fill when:** The term is overloaded or ambiguous.  

---

# **2. Structure (Fields & Relationships)**

### **Fields:**  
> List only domain-relevant properties — avoid implementation/ORM details.  
> Use Value Objects where appropriate.  
>
> Example:  
> - `id: MeetingId`  
> - `topic: string`  
> - `timeRange: TimeRange`  
>
> **Why:** Shows the conceptual structure, not the database schema.  

### **Relationships:**  
> Describe domain relationships without referencing FK constraints.  
>
> Example:  
> - Belongs to `Workspace`  
> - Has many `Participants`  
>
> **Why:** Shows how concepts connect meaningfully, not technically.  

---

# **3. Lifecycle**

### **States:**  
> Enumerate valid lifecycle states (if applicable).  
>
> Example:  
> - `scheduled`  
> - `in_progress`  
> - `completed`  
>
> **Why:** Clarifies dynamic behavior of the concept.  

### **Valid Transitions:**  
> Define legal state changes.  
>
> Example:  
> - `scheduled → in_progress`  
> - `in_progress → completed`  
>
> **Why:** Encodes invariants & prevents invalid transitions in code.  

---

# **4. Invariants / Rules**  
> Non-negotiable business rules that must always hold true.  
>
> Examples:  
> - End time must be after start time  
> - Cancelled meetings cannot restart  
>
> **Why:** Central authoritative list for business logic.  

---

# **5. Commands (Use Cases)**  
> List actions that modify or meaningfully interact with this concept.  
>
> Example:  
> - `ScheduleMeeting`  
> - `StartMeeting`  
> - `CompleteMeeting`  
>
> **Why:** Shows how the outside world is allowed to interact with it.  
> **Exclude if:** Concept is a pure immutable Value Object.  

---

# **6. Events**  
> Domain events this concept emits when significant things happen.  
>
> Example:  
> - `MeetingScheduled`  
> - `MeetingStarted`  
> - `MeetingCompleted`  
>
> **Why:** Supports async workflows, integrations, analytics, agent triggers.  

---

# **7. Implementation Links**  
> Pointers to actual code, schema, types, tests.  
>
> Example:  
> - Domain class: `domain/meetings/Meeting.ts`  
> - Repository: `infra/db/D1MeetingRepository.ts`  
> - Schema: `db/schema.sql`  
> - API DTO: `contracts/MeetingDto.ts`  
>
> **Why:** Prevents documentation drift & accelerates onboarding.  

---

# **Notes / Open Questions (Optional)**  
> Capture unresolved modeling questions or future improvements.  
