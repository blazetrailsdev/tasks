---
title: "extractor-resolve-call-dispatch-and-import-aliases"
status: claimed
updated: 2026-06-30
rfc: "0044-call-set-parity-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: null
claim: "2026-06-30T00:54:31Z"
assignee: "extractor-resolve-call-dispatch-and-import-aliases"
blocked-by: null
---

## Context

Several "Confirmed equivalent … the extractor does not follow the delegation /
aliased import" baseline entries in `scripts/api-compare/call-mismatches-exclude.json`
(and its wide sibling) are false positives caused by two general blind spots in
the call-set extractor (`scripts/api-compare/compare.ts` + the TS API extractor),
not by real omissions:

1. **`.call` / `.apply`-dispatched method calls.** The extractor only matches
   direct `receiver.method(...)` calls, so a ported method invoked indirectly is
   not credited. Example (PR #4287, touch-and-pessimistic-locking-cluster):
   `locking/pessimistic.ts` `withLock` calls `lockBang.call(instance, lockClause)`
   inside the wrapping transaction — `lockBang` IS the `lock!` port — but the
   `with_lock → lock!` pair still flags because `lockBang.call` is not resolved
   to the `lock!` ruby name. Mirrors pessimistic.rb `transaction { lock!(lock); yield }`.

2. **Aliased-import calls.** A call through an import renamed at the import site is
   not mapped back to the original name. Example (same PR): `touch-later.ts`
   `touchDeferredAttributes` calls `timestampTouch.call(this, { time }, ...)` where
   `timestampTouch` is `import { touch as timestampTouch } from "./timestamp.js"`,
   so `touch_deferred_attributes → touch` flags as missing. The autosave-association
   and dirty-tracking-changes-applied clusters carry several more entries of both
   shapes (each reason literally says "extractor does not follow the delegation").

These force manual "Confirmed equivalent" baseline rows that never shrink on their
own. Resolving them at the extractor lets the rows drop out of the artifact
automatically (the only-shrink ratchet then forces their removal) and cuts future
false-positive churn across RFC 0044 / 0047.

Distinct from cross-package-call-mismatch-false-positives (done, PR #4078), which
only scoped `SIGNIFICANT_CALLS` name-collisions — it does NOT touch `.call`
resolution or import-alias following.

## Acceptance criteria

- Extractor resolves `X.call(...)` / `X.apply(...)` to `X`'s call name so an
  indirect invocation of a ported method is credited to that method's call set.
- Extractor follows same-module import aliases (`import { a as b }` → calls to `b`
  count as `a`) when matching ported call names.
- Re-run `pnpm api:calls:reseed` + `pnpm api:calls:wide:reseed`: the now-detectable
  confirmed-equivalents (at minimum `with_lock → lock!` and
  `touch_deferred_attributes → touch`, plus any autosave/dirty-tracking rows that
  share these shapes) drop out of both baselines.
- **No real omission masked:** the conservative-by-design extractor must not gain
  false negatives. Verify with a before/after artifact diff (`output/call-mismatches.json`)
  and a manual spot-check that every newly-dropped row is a genuine equivalent
  (the `.call`/alias target is the ported method, not a coincidental name match).
- Net: the two baselines shrink; no DEFAULT_REASON or hand-justified row remains
  for a pattern the extractor can now detect.

## Hard rules

- NO `node:*` imports, NO `process.*` in the library surface, async fs only (matches
  the existing api-compare lint surface).
- 500 LOC ceiling. Single PR from main, no stacks.
- Reseed ONLY via the force-rebuild path (`pnpm api:calls:reseed` /
  `:wide:reseed`) — never hand-`--write` from a possibly-stale env.
