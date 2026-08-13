---
title: "call-args-tool-pairing-ties-strand-blockpass-sites"
status: done
updated: 2026-08-13
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6490
claim: "2026-08-13T19:25:38Z"
assignee: "call-args-tool-pairing-ties-strand-blockpass-sites"
blocked-by: null
closed-reason: null
---

## Context

Filed from PR #6349-family work (RFC 0099 comparator stories), which replaced
the call-argument comparator's source-order zip of same-named call occurrences
with a best-argument-similarity assignment (`pairCallSites`,
`scripts/api-compare/call-args.ts`).

One residual case survives, and it is a pairing artifact rather than a port
divergence. `relation/predicate_builder.rb:100` calls
`table.associated_table(key, &block)` and `:108` calls
`table.associated_table(key)`. The port mirrors both —
`packages/activerecord/src/relation/predicate-builder.ts:121` passes `block`,
`:133` does not. Both Ruby occurrences describe as `(id:key)` (Ruby drops a
`&block` from the argument list and records a `blockpass` FLAG instead), so
they agree with the two TS sites equally and the greedy assignment can pair the
block-less Ruby site against the block-carrying TS site. The result is a
`shape` row for a body that is correct, baselined as
`activerecord/relation/predicate-builder.json` `expand_from_hash` /
`associated_table` / `["ref:key"]`.

A diagonal (source-position proximity) tie-break was tried and rejected in that
PR: it retired this row but stranded four other bodies the same way, for a net
worse result.

## Acceptance criteria

1. Two same-named Ruby occurrences that differ only in a per-site FLAG
   (`blockpass`, `splat`, `block`) are not interchangeable in the assignment —
   the flagged occurrence prefers the TS site whose argument list carries the
   corresponding argument.
2. The baselined row above goes stale and is deleted from
   `scripts/api-compare/call-mismatches-exclude/activerecord/relation/predicate-builder.json`.
3. `pnpm parity:api:calls:args` is green, the total row count does not
   increase, and no other body newly flags.
