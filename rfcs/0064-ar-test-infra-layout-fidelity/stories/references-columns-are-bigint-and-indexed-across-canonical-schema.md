---
title: "Every t.references transcribes as a bigint column with its default index"
status: done
updated: 2026-08-07
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 6191
claim: "2026-08-07T18:40:40Z"
assignee: "references-columns-are-bigint-and-indexed-across-canonical-schema"
blocked-by: null
closed-reason: null
---

## Context

`t.references :x` in schema.rb builds a **bigint** `x_id` column plus a default
index on it, unless the call passes `index: false`. Both canonical schema
sources transcribe those calls inconsistently — the two divergences usually
cancel (an integer FK against an integer PK is still a valid constraint), which
is why no lane is red.

Found while converging the `fk_test_has_pk` / `fk_test_has_fk` pair (PR #6184,
story `fk-test-pair-columns-are-integer-not-bigint`); the same class of drift is
visible on sibling tables and was out of that PR's scope:

- `courses_professors` (schema.rb:1457-1459, `t.references :course` /
  `:professor`) — transcribed as `t.integer` + `t.index`
  (`canonical-schema.ts:1804-1809`): index right, width wrong.
- `lessons_students` (schema.rb:714-717, same two bare `t.references`) —
  transcribed as `t.bigInteger` with **no** index
  (`canonical-schema.ts:1042-1045`): width right, index missing.

schema.rb has ~75 `t.references` calls; only a handful pass `index: false`
(16, 404, 409, 462, 463, 538, 587, 768, 769, 1029, 1158, 1159, 1290, 1403), so
most of them should be carrying an index neither source declares.
`schema-compare` does not catch it: `schema-compare-drift-check-ignores-indexes-and-fks`
is the story that closed that gap for the registry, but the width/index pair is
still only checked where someone looked.

## Converged shape

Every `t.references :x` in schema.rb transcribes as a `big_integer` `x_id`
column in both `canonical-schema.ts` and `test-helpers/test-schema.ts`, plus an
index on that column unless the Ruby call passes `index: false` (and with the
declared `index: { name: ... }` where schema.rb:508 gives one). Polymorphic
references expand to `x_id` + `x_type` as they do today, under the same rule.

Best done as a sweep with the schema.rb call list in hand, then verified on the
MariaDB lane — that is the lane that raises `MismatchedForeignKey` when a
widening is half-applied against a bigint `id`.

## Acceptance criteria

- [ ] Every `t.references` column is `big_integer` in both canonical sources.
- [ ] Every `t.references` without `index: false` carries an index in both.
- [ ] `pnpm parity:schema` clean; SQLite, PostgreSQL and MySQL/MariaDB lanes
      green.
