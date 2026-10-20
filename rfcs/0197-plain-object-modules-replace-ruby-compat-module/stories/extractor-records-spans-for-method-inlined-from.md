---
title: "Extractor records def spans for method-level @inlinedFrom (not only initialize/new)"
status: claimed
updated: 2026-10-20
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-10-20T14:18:13Z"
assignee: "ar-type-remaining-src-part-2"
blocked-by: null
closed-reason: null
---

## Context

`inlined-from-admits-module-super-segments-on-methods` is marked done, but on trails main the Ruby extractor still records `endLine` / `vendorFile` only for `INLINED_HOOKS = %w[initialize new]` (`scripts/api-compare/extract-ruby-api.rb:261`, used at `:914-919`). So a method-level tag such as `@inlinedFrom ActiveRecord::ConnectionAdapters::Deduplicable#deduplicated rails/v8.0.2/activerecord/lib/active_record/connection_adapters/deduplicable.rb:24-26` makes `pnpm parity:api` throw in `scripts/api-compare/inlined-bodies.ts:31-35` ("has no vendorFile"). trails#9099 shipped four `deduplicated` inlinings untagged for this reason: `column.ts`, `sql-type-metadata.ts`, `mysql/type-metadata.ts`, `postgresql/type-metadata.ts`.

## Acceptance criteria

- The extractor records `endLine` and `vendorFile` for every module instance method whose body calls `super` (or for every method cited by a tag), not only `initialize` / `new`.
- A method-level `@inlinedFrom Mod#meth <citation>` passes `pnpm parity:api` and `pnpm parity:api:inlined`, and the gate checks its citation span.
- Tests cover a method-level tag in `scripts/api-compare/inlined-bodies.test.ts`.
