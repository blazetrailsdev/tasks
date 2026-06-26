---
title: "association-scope-test-np-uuid-canonical"
status: ready
updated: 2026-06-26
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`packages/activerecord/src/associations/association-scope.test.ts` was converged
onto the canonical schema in PR #4198 — every DB-roundtrip case now rides
canonical models (Author/Post/Comment, Categorization/Category, Tag/Tagging,
Member/Membership/Club). The file stays on the `require-canonical-schema`
exclude list for **one remaining reason**: the test

> `loadHasMany through with sourceType + non-id target PK uses correct join column`

needs a polymorphic _source_ whose target has a non-`id` (uuid) primary key.
That shape has no `schema.rb` analog, so PR #4198 built file-unique `np_*`
scratch tables (`np_authors`, `np_galleries`, `np_photos` with a uuid PK) via a
single `defineSchema` in `beforeAll` (torn down in `afterAll`).

Policy decision (2026-06-26): **no `eslint-disable` directives** — so instead of
a scoped disable, the file remains on
`eslint/require-canonical-schema-exclude.json`.

trails: `associations/association-scope.test.ts:beforeAll` (np\_\* defineSchema)
and the `non-id target PK` test body.

## Acceptance criteria

- [ ] Either converge the uuid-PK polymorphic-source case onto a canonical
      non-`id`-PK polymorphic-source shape (parity-check `schema.rb` first — e.g.
      a `writer_*`/essays-style string PK already in `TEST_SCHEMA`), or relocate
      the single bespoke case to a dedicated file that legitimately holds the
      scratch shape.
- [ ] No `np_*` inline `defineSchema` left in `association-scope.test.ts`.
- [ ] Remove `packages/activerecord/src/associations/association-scope.test.ts`
      from `eslint/require-canonical-schema-exclude.json`.
- [ ] `pnpm lint` clean with **no** `eslint-disable`.
- [ ] `pnpm vitest run packages/activerecord/src/associations/association-scope.test.ts`
      passes (and on the MariaDB lane — DDL stays in `beforeAll`, never inside a
      transactional test).

## Notes

This is the last item gating `association-scope.test.ts` off the canonical-schema
exclude list. Test name must stay verbatim (`test:compare` matching).
