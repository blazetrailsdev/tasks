---
title: "ESLint exclude lists become per-file counts against the merge-base"
status: in-progress
updated: 2026-10-20
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9135
claim: "2026-10-20T14:25:53Z"
assignee: "eslint-exclude-lists-become-merge-base-counts"
blocked-by: null
closed-reason: null
---

## Context

trails#9129 (`scripts/parity/cast-count.ts`, `pnpm parity:types:casts`) replaced a committed mark file with a per-file count compared against the same count at the merge-base (`git grep -cE`). Nothing is committed, so there is no seed and no `:tighten`, and no merge conflicts.

Three ESLint exclude lists are the same kind of burndown, but they record only which files may break a rule, never how many times:

- `eslint/no-explicit-any-src-exclude.json` (4 commits in the 30 days to 2026-10-20)
- `eslint/no-explicit-any-test-exclude.json`
- `eslint/rails-error-parity-exclude.json`
- `eslint/no-standalone-associations-exclude.json` (if its rule can be counted the same way)

## Acceptance criteria

- Each list converted to a per-file violation count, compared against the merge-base in the shape of `cast-count.ts`: red on any file above its base count, and on a new file with a non-zero count.
- Count by rule violation (one ESLint pass over the base tree's versions of the files, or a grep where the rule is lexical), not by file membership.
- The base is current `origin/main` (the PR merge commit's first parent), not a stale branch merge-base, so a stale branch cannot undo a sibling's convergence.
- The JSON lists and their wiring in `eslint.config.mjs` are deleted.
