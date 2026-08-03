---
title: "Drop score-cli's private listJsonFiles copy for the shared baseline-json helper"
status: done
updated: 2026-08-03
rfc: "0083-wide-call-ratchet-noise-reduction"
cluster: api-compare
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 5942
claim: "2026-08-03T00:58:05Z"
assignee: "dedupe-list-json-files-in-prism-score-cli"
blocked-by: null
closed-reason: null
---

## Context

PR #5922 moved `listJsonFiles` / `pruneEmptyDirs` into
`scripts/api-compare/baseline-json.ts:36,58` so both split trees (the wide
exclude baseline and the new per-file unreviewed marks) are walked by one
implementation.

`scripts/prism-codegen/score-cli.ts:82-97` still carries a byte-identical
private copy of `listJsonFiles`, used at `:105` to read the same
`call-mismatches-wide-exclude/` tree it points at via the `API_COMPARE` path
constant (`:58`). Three copies existed before #5922; this is the last one.

The open question this story has to settle is whether `scripts/prism-codegen/`
may import from `scripts/api-compare/`'s module surface at all — today it
reaches the tree by path only, never by import — or whether the helper belongs
in a shared `scripts/` utility module instead. Decide that explicitly rather
than reaching for the import by reflex.

## Acceptance criteria

- One implementation of the recursive `*.json` walk remains under `scripts/`.
- The chosen direction (import across script dirs vs. a shared module) is
  stated in a one-line comment or the module header, so the next agent does not
  re-litigate it.
- `pnpm vitest run scripts/prism-codegen scripts/api-compare` stays green;
  `score-cli`'s deviation-catalog totals are unchanged.
