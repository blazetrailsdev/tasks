---
title: "Relation#merge hash-dispatch + proc-arg fidelity (2 impl bugs)"
status: claimed
updated: 2026-06-25
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 150
priority: 20
pr: null
claim: "2026-06-25T22:47:17Z"
assignee: "relation-merge-hash-and-proc-fidelity"
blocked-by: null
---

> **Scope override (RFC 0019 prioritization, 2026-06-25):** This story is exempt from the 500-LOC PR ceiling. Ship the full file conversion as **one PR per file**, even if additions+deletions exceed 500 LOC. Do **not** split into sibling PRs or defer part of the file to a follow-up story — the goal is to drop the file from the canonical-schema exclude list in a single PR.

## Context

This is an **implementation-fix** story, not a file port: two `Relation#merge`
bugs surface when `relation/merging.test.ts` is ported word-for-word to
`merging_test.rb`. Fix the implementation so the faithful Rails bodies pass.

- impl: `packages/activerecord/src/relation.ts` (and `relation/query-methods.ts`)
- Rails ref: `relation/merging_test.rb`

The two gaps (confirm against current `merge()` before fixing):

1. **Hash-argument dispatch** — `merge({...})` must route a plain object through
   the same where/dispatch path Rails uses, not treat it as a Relation.
2. **Proc / lambda argument** — `merge(-> { ... })` (Rails accepts a callable
   scope) must be instance-exec'd against the relation and merged.

## Acceptance criteria

- [ ] Reproduce both failures by porting the relevant `merging_test.rb` cases
      first (do NOT weaken or rename the tests to make them pass).
- [ ] Fix `Relation#merge` hash-dispatch and proc-arg handling to match Rails
      semantics; cite the Rails source method in the PR body.
- [ ] `pnpm vitest run packages/activerecord/src/relation/merging.test.ts` and
      the broader relation tests pass; `api:compare` for `merge` still matches.

## Definition of done

The implementation matches Rails' `merge` semantics and the faithful Rails
bodies pass unmodified. Skipping or renaming a failing test does **not** close
this story.
