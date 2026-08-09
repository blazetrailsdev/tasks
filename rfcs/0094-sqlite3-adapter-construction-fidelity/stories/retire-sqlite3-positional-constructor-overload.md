---
title: "Retire the deprecated positional SQLite3 adapter constructor"
status: draft
updated: 2026-08-09
rfc: "0094-sqlite3-adapter-construction-fidelity"
cluster: null
packages: ["activerecord"]
deps:
  ["sqlite3-constructor-connects-eagerly-unlike-rails", "sqlite3-connection-parameters-never-built"]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `SQLite3Adapter` has exactly one constructor signature: a config hash
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:102`,
`def initialize(...)` → `super` → `AbstractAdapter#initialize(config)`), whose
`database` key names the file.

trails carries two. `packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:346-356`
declares the Rails-shaped `constructor(config: SQLite3Config)` **and** a
`@deprecated` positional `constructor(filename?, options?)`, bridged in the
implementation body by a `typeof filenameOrConfig === "object"` branch
(`:365-372`).

The positional form is not vestigial — it is the dominant one. Of 174
`new BetterSQLite3Adapter(...)` / `new SQLite3Adapter(...)` sites under
`packages/` (excluding `dist/`), **156 are positional**, and they are
overwhelmingly single-argument:

```text
  35  new BetterSQLite3Adapter(":memory:")
  35  new BetterSQLite3Adapter(dbFile)
   7  new BetterSQLite3Adapter(dbPath)
   5  new BetterSQLite3Adapter(animalsDb)
   …  the tail is `(path, { strict: true })`-shaped
```

So the Rails-shaped signature is the exception in this codebase, which is the
reason the overload keeps surviving reviews: converging any one call site reads
as the odd one out.

Two costs beyond the extra signature: the positional form defaults `filename` to
`":memory:"` where Rails **raises** `ArgumentError, "No database file specified"`
on a missing database (`sqlite3_adapter.rb:106-107`) — trails only raises on the
hash path (`sqlite3-adapter.ts:367-369`) — and the branch keeps a
`SQLite3AdapterOptions` type alive alongside `SQLite3Config`.

## Converged shape

One constructor taking a config hash. The positional overload, its
`typeof … === "object"` branch, and the `":memory:"` default parameter are
deleted, so a missing `database` raises as `sqlite3_adapter.rb:106-107` does.

## Sequencing and size

**Land this last in RFC 0094.** Every other story in the RFC edits the
constructor body; doing the call-site sweep first means converting 156 sites
against a shape that is still moving.

At ~2 lines per site this exceeds the normal PR ceiling and is the
single-mechanical-rename case CLAUDE.md exempts — note that in the PR body. If it
still has to be split, split by directory (`connection-adapters/**` tests, then
`adapters/sqlite3/**`, then the rest), never by leaving both signatures live
across a merge.

## Acceptance criteria

- [ ] `sqlite3-adapter.ts` declares one constructor, taking `SQLite3Config`; the
      `@deprecated` positional overload and its bridging branch are gone.
- [ ] `new BetterSQLite3Adapter()` with no `database` raises
      `ArgumentError("No database file specified. Missing argument: database")`,
      matching `sqlite3_adapter.rb:106-107` — there is no `":memory:"` default.
- [ ] All 156 positional call sites pass `{ database: … }`; no `as never` or
      cast is introduced to make one typecheck.
- [ ] `SQLite3AdapterOptions` is folded into `SQLite3Config` or justified at its
      declaration.
- [ ] `pnpm typecheck` clean; sqlite3 suites green; pg and mysql2 untouched.
