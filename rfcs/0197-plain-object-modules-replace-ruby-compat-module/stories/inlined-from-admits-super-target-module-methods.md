---
title: "@inlinedFrom admits the module method a super chain reaches (Deduplicable#deduplicated)"
status: draft
updated: 2026-10-20
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

CLAUDE.md, "A module method's `super` is inlined the same way", says `C#foo` carries one `@inlinedFrom` per segment from another Ruby file, until a body makes no `super` call. That includes the last segment, the body the `super` reaches.

`scripts/api-compare/lint-inlined-from.ts` rejects a tag naming a module method whose Rails body calls no `super`. So the four `deduplicated` inlinings from trails#9099 cannot be tagged:

- `connection-adapters/column.ts`
- `sql-type-metadata.ts`
- `mysql/type-metadata.ts`
- `postgresql/type-metadata.ts`

Each inlines `ActiveRecord::ConnectionAdapters::Deduplicable#deduplicated` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/deduplicable.rb:24-26`, `freeze`), which their Rails `deduplicated` reaches through `super`.

trails#9140 made the extractor record spans for super-calling module methods only.

## Acceptance criteria

- [ ] The inlined-from gate admits a tag naming a module method that a tagged or own `super` chain reaches, and still rejects one no chain reaches.
- [ ] The extractor records `endLine` / `vendorFile` for such a super-target method.
- [ ] The four `deduplicated` sites carry the tag, and `pnpm parity:api:inlined` passes.
