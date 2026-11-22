---
title: "sqlite3: Database constructor ports default_transaction_mode, extensions and the block arm"
status: done
updated: 2026-11-22
rfc: "0187-sqlite3-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#10524
claim: "2026-11-21T21:05:34Z"
assignee: "sqlite3-database-constructor-remaining-arms"
blocked-by: null
closed-reason: null
---

## Context

`packages/sqlite3/lib/database.ts`'s constructor ports `vendor/sqlite3/v2.6.0/lib/sqlite3/database.rb:141-195` (trails#10505), but leaves out:

- `@default_transaction_mode = options[:default_transaction_mode] || :deferred` (`:179`), read by `transaction` (`:651`) and `commit` (`:665`). Neither is ported.
- `initialize_extensions(options[:extensions])` (`:181`), which is `load_extension` (`:740-760`) over the C `load_extension_internal`.
- the block arm `yield self ensure close` (`:185-191`). A constructor can't own a promise, so the block's close needs a sync-only arm or a shape the operator rules on.

`utf16:` / `open16` (`:145-146`) is permanent: a JS string carries no encoding.

## Acceptance criteria

- [ ] `defaultTransactionMode` is stored as `database.rb:179` does, and `transaction` / `commit` are ported (`:651-670`).
- [ ] `initializeExtensions` / `loadExtension` are ported over an engine method; a test runs them against the fake engine.
- [ ] The constructor's block arm is ported, or an operator ruling records why it can't be.
- [ ] The README's not-ported paragraph is cut down to whatever remains.
