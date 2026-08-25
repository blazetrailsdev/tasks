---
title: "extra-surface: classify has-one-association.ts's 4 novel build/write hooks"
status: done
updated: 2026-08-03
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 5946
claim: "2026-08-03T01:15:48Z"
assignee: "extra-surface-has-one-base-build-hooks-classify"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while shipping `extra-surface-has-one-through-classify`.
`packages/activerecord/src/associations/has-one-association.ts` reports 4 novel
extras under `pnpm parity:api && pnpm parity:api:extra --package activerecord
--novel-only`:

```text
detachDisplacedTarget  loadTargetForBuild  needsTargetLoadForBuild  syncWrite
```

None of the four exists in
`vendor/rails/activerecord/lib/active_record/associations/has_one_association.rb`,
which declares `replace`, `delete`, `handle_dependency`, `nullify_owner_attributes`,
`remove_target!`, `set_new_record`, `_create_record`, `find_target`. The four
are the trails split of Rails' inline, synchronous `build_#{name}` /
`create_#{name}` / `#{name}=` bodies into separately-callable hooks the async
JS accessors can drive:

- `needsTargetLoadForBuild` / `loadTargetForBuild` — Rails' `find_target?` +
  inline `load_target` inside `build_#{name}`, split so
  `associations/builder/has-one.ts:68-78` can `await` the load before building.
- `detachDisplacedTarget` — Rails' `remove_target!` call inside `replace`,
  split so `nested-attributes.ts:743-747` and the sync builders can drive the
  removal out-of-line. `remove_target!` itself is already ported under its
  Rails name (`removeTargetBang`, has-one-association.ts:679).
- `syncWrite` — the in-memory half of Rails' `writer`, reached from the JS
  property setter (`builder/has-one.ts:138`), which cannot `await` the
  awaitable `writer`.

All four are public _because_ out-of-module callers drive them, so `protected`
(which is what the extractor honors — a JSDoc `@internal` on a CLASS MEMBER is
NOT read by `scripts/api-compare/extract-ts-api.ts:1868`, only
private/protected/`#` visibility is) is not available without also converging
those call sites.

`has-one-through-association.ts` overrides two of them
(`loadTargetForBuild`, `detachDisplacedTarget`) purely to neutralize/redirect
the base behaviour, so its own residual 2 novel extras disappear the moment the
base hooks do. That file's classification story deliberately left them counted
rather than tagging convergeable surface as allowed.

## Acceptance criteria

- Each of the four names is classified as (a) invention to delete, (b) faithful
  internal that can be made `protected`/`#` (with the call sites converged to
  reach it Rails' way), or (c) misplaced port to relocate + rename onto its
  Rails name.
- Convergeable names are actioned, not tagged `@noRailsEquivalent CONVERGEABLE`.
- `pnpm parity:api:extra --package activerecord --novel-only` shows
  `associations/has-one-association.ts` dropping by the number of names
  actioned, and `associations/has-one-through-association.ts` dropping its
  matching overrides; record before/after in the PR body.
- has_one and has_one_through association tests pass with no test renames.
