---
title: "Relocate AR tsc-wrapper + bins into activerecord-cli"
status: done
updated: 2026-06-04
rfc: "0003-activerecord-cli"
cluster: cli
deps: ["cli-package-scaffold"]
deps-rfc: []
est-loc: 250
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Move the AR type-tooling out of the runtime package so `activerecord` becomes
pure runtime with one fewer dependency, and the model-scanner sits next to the
generator that also needs it:

- Move `activerecord/src/tsc-wrapper/` (virtualizer plugin, `ar-program`,
  model-scanner) into `activerecord-cli`.
- Move the `trails-tsc`, `trails-schema-dump`, `trails-models-dump` **bins** from
  `activerecord`'s `package.json` to `activerecord-cli`'s.
- Drop `@blazetrails/trails-tsc` from `activerecord`'s deps; add `activerecord` +
  `trails-tsc` as `activerecord-cli`'s deps. Edges stay acyclic.

`ar typecheck` / `ar schema:dump` become convenience aliases delegating to
`trails-tsc` / `trails-schema-dump`, which stay directly invokable by name.

See RFC 0003 §Proposal (§4.2, §4.8).

## Acceptance criteria

- [ ] `tsc-wrapper/` (plugin, `ar-program`, model-scanner) lives in
      `activerecord-cli`
- [ ] `trails-tsc` / `trails-schema-dump` / `trails-models-dump` bins declared
      **only** in `activerecord-cli` (no double-declaration PATH collision)
- [ ] `activerecord` no longer depends on `trails-tsc` (pure runtime)
- [ ] `ar typecheck` → virtualizer (`--schema`), `ar schema:dump` →
      `trails-schema-dump`; `trails-tsc` still invokable by name
- [ ] `activerecord`'s `test:types:virtualized` repointed to the relocated CLI;
      `trailties`/CI invoking the old bin path updated

## Notes

Known dev-only cycle to plan for: `activerecord`'s `virtualized-dx-tests` are
type-checked by the wrapper, so after the move `activerecord` (devDep) →
`activerecord-cli` → `activerecord`. This never reaches published runtime deps
(pnpm workspaces resolve it). Lighter low-risk variant: relocate **only the bins**
(thin wrappers) and leave the wrapper library in `activerecord` for self-test, at
the cost of keeping its `trails-tsc` dep. The full move is the cleaner end-state.
