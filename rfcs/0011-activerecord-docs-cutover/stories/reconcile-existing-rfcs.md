---
title: "Reconcile + close RFCs 0001–0010"
status: done
rfc: "0011-activerecord-docs-cutover"
cluster: reconcile
deps: ["reconcile-tooling"]
deps-rfc: []
est-loc: 150
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Run the reconcile report and apply it: make every story in 0001–0010 reflect
reality, and close RFCs whose work is all shipped. Automated first, then manual
for the residue. See RFC 0011 §Phase 1.

## Acceptance criteria

- [ ] `reconcile.mjs` run across all of 0001–0010; report archived in the PR.
- [ ] Every `likely-done` story flipped to `status: done` with its `pr:`,
      after a manual spot-check of the evidence.
- [ ] Every `blocked` story's blocker re-verified to still exist; unblocked
      ones flipped to `ready`.
- [ ] Every `unknown` story manually triaged to `done` / `ready` / `blocked`.
- [ ] Any RFC whose stories are all `done` set to `status: closed`.
- [ ] Status flips committed direct-to-main (no PR gate on story status).

## Notes

This is the validation pass that makes `tasks ready` trustworthy again. Lean on
the memory index for the AR features known to have shipped.

## Result (2026-06-04)

Baseline **4 done / 39 ready / 15 draft / 11 blocked** → **19 done / 31 ready /
10 draft / 8 blocked**. Closed RFCs **0001, 0004, 0007**; bumped **0003** to
active (5/6 shipped).

Key finding: the reconcile tool's 18 `likely-done` were mostly **false
positives** — `#NNNN` body refs are usually _context_ citations, not shipping
PRs (e.g. `#2645`=AF7 cited by the AF11 story; `#2651`=a docs-plan PR; `#2638`
shared across three 0003 stories). Each flip below was confirmed against actual
trails repo state, not the ref:

- **0007 (closed):** `setToSqlVisitor` has zero AR callers + `bootstrap-test-handler.ts`
  has no visitor refs → a2/a3/a4/b/c done.
- **0004 (closed):** `QueryCacheAdapter` retired (comment-only remnant);
  `cache`/`uncached` are pool-based statics; mixin live.
- **0003:** CLI package fully built (scaffold/generators done); `relocate-tsc-wrapper`
  done (no `tsc-wrapper/` + no `trails-tsc` dep); `lazy-async-schema-reflection`
  done (`await ensureSchemaLoaded()` on query+persistence paths).
  `abstract-class-own-property-fix` stays ready (no own-property check yet).
- **0005:** `nested-through-remainder` done (0 skips); `pool-merge-resolve-url-config-unskip`
  unblocked → ready (ConnectionHandler/P9 ported, 1 skip left).
- **0002:** `visitor-on-establish` done (superseded by the now-closed 0007).

Second pass against `docs/activerecord/activerecord-gaps.md` (the 2026-06-01
consolidated snapshot) + code verified 4 more 0005 stories done:
`dependent-dispatch-consolidation` (`processDependentAssociations` gone),
`rf1-fk-derivation-consolidation` (`_deriveForeignKey` helper), `pool-sqlite-open-uri`
(`SQLITE_OPEN_URI` wired), `af5-eager-load-raise-semantics` (`EagerLoadPolymorphicError`
raised in production). Also corrected 0004's PRs to the gap doc's canonical
trio (2662 mixin / 2672 pool class / 2684 wrapper-delete). **Caveat proven:**
absence from the gap doc ≠ done —
`strict-loading.test.ts` still has 11 skips, so `af11` / `strict-loading-cascade-proxy`
stay open despite the gap doc not listing strict-loading. Only code is decisive.

Blocked re-verify: the remaining 8 blocked stories have **live** blockers
(Rails-snapshot refresh, internal pool wiring, Phase-G fixtures, missing Node
22.5+ lane, adapter.ts deletion gated on ~134 import sites) — left blocked.

Conservative residue: the `likely-open` set (0005 gaps, 0006 draft
architectural, 0008/0009 remainder) had **no shipped signal** and is left at its
authored status (genuinely open) — the safe direction (open, not falsely done).
