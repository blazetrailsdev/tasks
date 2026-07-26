---
title: "extra-surface: relocate touchBelongsToParents and fireAssocCallbacks"
status: ready
updated: 2026-07-26
rfc: "0072-api-compare-parity-burndown"
cluster: extra-surface
deps: ["extra-surface-associations-engine-classify"]
deps-rfc: []
est-loc: 65
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Two small lifecycle functions:

- `touchBelongsToParents` (`associations.ts:3893`, ~35 LOC) — Rails home
  `Builder::BelongsTo.touch_record` / `.add_touch_callbacks`
  (`vendor/rails/activerecord/lib/active_record/associations/builder/belongs_to.rb:44`
  and `:79`). Target TS file:
  `packages/activerecord/src/associations/builder/belongs-to.ts`, renamed to
  `touchRecord`. Re-exported from `index.ts:62` — drop that.
- `fireAssocCallbacks` (`associations.ts:3018`, ~31 LOC) — Rails home
  `CollectionAssociation#callback`
  (`vendor/rails/activerecord/lib/active_record/associations/collection_association.rb:492`,
  with `callbacks_for` at `:498`). Target TS file:
  `packages/activerecord/src/associations/collection-association.ts`, renamed to
  `callback`. Importers: `associations/collection-proxy.ts`,
  `associations/builder/collection-association.ts`.

Both are small; they fit comfortably in one PR together.

Line numbers are as of the merge of the classification PR (#5341). If they
have drifted, re-derive with
`grep -n '^export \(async \)\?function <name>' packages/activerecord/src/associations.ts`.

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
