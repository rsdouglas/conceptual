# callLLM

**Type:** Domain Service
**Bounded Context:** Concept Generation
**Aggregate Root:** No

---

## 1. Definition

**Short Description:**

Service function that interacts with an external Large Language Model API to generate conceptual documentation and responses.

**Ubiquitous Language:**

callLLM refers specifically to the domain service responsible for sending prompts and receiving responses from an LLM API, typically OpenAI or similar, to support conceptual modeling and documentation generation.

---

## 2. Structure

### Fields

- `env: LLMEnv` — Configuration and credentials for accessing the LLM API, including apiKey, optional baseUrl, and model identifier.
- `messages: LLMMessage[]` — An ordered list of messages representing the conversation context sent to the LLM, each with a role and content.
- `options: CallLlmOptions` — Optional parameters controlling response format such as plain text or structured JSON.

### Relationships

- callLLM depends on external Large Language Model API services to fulfill requests.
- callLLM is used by higher-level domain services such as Concept Generation Service to produce conceptual documentation.
