---
title: "sqlite3: enroll ext/sqlite3/*.c through the C arm; exception.c's three ports lose their receipts"
status: draft
updated: 2026-10-08
rfc: "0187-sqlite3-gem-port"
cluster: package
packages: ["sqlite3", "scripts"]
deps:
  - sqlite3-lift-the-nested-port-into-a-package
  - c-ext-method-table-extractor-arm
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

`errors.ts` (in `packages/activerecord/src/sqlite/` today) ports `status2klass` (`vendor/sqlite3/v2.6.0/ext/sqlite3/exception.c:3-66`),
`rb_sqlite3_raise` (`:68-80`) and `rb_sqlite3_raise_with_sql` (`:100-122`) under C names, each
with `@noRailsEquivalent CONVERGEABLE sqlite3-gem-c-surface-and-driver-covers-score-against-the-vendored-gem`
(`errors.ts:131,224,237`).

Those three are plain C functions, not `rb_define_*` registrations, so the C arm as specified
does not see them. The method tables it does see: `vendor/sqlite3/v2.6.0/ext/sqlite3/database.c:962-996` (28
definitions), `statement.c:681-701` (18), `sqlite3.c:158-206` (constants, `libversion`),
`backup.c` (5, unported).

## Acceptance criteria

- [ ] Before any work: `c-ext-method-table-extractor-arm` is `done`, and this story's criteria are re-read against the arm as it actually landed. Where the arm differs from what is assumed below (cross-file class merge; a row kind for plain C functions), this story's criteria are edited by markdown PR first.

- [ ] The `sqlite3` source sets `extPath: "ext/sqlite3"`; `database.c` + `lib/sqlite3/database.rb` map onto `database.ts`, `statement.c` + `statement.rb` onto `statement.ts`, `sqlite3.c` onto `constants.ts`.
- [ ] `backup.c`, `aggregator.c` and every Ruby file with no TS counterpart are `unported-files` rows with the rule-1 reason; each unported method in an enrolled file is a scoped skip. The package's denominator is RFC 0187-sqlite3-gem-port's surface table.
- [ ] For `status2klass` / `rbSqlite3Raise` / `rbSqlite3RaiseWithSql`: the C arm gains a declared-function row kind for non-`static` C functions a source lists by name, OR they become private helpers of the `Statement` / `Database` methods that call them in C and so leave the measured surface. Pick the one that needs no receipt and say which in the PR body.
- [ ] The three receipts are gone; `nativeStatus`'s (`errors.ts:195`) stays until the engine stories fold it in.
- [ ] `pnpm parity:api` shows `sqlite3` with `files: 7/7` or names the remainder as later stories of this RFC.

## Verification

```bash
pnpm parity:api && pnpm parity:api:extra --package sqlite3
```

## Notes

Also depends on `c-ext-method-table-extractor-arm` in the pg gem wrapper RFC (`pg-gem-port`). That
story does not exist on this branch, so the edge is not in `deps:`; add it with
`tasks set-deps sqlite3-enroll-the-c-extension-surface --add c-ext-method-table-extractor-arm` once
both RFCs are merged and numbered. Do not claim this story before that one is done.

Why the edge is prose and not frontmatter: `scripts/validate.mjs` rejects a `deps` or `deps-rfc`
entry that does not resolve on the branch, and `blocked-by` is DB-owned (a hand-typed value is
ignored by ingest and fails the owned-fields guard). The machine-visible form is the
`tasks set-deps` call above, which the pg RFC's README lists as a required step at numbering time.
