---
title: "Type-check the packages/website tree in CI"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Not a Rails-fidelity divergence: CI/typecheck coverage for packages/website, which has no Rails counterpart."
---

## Context

`packages/website` is not covered by `pnpm typecheck`. Root `tsconfig.json`'s
`references` list names every `packages/*` project **except** `website` (and
`scripts`, tracked separately by `typecheck-scripts-tree-gate`), and
`scripts/typecheck.mjs` runs `tsc --build` off that list, so the website tree
is never compiled by any local gate or by CI's typecheck step.

The gap produced a live bug during #5893. A mechanical rename left
`packages/website/src/lib/frontiers/sql-js-adapter.ts` with two
`quoteColumnName` declarations, the surviving one calling itself:

```ts
quoteColumnName(name: string): string {
  return this.quoteColumnName(name);   // infinite recursion
}
```

TypeScript reports a duplicate class member (TS2393) for exactly this shape,
and `pnpm typecheck` passed anyway. It reached a human reviewer, who caught
it. A `tsc --noEmit` scoped to the website package does flag it.

Note the website package currently has pre-existing errors of its own
(`sql.js` has no type declarations, a couple of implicit `any` parameters, and
a vite 6/7 duplicate-install `PluginOption` clash), so wiring it in means
fixing or explicitly suppressing those first — that is the bulk of the work,
not the reference wiring.

## Acceptance criteria

- `packages/website` is type-checked by a gate that runs in CI — either added
  to the root `tsconfig.json` references or given its own CI step.
- The pre-existing website type errors are fixed or narrowly suppressed with a
  recorded reason; no blanket `skipLibCheck`-style silencing of the tree.
- A regression check proves the gate is live: reintroducing a duplicate class
  member in `sql-js-adapter.ts` fails the gate.
- `pnpm typecheck` (or the new gate) clean on a fresh clone.
