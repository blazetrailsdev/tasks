---
title: "Confirm TS 5.x dep is scoped to programmatic-API consumers"
status: ready
updated: 2026-07-08
rfc: "0000-typescript-7-native-compiler"
cluster: null
deps: ["drop-tsc-batch-run"]
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Phase 4 of RFC 0000-typescript-7-native-compiler. The `typescript` 5.x
package cannot be fully removed while TS 7 ships no programmatic API (7.0
has none; 7.1 is expected to introduce a new, different one): `trails-tsc`
(compiler wrapper + `./ts-plugin` LSP plugin) and `activerecord-cli`'s
tsc-wrapper use `ts.createProgram`, `ts.LanguageService`,
`ts.getPreEmitDiagnostics`, `ts.CompilerHost`, etc. at runtime.

- Confirm the remaining `typescript` dependency is declared only where a
  programmatic-API consumer needs it (move it off the root devDeps to the
  specific package deps if it is not already).
- Document why it stays and what would let it go (a stable Corsa API →
  follow-up RFC).

## Acceptance criteria

- `typescript` 5.x appears only as a dependency of `trails-tsc` /
  `activerecord-cli` (and any other confirmed programmatic-API consumer).
- A short note records the follow-up condition for full removal.
