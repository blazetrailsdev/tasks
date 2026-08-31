---
title: "encryption/ and type-virtualization/: resolve 30 novel names, 19 of them in files with no Rails counterpart"
status: draft
updated: 2026-08-31
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages:
  - activerecord
deps: []
deps-rfc: []
est-loc: 200
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

**30 novel names across 16 files**, in two clusters that resolve differently.

`type-virtualization/` (15, none with a Ruby counterpart) is trails-only build
tooling — `resolve-target.ts` (5: `isEmittableTargetName`,
`resolveAssociationTarget`, `ResolveTarget`, `resolveThroughTarget`,
`stripQuotes`), `index.ts` (4: `remapLine`, `synthesizeDeclares`, `tsTypeFor`,
`virtualize`), `type-registry.ts` (2), `virtualize.ts` (2), and the rest at 1.
It exists because TypeScript needs declared attribute types where Ruby needs
nothing (CLAUDE.md, "Generated attribute readers are properties"). That makes
the whole subtree a `PERMANENT` file-level claim rather than 15 member tags —
check `fileTagVerdict` accepts the blanket per file. Note `remapLine`,
`tsTypeFor` and `virtualize` each appear twice (a module and its re-export);
memory's `parity:api --extra does NOT run the STALE-tag gate` warns a receipt on
a re-exported function goes stale at a file you never edited, so tag the
definition, not the barrel.

`encryption/` (15, mixed) is the harder half because most files ARE matched:

- `extended-deterministic-queries.ts` — 3 matched: `[ADDITIONAL_VALUE_BRAND]`,
  `[Symbol.toPrimitive]`, `installed`. The two symbol-keyed names are JS brands,
  which CLAUDE.md sanctions (`Symbol` is for private keys and brands); `installed`
  is a real question.
- `extended-deterministic-uniqueness-validator.ts` — 3 matched:
  `allCiphertextsFor`, `installed`, `resetSupport`. `resetSupport` smells like
  test-only surface — if so, delete it and reach for the harness instead.
- `install.ts` — 2, no counterpart, and `auto-filtered-parameters.ts` — 1
  (`dispose`). Memory's
  `feedback_encryption_configure_before_load_no_lazy_machinery` is the standing
  constraint on anything in this cluster.

## Acceptance criteria

- All 30 resolved by one of the four routes, stated per file.
- `type-virtualization/` uses file-level claims where sound, tagged at the
  definition rather than a re-export, and the extra-surface run's STALE-tag gate
  (`scripts/api-compare/extra-surface.ts`, run separately from
  `parity:api --extra`) passes.
- No `resetSupport`-style test-only name survives with a receipt; test-only
  surface is deleted or moved behind the fixture harness.
- Both subtrees report 0 novel; the mark is tightened in the same PR.
