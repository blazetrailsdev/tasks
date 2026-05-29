---
title: "Scaffold @blazetrails/activerecord-cli + db:* commands"
status: draft
rfc: "0003-activerecord-cli"
cluster: cli
deps: []
deps-rfc: []
est-loc: 300
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Create the new `@blazetrails/activerecord-cli` package: an `ar` command backed by
the existing `Migration` / `MigrationRunner` / `DatabaseTasks`. It depends on
`activerecord` (and later `trails-tsc`); `trailties` will eventually depend on it
and drop its duplicate copies.

This story is the package skeleton + the `db:*` surface that needs no codegen:
`ar db:create`/`db:drop` (via `DatabaseTasks`), `db:migrate`/`db:rollback`,
`db:migrate:status`, `db:seed`, `db:schema:dump`, and the `db:setup`/`db:prepare`/
`db:reset` composites. Generators, `init`, and the tsc-wrapper relocation are
separate stories.

See RFC 0003 §Proposal (§4.1, §5).

## Acceptance criteria

- [ ] New `@blazetrails/activerecord-cli` package with an `ar` bin
- [ ] `ar db:create` / `db:drop` via `DatabaseTasks`
- [ ] `ar db:migrate` / `db:rollback [n]` / `db:migrate:status` over discovered
      migrations; dumps schema-columns.json
- [ ] `ar db:seed` runs `db/seeds.ts`; `db:schema:dump`, `db:setup`/`prepare`/
      `reset` composites
- [ ] Dependency edge `activerecord-cli → activerecord` only (no cycle)

## Notes

Blocked on RFC 0003 open question: whether `ar` reuses the `trails` binary name
or ships its own (status `draft` until decided). The pending-migration check
(Rails `CheckPending` analog) lands here or in the web layer, not AR core.
