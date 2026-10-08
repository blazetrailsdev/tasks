---
title: "parity:api:calls compares a tagged constructor against the union of the inlined Rails initialize bodies"
status: draft
updated: 2026-10-08
rfc: "0186-module-initialize-inlined-into-constructors"
cluster: tooling
packages: ["scripts"]
deps: ["extractor-reads-inlined-from-tags-on-constructors"]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0186 § Design: a module's `initialize` is inlined into the constructor of each class that includes or prepends it, at the position Ruby's `super` occupies, and the constructor carries one `@inlinedFrom Module#initialize` tag per segment in chain order.

Today the call gate pairs a TS constructor with the Rails class's own `initialize` only. `Model`'s constructor carries `@missingRailsCall assign_attributes` (`packages/activemodel/src/model.ts:122`) although the call is made, because it is made in an `initialize` function the gate does not pair. The argument gate (`parity:api:calls:args`) shares the artifact.

## Acceptance criteria

- For a tagged constructor, the Rails call set is the class's own `initialize` (when it defines one) plus each tagged module's `initialize`, in tag order.
- A Rails `super` in one segment is treated as consumed by the next segment, not as a missing call.
- The call-argument gate reads the same union.
- Tests cover: one module; two modules in order; a class `initialize` plus a module; a tag whose body's call is dropped (red).
- Existing baselines are untouched; a row that becomes stale because of the union is deleted by hand in the conversion PR that causes it.
- Same-file module bodies join the union by convention, in ancestor order, with no tag; a test covers a same-file module, a cross-file one, and a class with both.
