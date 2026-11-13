---
title: "relation-include-spawn-methods-calculations-import-cycle"
status: draft
updated: 2026-11-13
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:import-cycles` lists two edges left after trails#10047 converged the rest of
`converge-module-eval-import-cycle-edges`:

```text
packages/activerecord/lib/relation.ts:2164 -> packages/activerecord/lib/relation/spawn-methods.ts  [SpawnMethods]
packages/activerecord/lib/relation.ts:2165 -> packages/activerecord/lib/relation/calculations.ts  [Calculations]
```

Both are real: a plain-node import of the built `packages/activerecord/dist/relation/spawn-methods.js`
(or `relation/calculations.js`) as entry module throws `Cannot access 'SpawnMethods' before
initialization`. The include is Rails' `include ... SpawnMethods, Calculations` in
`vendor/rails/v8.0.2/activerecord/lib/active_record/relation.rb`. The cycles close through
`relation/spawn-methods.ts -> relation/merger.ts -> relation.ts` and
`relation/calculations.ts -> enum.ts -> relation.ts`; five modules reachable from either import
`relation.ts` (`connection-handling.ts`, `enum.ts`, `reflection.ts`, `relation/merger.ts`,
`scoping/default.ts`), each reading `Relation` only inside function bodies.

## Acceptance criteria

- Both edges converge (cycle broken, or the read moved per CLAUDE.md § "Call-time constant resolution"), verified by a plain-node import of the built `dist` of both ends.
- `scripts/parity/import-cycles-mark.json` ends with an empty `edges` list via `pnpm parity:import-cycles:tighten`.
