---
title: "scripts/**/*.ts is not type-checked by pnpm typecheck"
status: closed
updated: 2026-07-28
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Premise still live on main (root tsconfig.json has files:[] and references only the 15 packages/* projects; no scripts/tsconfig.json exists), but off-charter for RFC 0028: adding scripts/**/*.ts to tsc --build ADDS work to build-and-typecheck, a critical-path job. It is a type-safety gap, not a CI-cost story, and cannot clear this RFC's wall-time go/no-go gate. Closed as part of the close-out; refile under a type-audit/typecheck RFC (cf. 0009-type-audit, 0037-no-explicit-any-enforcement)."
---

## Context

While auditing INFRA_RE carve-outs for PR #5263 I checked whether carving a
`scripts/` subtree out of the infra sweep could let a TypeScript break through.
It can't via lint (`pnpm lint` is `eslint .`), but it turns out `scripts/` is
**not type-checked at all**:

- root `package.json:` `"typecheck": "node scripts/typecheck.mjs"`
- `scripts/typecheck.mjs` runs `tsc --build`
- root `tsconfig.json` has `"files": []` and `references` listing only the 15
  `packages/*` projects (`tsconfig.json:20-35`)

So `tsc --build` never sees `scripts/**/*.ts`. Every `.ts` file under
`scripts/` (api-compare, test-compare, parity, tasks, the manifest builders,
…) is unchecked by `build-and-typecheck`. Type errors there surface only when
someone runs the script via `tsx`, which type-strips rather than checks — i.e.
at runtime, in whichever job happens to invoke it.

This is pre-existing and independent of the carve-out; PR #5263 does not make
it worse (it explicitly does not rely on typecheck coverage). But it is a real
hole in a large and load-bearing TS tree.

## Acceptance criteria

- [ ] `scripts/**/*.ts` is type-checked by `pnpm typecheck` — e.g. a
      `scripts/tsconfig.json` (non-composite, `noEmit`) referenced from the
      root, or a second `tsc -p scripts` invocation in `typecheck.mjs`.
- [ ] Existing type errors under `scripts/` are either fixed or explicitly
      ratcheted; the job must end green.
- [ ] No change to `build-and-typecheck`'s gating (it stays ungated on paths),
      and no measurable wall-clock regression beyond the incremental tsc cost.
