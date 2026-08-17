---
title: "Empty call-mismatch baseline file makes every local reseed report spurious drift"
status: closed
updated: 2026-08-17
rfc: "0025-fidelity-verification-tooling"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Duplicate of empty-baseline-shard-makes-reseed-drift-check-lie (0108-call-gate-false-positives), claimed and in flight. Same file (call-mismatches-exclude/activerecord/explain.json, still committed as a bare []), same root cause; the 0108 body additionally names the consequence this one omits — CI's Ratchet baseline drift step fails on any diff, so the reseed-drift check reports a false positive to every author who runs it before adding a row. Verified 2026-08-17 the file is still empty."
---

## Context

`scripts/api-compare/call-mismatches-exclude/activerecord/explain.json` is
committed as a bare `[]` — the only empty baseline file in the tree (checked
across all of `call-mismatches-exclude/`). It was emptied by #6598, which
converged `exec_explain`/`build_explain_clause` into the Explain mixin and
deleted its last row, but the file itself was left behind.

A local `pnpm exec tsx scripts/api-compare/lint-call-mismatches.ts --write`
reseed PRUNES it, so the reseed-drift check
(`.github/workflows/ci.yml`, "Ratchet baseline reseed drift") produces a
spurious one-line deletion on every branch that runs it:

```text
 scripts/api-compare/call-mismatches-exclude/activerecord/explain.json | 1 -
```

CI does not flag it — its drift step passes on `main` — so this only bites
locally, which is worse: it looks like drift the current branch introduced.
On #6635 it cost two people a diagnosis each (the author, then the reviewer),
both of whom had to establish it was pre-existing and hand-revert it before
finishing, and both nearly shipped the deletion as an unrelated change.

## Converged shape

Either delete the empty file (matching what a clean reseed produces, so local
and CI agree), or make `pruneEmptyDirs` / the reseed writer keep an empty
array file it finds — whichever matches the intent in
`scripts/api-compare/baseline-json.ts`. Prefer deletion: an empty exclude file
carries no information, and the only-shrink contract has nothing to hold.

Then confirm the two sides agree: a `--write` reseed on a clean checkout of
`main` must leave the whole `call-mismatches-exclude/` tree byte-identical.

## Acceptance criteria

- [ ] A `lint-call-mismatches.ts --write` reseed on a clean `main` produces an
      empty `git diff` over `call-mismatches-exclude/` and
      `call-mismatches-unreviewed/`.
- [ ] `pnpm parity:api:calls` / `:args` stay green, and no baseline row moves.
- [ ] If any other emitter can leave an empty file behind, it is fixed too, so
      the invariant is "no empty baseline files", not a one-off deletion.

## Re-verified 2026-08-17 (draft sweep)

Still valid, verbatim.
`scripts/api-compare/call-mismatches-exclude/activerecord/explain.json` is still
committed as a bare `[]`, and is still the only empty file in the tree.
