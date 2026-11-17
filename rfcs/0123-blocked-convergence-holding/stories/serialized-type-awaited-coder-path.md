---
title: "serialized-type-awaited-coder-path"
status: draft
updated: 2026-11-17
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Prerequisite for `action-text-content-built-with-awaited-static-new` (operator ruling 2026-11-17: `ActionText::Content` gets an awaited `static async new`, and the serialized-attribute type grows an awaited coder path so `serialize :body, coder: ActionText::Content` reaches `await Content.new(...)` on load).

`packages/activerecord/lib/type/serialized.ts` calls `coder.load` synchronously in `deserialize` (Rails `vendor/rails/v8.0.2/activerecord/lib/active_record/type/serialized.rb:18-24`), in `isDefaultValue` (`:62-64`), and through `Mutable#cast` (`deserialize(serialize(value))`, `activemodel/lib/active_model/type/helpers/mutable.rb`) on assignment. Attribute readers and writers are sync, so a coder whose `load` returns a promise (ActionText's `Serialization.load` → `await Content.new`, `packages/actiontext/lib/serialization.ts`) has no awaited place to run.

## Acceptance criteria

- [ ] `Type::Serialized` supports a coder whose `load` / `dump` return a promise: records built from the database await such attributes during the async instantiate/find path, and assignment reaches an awaited writer (`setX()`), so the sync reader returns the loaded value.
- [ ] `isDefaultValue`'s `coder.load(nil)` stays synchronous-compatible for async coders.
- [ ] Tests in activerecord with an async coder over the canonical schema.
- [ ] Unblocks `action-text-content-built-with-awaited-static-new`.
