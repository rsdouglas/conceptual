# Concept Modeling Guide

## Overview

This guide explains when to use **ConceptModels**, **ModelViews**, and **StoryViews** when modeling systems. It is designed to help maintain clarity, avoid fragmentation, and keep core concepts consistent across products and subsystems.

---

## Core Principle

For **a single product or system**, create:

* **One ConceptModel** (the complete domain graph)
* **Multiple ModelViews** (focused slices of that graph)
* **Multiple StoryViews** (narrative walkthroughs of scenarios)

This ensures:

* A single shared vocabulary
* Central concepts (like `data-request`) are defined once
* Clean, focused diagrams for different audiences or contexts

**Default rule: ONE ConceptModel per product.**

---

## When to Use Multiple ConceptModels

Use additional ConceptModels only when the graphs represent **truly different worlds**.

### 1. Different Products in a Monorepo

Even if they share code, products with different purposes deserve separate ConceptModels.
Examples:

* Slack Data Request Bot
* Potato Meeting Assistant
* Conceptual Tool (model editor)

### 2. Different Ontologies / Modeling Languages

Some systems need multiple modeling layers.
Examples:

* **Domain model**: Data Request, Check, Template, Test Run
* **Runtime model**: Worker, Durable Object, Queue, Firestore Document

Keep these as separate ConceptModels.

### 3. Current vs Future System States

Redesigns often reshape core concepts and relationships.
Examples:

* `Current State Model`
* `Target State Model`

Use separate ConceptModels to avoid mixing incompatible representations.

### 4. Reusable Shared Models

Some models act as shared libraries.
Examples:

* Slack Platform Concepts
* Organization / Roles / Permissions
* LLM Request/Response Pattern

These should be kept as standalone ConceptModels and referenced with `externalRefs`.

### 5. Organizational Boundaries

If two teams own separate subsystems that evolve independently, separate models make ownership and updates clearer.

---

## When *Not* to Use Multiple ConceptModels

Avoid creating multiple ConceptModels when the system is *actually one product*, even if it contains multiple functional areas.

Examples that should stay inside **one** ConceptModel:

* Slack ingestion
* LLM orchestration
* Eval UI
* Datastore representation
* Admin UI
* Security / roles

These become **ModelViews** of a single unified ConceptModel.

---

## Definitions

### ConceptModel

A complete ontology describing a whole system or product.
Use sparingly—only when the system truly stands alone.

### ModelView

A focused subset of a ConceptModel.
Use for:

* Diagrams
* Subdomains
* Perspectives for different teams
* High-level vs. detailed slices

### StoryView

A sequential narrative over the model.
Use to explain scenarios:

* "Simple Slack request"
* "Re-evaluation after failed test run"
* "Admin updates a template"

---

## Decision Flow (Cheat Sheet)

**Is it the same product/system?**
→ One ConceptModel, use ModelViews.

**Is it a totally different system?**
→ Separate ConceptModel.

**Is it the same system but different perspective?**
→ ModelView.

**Is it explaining a flow over time?**
→ StoryView.

**Is it a shared reusable ontology?**
→ Separate ConceptModel, reference via `externalRefs`.

---

## TL;DR

> **If it’s one system → one ConceptModel.**
> **If it’s a different system → different ConceptModel.**
> **If it’s a slice of the system → ModelView.**
> **If it’s a narrative → StoryView.**
> **If it’s reusable across systems → library ConceptModel.**

Keep models coherent, concepts consistent, and diagrams meaningful.
