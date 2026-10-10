---
title: 'ruby-compat: toS strips the leading colon of any string that starts with one (":memory:" became "memory:")'
status: draft
updated: 2026-10-10
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["ruby-compat", "activerecord"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

ruby-compat's `toS(obj)` (`packages/ruby-compat/src/object.ts`) opens with
`if (isSymbol(obj)) return symbolToS(obj)`, and `isSymbol` (`packages/ruby-compat/src/symbol.ts:26`)
is `typeof value === "string" && value.startsWith(":")`. So `toS` of ANY string that begins with a
colon drops the colon, where Ruby's `String#to_s` (`rb_str_to_s`, `vendor/ruby/v3.3.11/string.c:6648`)
answers the receiver unchanged.

Found on trails#8740. `SQLite3Adapter#initialize` is `case @config[:database].to_s` /
`when ":memory:"`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:106-109`).
Ported as `toS(this._config.database)`, the in-memory database name `":memory:"` came back as
`"memory:"`, the `when` missed, and the adapter created files named `memory:`, `memory:-shm` and
`memory:-wal` in the working directory. That port now calls `rbObjAsString`, which does not strip.

The colon-kept spelling is ratified only for values whose Ruby type is a Symbol and whose control
flow turns on it (CLAUDE.md, "A Ruby Symbol is a JS string"). A `to_s` on user data (a database path,
a SQL fragment, a column value) has no such guarantee, and `toS` is called on `name`s in the quoting
modules (`connection-adapters/sqlite3/quoting.ts`, `mysql/quoting.ts`, `postgresql/quoting.ts`).

## Acceptance criteria

- [ ] Audit every `toS(` call in `packages/*/src`: each receiver is either Symbol-or-String by Rails'
      contract (keep) or arbitrary data (port as `rbObjAsString`).
- [ ] `toS`'s doc states the colon rule and names `rbObjAsString` as the port of `to_s` on data, or
      `toS` stops stripping and a separate `symbolToS` call is made where Rails has a Symbol.
- [ ] A ruby-compat test pins `":memory:"` through whichever function ports `String#to_s`.
