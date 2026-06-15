---
title: "defineSchema serial path skips big_integer custom PKs (no BIGSERIAL branch)"
status: ready
updated: 2026-06-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced in #3276 (defineschema-custom-named-integer-pk-not-serial-pg). That PR
made a custom-named single-column **integer** PK declared via
`primaryKey: ["col"]` emit a serial/identity column, preserving INTEGER width
across adapters (PG `serial` → INT4; MySQL/SQLite `integer` → INT
auto-increment).

`big_integer` was deliberately excluded from the `isIntegerSpec` helper (in both
`define-schema.ts` and `schema-file-generator.ts`): the serial path routes
through `createTable({ primaryKey, id: { type } })`, and there is no
`bigserial`-on-PG branch. A `big_integer` custom PK declared `primaryKey: ["col"]`
therefore still falls to the plain-array path → a sequence-less BIGINT PK on PG
(the exact bug #3276 fixed for integer). The exclusion is documented as a
footgun in the `isIntegerSpec` JSDoc.

No canonical TEST_SCHEMA table currently declares a `big_integer` single custom
PK, so this is latent — but the next one added would silently regress.

## Acceptance criteria

- [ ] A single-column `big_integer` PK declared via `primaryKey: ["col"]` emits a
      BIGSERIAL (PG) / BIGINT AUTO_INCREMENT (MySQL) / INTEGER (SQLite, rowid)
      auto-increment column in both `defineSchema` and the schema-file generator.
- [ ] `isIntegerSpec` (or a sibling) accepts `big_integer` with the correct
      per-adapter id type (`bigserial` on PG, `bigint` on MySQL).
- [ ] Unit tests cover the `big_integer` serial-PK path in both generators.
- [ ] `test:compare` delta non-negative.
