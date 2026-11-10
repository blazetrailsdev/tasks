---
title: "Port Zeitwerk::Registry::Inceptions and the Registry / Loader / Cref::Map remainder"
status: draft
updated: 2026-11-09
rfc: "0000-tooling-gems-residual-parity"
cluster: null
packages:
  - "zeitwerk"
deps:
  - mail-parity-api-credits-object-literal-modules
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api` zeitwerk 135/147: `registry/inceptions.rb` has no TS file (3/4
credited elsewhere; `Inceptions#unregister` missing,
`vendor/zeitwerk/v2.7.2/lib/zeitwerk/registry/inceptions.rb`), `registry.rb` misses `loaders` and
`autoloads` (6/8), `loader.rb` misses `inceptions` (and `internal`, below),
`cref/map.rb` misses `Map#initialize` (7/8). `Registry.loaders` and `.autoloads`
already exist in the `Registry` object literal (`packages/zeitwerk/lib/registry.ts:12-15`),
so they are credited by `mail-parity-api-credits-object-literal-modules`; the
rest are unported.

## Acceptance criteria

- [ ] `packages/zeitwerk/lib/registry/inceptions.ts` ports the file; the members
      now credited in another file move into it.
- [ ] `Loader#inceptions` and `Cref::Map`'s constructor are ported at their
      Ruby names. `Registry.loaders` / `.autoloads` are credited once the
      object-literal credit story lands.
