---
title: "require-canonical-rebuild: a non-literal restore list exempts every drop in the file"
status: done
updated: 2026-08-27
rfc: "0079-drop-rebuild-canonical-tables"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 7118
claim: "2026-08-27T13:28:57Z"
assignee: "require-canonical-rebuild-restore-arm-fails-open"
blocked-by: null
closed-reason: null
---

## Context

`require-canonical-rebuild` (`eslint/require-canonical-rebuild.mjs`) verifies
that a file dropping a canonical table restores it in the same file. Its
DROP-side detection gaps are enumerated and tracked (RFC 0070's
`require-canonical-rebuild-detection-gaps` /
`require-canonical-rebuild-over-approximation-burndown`). Its **RESTORE** side
has an over-permissive arm that none of those cover.

`rebuiltTableNames()` (`eslint/require-canonical-rebuild.mjs:13-24`) reads the
restore call's second argument and returns `null` unless it is an
`ArrayExpression` of static strings. At `:119-120` a `null` result sets
`restoresEverything = true`, and `:130` then returns early — exempting **every**
canonical drop in the file, not just the ones actually restored.

So a non-literal name list disables the check file-wide:

```ts
await rebuildCanonicalTables(adapter, names); // parameter
await rebuildCanonicalTables(adapter, TABLES); // module const
await rebuildCanonicalTables(adapter, [...a, ...b]); // spread
```

The rule's own `meta.docs.description` states the behaviour ("a
`rebuildCanonicalTables()` whose name list is not a literal array, which is
treated as restoring everything rather than guessed at"), so it is deliberate —
but "treated as restoring everything" is the permissive direction, and it is
reachable today. Two live files use a non-literal list:

- `packages/activerecord/src/adapters/abstract-mysql-adapter/schema.test.ts:14-17`
  — the `restoreCanonicalTables(names)` helper forwards a parameter.
- `packages/activerecord/src/reserved-word.test.ts:105` — passes the
  `CANONICAL_RESERVED_TABLES` module const.

Both happen to restore what they drop (verified 2026-08-27), so there is no
live escape — this is a latent hole, not a current bug. The failure mode it
permits: a file drops canonical `a` and `b`, restores only `a` through a helper
with a computed list, and lint stays silent while `b` is left dropped on the
shared per-worker database for whichever file runs next. That is exactly the
class of contamination RFC 0079's inventory spent its budget attributing.

Interacts with the new RFC 0079 ratchet
(`eslint/no-new-rebuild-canonical-tables.mjs`, PR #7112): the ratchet counts
call sites regardless of argument shape, so it is unaffected — but the two
rules are meant to be a closed pincer, and this is the seam.

## Converged shape

Resolve a non-literal name list where the rule already has the machinery to do
so, and fail closed where it does not:

1. Follow a module-level `const` initialized to an array literal (the
   `reserved-word.test.ts` shape) through the existing `resolve` helper from
   `createSweepBinding`, which the drop side already uses.
2. For a genuinely unresolvable list (a parameter, a spread, a function
   return), stop treating it as a full restore. Either report the drops it
   cannot prove restored, or require the caller to spell a literal array.
   Failing closed is the only direction consistent with the only-shrink
   discipline the surrounding baselines use.
3. `loadCanonicalSchema` keeps its genuine full-restore semantics
   (`FULL_RESTORE_CALLS`, `:9`) — that one really does lay the whole schema.

Note this rule is scheduled to be reworked into a plain ban on dropping
canonical tables outside the helper's own file by 0079's
`delete-rebuild-canonical-tables`. If that lands first, fold this in there
instead of fixing it twice — but do not let it close silently, because the
"ban" form still needs to decide what a non-literal restore means.

## Acceptance criteria

- A file whose only restore passes a non-literal name list no longer exempts
  its other canonical drops.
- A module-const array literal resolves to its names rather than falling into
  the full-restore arm.
- `abstract-mysql-adapter/schema.test.ts` and `reserved-word.test.ts` stay
  green (both genuinely restore what they drop).
- `eslint/require-canonical-rebuild.test.mjs` covers the parameter, module-const
  and spread shapes.
- The behaviour stated in `meta.docs.description` is updated to match.
