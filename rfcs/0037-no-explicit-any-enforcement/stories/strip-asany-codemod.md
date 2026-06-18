---
title: "Strip-and-recompile codemod to remove redundant as any"
status: ready
updated: 2026-06-18
rfc: "0037-no-explicit-any-enforcement"
cluster: null
deps: []
deps-rfc: []
est-loc: 130
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

~2,043 of 2,803 `as any` in AR tests are `(expr as any).member` where the
member is already typed (`.id`, `.name`, declared columns, `Base` methods) —
gratuitous casts removable with no type change. `eslint --fix` cannot remove
`as any`. A clean baseline exists: `pnpm typecheck` (`tsc --build`,
project-references-aware, `scripts/typecheck.mjs`) is green from zero. (Note:
a bare `tsc -p tsconfig.json` reports thousands of false errors because cold
project references aren't resolved — must use `tsc --build`.)

## Acceptance criteria

- A strip-and-recompile codemod (script under `scripts/`): for each `as any`
  occurrence, remove it, run `tsc --build`, keep the removal iff the error
  count stays 0; otherwise revert that single removal.
- Operates per-file (takes a file/glob arg) so output PRs stay reviewable and
  under the 500-LOC ceiling.
- Idempotent and safe: never leaves the tree with new type errors; reports how
  many casts it removed vs. kept.
- Does NOT touch `(expr as any)._private` reaches or `as any[]`/terminal casts
  (leave for hand-fix stories) — scope to `as any` immediately followed by
  `.member` on a non-underscore identifier, or self-verify via recompile.
- This story delivers the tool only (plus its own unit test on a fixture
  file); the per-file application happens in burndown child PRs.
