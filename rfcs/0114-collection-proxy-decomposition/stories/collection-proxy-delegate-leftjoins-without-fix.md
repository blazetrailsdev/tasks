---
title: "collection-proxy-delegate-leftjoins-without-fix"
status: claimed
updated: 2026-08-20
rfc: "0114-collection-proxy-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-08-20T01:22:34Z"
assignee: "collection-proxy-delegate-leftjoins-without-fix"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/associations/collection-proxy.ts`'s delegate-to-scope
list derivation (see `delegate-list-from-mixin-keys-bakeoff-sonnet`,
`vendor/rails/activerecord/lib/active_record/associations/collection_proxy.rb:1128-1137`)
was changed to derive names from `QueryMethodBangs`' and `SpawnMethods`' own
keys instead of a hand-transcribed list. That derivation surfaced real drift
between the old hand-list and Rails' actual `public_instance_methods(false)`
that the parent story's byte-identical acceptance criteria required be kept
out of that PR:

- **Missing delegation**: `leftJoins` and `without` are public aliases in
  Rails (`alias :left_joins :left_outer_joins` at
  `vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:887`,
  `alias :without :excluding` at `query_methods.rb:1585`) and so are part of
  `QueryMethods.public_instance_methods(false)`, which Rails delegates to
  `scope` via `collection_proxy.rb:1128-1137`. trails' hand-list never
  included either name, so `CollectionProxy#leftJoins` / `#without` never
  delegated to the association scope.
- **Dead delegate names**: the old hand-list carried `nullBang`, `rewhereBang`,
  and `selectBang`, none of which correspond to a real trails method
  (`Object.keys(QueryMethodBangs)` has no such keys) or a real Rails method
  (Rails has no `null!`/`rewhere!`, and the real alias is `_select!`, not
  `select!` — `query_methods.rb:428`). Calling any of the three on a
  `CollectionProxy` throws (`scope[name]` is `undefined`). Grepped the
  package for callers of `.nullBang`/`.rewhereBang`/`.selectBang` on a
  `CollectionProxy`/`Relation` — none found.

## Acceptance criteria

- Add `leftJoins` and `without` to the delegated-to-scope set on
  `CollectionProxy` (they should call through to `scope().leftJoins(...)` /
  `scope().without(...)`).
- Remove `nullBang`, `rewhereBang`, and `selectBang` from the delegated set —
  they never resolved to anything and match no real Rails or trails method.
- Add or extend regression coverage exercising `CollectionProxy#leftJoins` and
  `#without` against an association scope.
- `pnpm parity:api:calls` / `:args` add zero rows for this file.
- `pnpm parity:api` / `pnpm parity:test` deltas non-negative.
