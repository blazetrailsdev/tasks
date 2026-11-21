---
title: "sqlite3-statement-types-and-column-decltype"
status: ready
updated: 2026-11-21
rfc: "0187-sqlite3-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`SQLite3::Statement` (`packages/sqlite3/lib/statement.ts`, trails#10493) ports only the columns half of `get_metadata` (`vendor/sqlite3/v2.6.0/lib/sqlite3/statement.rb:179-188`). The `@types` field is seated as `null` but is never filled. `Statement#types` (`statement.rb:132-136`) and the C primitive `column_decltype` (`vendor/sqlite3/v2.6.0/ext/sqlite3/statement.c:430-449`) are not ported.

## Acceptance criteria

- [ ] `EngineStatement` gains `columnDecltype(index)`, returning `T | Promise<T>`.
- [ ] `Statement#columnDecltype` delegates to it after `mustBeOpenBang`.
- [ ] `getMetadata` fills `#types` as `statement.rb:184-187` does, lowercasing each decltype.
- [ ] `Statement#types` is ported, with `mustBeOpenBang`.
- [ ] The `types` assertions from `test_statement.rb` are ported.
