---
title: "cachedFindBy passes the keys Array, not a JSON string, to cachedFindByStatement"
status: draft
updated: 2026-09-24
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Core::ClassMethods#cached_find_by` (`vendor/rails/activerecord/lib/active_record/core.rb:441-455`) passes the `keys` Array itself to `cached_find_by_statement(connection, keys)`. The cache is a `Concurrent::Map`, so an equal (`eql?`) Array hits the same statement.

trails' `cachedFindBy` (`packages/activerecord/src/core.ts`, around `:819`) passes `JSON.stringify(keys)`, a String Rails never builds. trails#8039 made `cachedFindByStatement` accept a non-string key and compare an Array key by `rbEql`, so that string is no longer needed. `bind-parameter.test.ts`'s `cachedStatement` helper does the same thing (`JSON.stringify(key)`), mirroring Rails' `cached_find_by_statement(connection, keys)` in `bind_parameter_test.rb`.

## Acceptance criteria

- `cachedFindBy` calls `cachedFindByStatement(connection, keys, …)` with the Array, as `core.rb:443` does.
- `bind-parameter.test.ts`'s helper passes the Array key too.
- The "find by cache does not duplicate entries" test (`core.test.ts`) still passes, showing that equal key Arrays share one entry.
