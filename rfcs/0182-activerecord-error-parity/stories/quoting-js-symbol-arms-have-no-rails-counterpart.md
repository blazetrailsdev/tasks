---
title: "activerecord: quote/typeCast JS Symbol arms have no Rails counterpart"
status: done
updated: 2026-10-06
rfc: "0182-activerecord-error-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#8600
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`quote` and `typeCast` in `packages/activerecord/src/connection-adapters/abstract/quoting.ts` each carry a `typeof value === "symbol"` arm standing in for Rails' `when Symbol` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/quoting.rb:76` and `:97`, both `value.to_s`).

CLAUDE.md § "Ruby idioms that do not translate literally" says a Ruby Symbol is a JS string, never a JS `Symbol`, so these arms answer a value no Rails caller produces. They also diverge from each other for a description-less symbol: `quote` raises `TypeError("Cannot quote a Symbol without a description")`, `typeCast` returns `"Symbol()"`. Neither has a Ruby analogue.

Trails tests pin both: `sql-default.trails.test.ts` ("quotes symbols by description", "throws for symbols without description") and `connection-adapters/sqlite3/quoting.trails.test.ts` ("casts a symbol through the inherited abstract arm").

Surfaced in review of trails#8600, which left the arms in place.

## Acceptance criteria

- [ ] Decide whether any production caller passes a JS `Symbol` to `quote` / `typeCast`; if none, delete both arms and the trails tests pinning them.
- [ ] If a caller does, converge it onto a string and then delete the arms.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:arms:throws` stay green.
