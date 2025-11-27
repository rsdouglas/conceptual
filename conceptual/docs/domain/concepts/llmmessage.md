# LLMMessage

**Type:** Value Object
**Bounded Context:** Large Language Model Integration
**Aggregate Root:** No

---

## 1. Definition

**Short Description:**

Represents a message exchanged with the Large Language Model API, encapsulating the role and content of the message.

**Ubiquitous Language:**

LLMMessage refers specifically to the structured message format used in communication with the LLM API. Roles are limited to 'system' or 'user'. It excludes any other message types or metadata beyond role and content.

---

## 2. Structure

### Fields

- `role: 'system' | 'user'` — Defines the origin or intent of the message in the LLM conversation context.
- `content: string` — The textual content of the message sent to or received from the LLM.

### Relationships

_None inferred_

---

## 4. Invariants

- **role must be either 'system' or 'user'** (Ensures message role consistency for LLM API compatibility.)
- **content must be a non-empty string** (Messages must contain meaningful textual content.)

---

## 7. Implementation

- **LLMMessage interface definition:** `src/core/llm.ts`
