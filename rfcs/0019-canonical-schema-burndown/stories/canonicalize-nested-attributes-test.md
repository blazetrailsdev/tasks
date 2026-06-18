---
title: "Canonicalize nested-attributes.test.ts (drop makeModels/bespoke tables)"
status: claimed
updated: 2026-06-18
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 400
priority: 50
pr: null
claim: "2026-06-18T21:23:08Z"
assignee: "canonicalize-nested-attributes-test"
blocked-by: null
---

## Context

`packages/activerecord/src/nested-attributes.test.ts` is a large bespoke-schema
test file (~100 ad-hoc tables declared in a local `TEST_SCHEMA` const +
per-test `makeModels()` that hand-roll `class Ship` / `class Pirate` /
`class Part` etc.). It is **not** in `eslint/require-canonical-schema-exclude.json`
yet still relies on bespoke models, contrary to the canonical-only `defineSchema`
rule (CLAUDE.md, RFC 0019).

Surfaced while landing RFC 0030 d3 (#3451): the
`circular references do not perform unnecessary queries` test had to use bespoke
`CrShip`/`CrPart`/`CrTreasure` models with a `cr_*` schema instead of the
canonical `Ship`/`ShipPart`/`Treasure`, because importing canonical `Ship`
collides with the many bespoke `class Ship` declarations in this file's
`makeModels()` — the test adapter's auto-schema name-dedup then derives a
phantom `ship2s` table and the test fails with `no such table: ship2s`. Two new
bespoke table groups were added in that PR for the same reason: `cid_pirates`/
`cid_birds` (composite-id-keys test) and `cr_ships`/`cr_parts`/`cr_treasures`
(circular-references test).

## Acceptance criteria

- Convert `nested-attributes.test.ts` from `makeModels()` + ad-hoc `TEST_SCHEMA`
  to canonical models (`Pirate`/`Ship`/`ShipPart`/`Treasure`/`Human`/`Interest`/
  `Owner`/`Pet`/`Cpk::*`) + `useHandlerFixtures`/`setupHandlerSuite`, matching
  Rails `nested_attributes_test.rb`'s fixtures/models exactly.
- Drop the bespoke `cid_*` / `cr_*` tables and the file's other ad-hoc tables;
  `circular references…` should ride canonical `Ship`/`ShipPart`/`Treasure`.
- Test names must remain verbatim (test:compare matching). No regressions in
  `pnpm test:compare --package activerecord` for `nested_attributes_test.rb`.
- This is a large file; split into multiple PRs by describe-block if it exceeds
  the 500-LOC ceiling, each from main with non-overlapping describe blocks.
