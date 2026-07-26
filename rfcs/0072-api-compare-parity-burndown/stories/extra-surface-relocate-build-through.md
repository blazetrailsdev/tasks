---
title: "extra-surface: relocate buildThroughAssociation/createThroughAssociation"
status: ready
updated: 2026-07-26
rfc: "0072-api-compare-parity-burndown"
cluster: extra-surface
deps: ["extra-surface-associations-engine-classify"]
deps-rfc: []
est-loc: 206
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Through-association build/create:

- `buildThroughAssociation` (`associations.ts:3048`, ~92 LOC) — JSDoc:
  "Mirrors: `ActiveRecord::Associations::HasOneThroughAssociation#build`".
  Rails' real definitions are `ThroughAssociation#build_record`
  (`vendor/rails/activerecord/lib/active_record/associations/through_association.rb:116`)
  and `HasManyThroughAssociation#build_record` (`has_many_through_association.rb:90`);
  verify which one this body actually is before naming it.
- `createThroughAssociation` (`associations.ts:3147`, ~114 LOC) — JSDoc:
  "Mirrors: `ActiveRecord::Associations::HasOneThroughAssociation#create`".

Target TS files: `packages/activerecord/src/associations/through-association.ts`
and/or `has-one-through-association.ts` / `has-many-through-association.ts`,
renamed to the Rails method verified above.

Neither has an importer outside `associations.ts`, so callers are local.

### Why relocation alone is not enough

`api:compare` matches a TS name to a Rails method by **name + Rails-layout
file**. Moving a body to `associations/*-association.ts` under its current
trails name only moves the extra; it does not clear it. Each name below must be
**renamed to the Rails method name AND placed in the Rails-layout file**.

None of `findTarget`, `buildRecord`, or `countRecords` exist yet under
`packages/activerecord/src/associations/` — the association classes are thin
shells that delegate INTO the `associations.ts` engine. So the direction is:
the body moves to the association class, and `associations.ts` imports it (or
the call site moves wholesale). Do NOT re-export from `associations.ts` under
the old name — that recreates the extra and adds an import cycle.

Parent classification: story `extra-surface-associations-engine-classify`
(RFC 0072), which classified `associations.ts`'s 26 novel extras into
(a) invention, (b) `@internal`/allowlist, (c) misplaced port. This is a (c).

## Acceptance criteria

- The named function(s) are gone from `packages/activerecord/src/associations.ts`
  and exist under their Rails method name in the Rails-layout TS file named above.
- `pnpm api:compare && pnpm api:extra --package activerecord --novel-only`
  shows the `associations.ts` novel count drop by exactly the number of names in
  this story. Record before/after in the PR body.
- If a name is re-exported from `packages/activerecord/src/index.ts`, drop that
  re-export — Rails does not expose these at the `ActiveRecord::` level.
- Association test files covering the moved behavior pass; no test renames.
- No `node:*` imports. No `process.*` references. Async fs only. camelCase only.
- Under the 500 LOC ceiling. NO stacked PRs — single PR from `main`.
