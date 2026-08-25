---
title: "Scorer matches initializeDup to an unrelated symbol"
status: done
updated: 2026-08-02
rfc: "0086-prism-codegen-productionization"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 5833
claim: "2026-08-01T22:31:00Z"
assignee: "scorer-initialize-dup-misresolution"
blocked-by: null
closed-reason: null
---

## Context

With the super linearization threaded into the scorer (PR #5817),
`associations.rb::initializeDup` became a clean generated def and entered
`convergence-baseline.json` as unreviewed residue. Its port match is bogus:
`pnpm codegen:score --verbose` shows

    gen:  ref:association_cache ref:call ref:initializeDup
    port: new:SchemaCache ref:columns new:Map ref:columns ref:columnsHash ...

There is no `initializeDup` in `packages/activerecord/src/associations.ts`;
the only port definition is the `Object.defineProperty` wrapper in
`aggregations.ts:290-293`. The resolver matched an unrelated symbol, so the
row is neither a real divergence nor signable off — same class of defect as
the completed `scorer-getter-and-arrow-resolution`.

## Acceptance criteria

- The resolver does not match `initializeDup` to an unrelated symbol; the row
  reads as `missing`, resolves to the real port definition, or is explained.
- `convergence-baseline.json` loses the bogus
  `active_record/associations.rb::initializeDup::divergent` row.
- A regression test pins whatever resolution rule changed.
