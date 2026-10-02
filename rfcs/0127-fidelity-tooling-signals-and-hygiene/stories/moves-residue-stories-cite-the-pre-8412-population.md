---
title: "moves residue and gate stories cite the population measured before mixin-credited moves were excluded"
status: draft
updated: 2026-10-02
rfc: "0127-fidelity-tooling-signals-and-hygiene"
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

trails PR 8412 stopped `parity:api:moves` reporting a mixin member ported in the file Rails defines it in
(`relocationsByRoute`, `scripts/api-compare/moves.ts`). The measured population fell:

| package            | before | after |
| ------------------ | -----: | ----: |
| activerecord       |    922 |   193 |
| actionview         |    351 |   182 |
| activesupport      |    200 |    33 |
| activemodel        |    152 |    41 |
| actioncontroller   |    119 |    57 |
| sqlite3            |    111 |     0 |
| actiondispatch     |    108 |    39 |
| i18n               |     58 |     0 |
| trailties          |     26 |    11 |
| abstractcontroller |      9 |     0 |
| rack-test          |      7 |     0 |

All five `connection-adapters/abstract/*.ts -> connection-adapters/abstract-adapter.ts` groups are gone
(schema-statements 85, database-statements 68, database-limits 5, query-cache 5, savepoints 4).

Stories written against the old population now cite numbers that no longer exist:

- `gate-the-wrong-file-moves-population` (RFC 0127) is titled for 1413 misplaced methods.
- `activerecord-converge-moves-residue-adapter-hosted` (RFC 0174) is titled for 318 adapter-hosted methods, most
  of which were these false positives.
- `activerecord-converge-moves-residue-base-hosted`, `-relation-hosted`, `-rest`,
  `activemodel-converge-moves-residue` and `arel-converge-moves-residue` carry counts from the same measurement.

## Acceptance criteria

- [ ] Each story above is re-measured with `pnpm parity:api && pnpm parity:api:moves --package <pkg>` and its
      title, `est-loc` and route list are rewritten to the current rows, by a markdown PR in the tasks repo.
- [ ] A residue story whose rows are all gone is closed with `pnpm tasks close`, naming trails PR 8412.
