---
title: "extra-surface: relocate loadBelongsTo to BelongsToAssociation#findTarget"
status: ready
updated: 2026-07-26
rfc: "0072-api-compare-parity-burndown"
cluster: extra-surface
deps: ["extra-surface-associations-engine-classify"]
deps-rfc: []
est-loc: 210
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`loadBelongsTo` (`associations.ts:1425`, ~210 LOC) is the belongs_to target
load. Rails home: `ActiveRecord::Associations::Association#find_target`
(`vendor/rails/activerecord/lib/active_record/associations/association.rb:248`)
as specialized by `BelongsToAssociation` (`belongs_to_association.rb`, with the
`find_target?` gate at `:124`).

Target TS file: `packages/activerecord/src/associations/belongs-to-association.ts`
(and/or `singular-association.ts` for the shared `find_target` at
`singular_association.rb:47`), renamed to `findTarget`.

Note `loadBelongsTo` is ALSO a generated instance-method name on models
(`post.loadBelongsTo("author")`, see `associations/singular-association.ts:57`)
— that reader sugar is separate trails surface and is out of scope here; only
the exported engine function moves.

`loadBelongsTo` is re-exported from `index.ts:52` — drop that.

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
