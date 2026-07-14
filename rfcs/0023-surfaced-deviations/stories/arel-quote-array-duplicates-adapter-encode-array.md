---
title: "Arel quoteArrayLiteral duplicates the adapter's encodeArray and drifts from it"
status: draft
updated: 2026-07-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #4869 (`converge-arel-array-booleans-to-unquoted-true`), which
had to fix a boolean divergence in **one** of two independent PG array encoders.

trails has two implementations of Rails' `encode_array` -> `type_cast_array` ->
`type_cast` chain:

1. **The real adapter path** —
   `packages/activerecord/src/connection-adapters/postgresql/quoting.ts`:
   `quote(ArrayData)` -> `encodeArray` (`:415`) -> `typeCastArray` (`:441`) ->
   `typeCast` -> `unquotedTrue()`. This is a faithful port: it uses a real
   encoder object (`arrayData.encoder.encode(values)`) and honours the subtype
   delimiter.
2. **The Arel-side copy** — `packages/arel/src/quote-array.ts`
   (`quoteArrayLiteral`), reached only from `postgresqlDefaultQuoter` in
   `visitors/default-quoter.ts`. This is trails-invented residue: it exists
   because connection-less visitors (`new Visitors.PostgreSQL()`) have no
   adapter to delegate to, and #4868 documented the quoting hosts as the
   accepted residue of that convergence.

**Evidence they drift:** the boolean cast arm was correct in (1) and wrong in
(2) — (2) hard-coded `TRUE`/`FALSE` where `type_cast` uses
`unquoted_true`/`unquoted_false`. #4872 then re-derived the encoder's
quote-by-content rule in (2), which (1) gets for free from the real encoder.
Three PRs (#4867, #4872, #4869) have now each patched (2) to re-converge it on
behaviour (1) already had. The duplication is the hazard, not any one of the
fixes.

Note this is NOT a request to re-litigate #4868 — the hosts are accepted residue
for the debug path. The question is narrower: whether the _array-literal
encoding_ specifically can be shared with, or delegated to, the adapter's
`encodeArray` rather than re-implemented, so the two cannot drift again.

## Acceptance criteria

- [ ] Decide and record: share the encoding with the adapter's `encodeArray`,
      or keep the copy and pin it against (1) with a test that fails if they
      disagree.
- [ ] If shared: `postgresqlDefaultQuoter`'s array path produces byte-identical
      output to `quote(ArrayData)` for booleans, dates, nested arrays, NULL,
      and the quote-by-content cases in `quote-array.test.ts`.
- [ ] No behaviour change on either path — this is de-duplication, not a fix.
- [ ] api:compare / test:compare delta non-negative.

## Notes

Fidelity/structural. Blast radius of (2) is the connection-less `Node#toSql()`
debug path only, so this is low-urgency — file-and-triage, not a live bug.
