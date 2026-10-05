---
title: "Assign VERSION.STRING once and declare gemVersion first in activesupport, activemodel and activerecord"
status: draft
updated: 2026-10-05
rfc: "0169-activejob-package-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails assigns `VERSION::STRING` once, as a constant, and declares `gem_version`
before `module VERSION`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/gem_version.rb:5-16`; the
same shape in `activemodel/lib/active_model/gem_version.rb` and
`activerecord/lib/active_record/gem_version.rb`).

Three trails ports make `STRING` a getter that recomputes from mutable
`MAJOR` / `MINOR` / `TINY` / `PRE` fields on every read, and declare `VERSION`
ahead of `gemVersion`:

- `packages/activesupport/src/gem-version.ts`
- `packages/activemodel/src/gem-version.ts`
- `packages/activerecord/src/gem-version.ts`

`packages/activejob/src/gem-version.ts` was converged in trails#8559 (review
round 1) and is the shape to copy: `gemVersion` first, then module-level
`MAJOR` / `MINOR` / `TINY` / `PRE` constants and a `VERSION` object whose
`STRING` is computed once from them.

## Acceptance criteria

- [ ] In all three files `VERSION.STRING` is a plain value assigned once, not a getter.
- [ ] In all three files `gemVersion` is declared before `VERSION`, as `gem_version.rb:5-16` orders them.
- [ ] Each package's existing version tests stay green, and a plain-node import of each built `dist/gem-version.js` succeeds.
