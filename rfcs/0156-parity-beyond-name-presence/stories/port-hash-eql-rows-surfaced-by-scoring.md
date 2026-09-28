---
title: "port-hash-eql-rows-surfaced-by-scoring"
status: draft
updated: 2026-09-28
rfc: "0156-parity-beyond-name-presence"
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

`score-hash-eql-through-rbhash-rbequal` removed `hash` / `eql?` from `SKIP_GROUPS`
(`scripts/parity/conventions.ts`), so they are scored by name (`hash` → `hash`, `eql?` → `eql`).
That surfaced 26 missing rows, each a Rails `hash` / `eql?` (usually `alias :eql? :==`) whose TS
file ports `==` as `equals` but no `eql` / `hash`:

- activerecord: `connection_adapters/column.rb`, `mysql/type_metadata.rb`,
  `postgresql/column.rb`, `postgresql/type_metadata.rb`, `postgresql/utils.rb` (`Name`),
  `sql_type_metadata.rb`, `sqlite3/column.rb` — `eql?`; `relation/query_attribute.rb`,
  `relation/where_clause.rb` — `eql?` + `hash`.
- activemodel: `attribute.rb`, `error.rb`, `type/value.rb` — `eql?` + `hash`.
- activesupport: `core_ext/time/calculations.rb` `Time#eql?`; `duration.rb` `hash`;
  `time_with_zone.rb` `hash`.
- actiondispatch: `http/mime_type.rb` `Mime::Type#hash` / `#eql?`.
- actioncontroller: `metal/strong_parameters.rb` `Parameters#hash`.
- actionview: `lookup_context.rb` `DetailsKey#eql?`.
- globalid: `global_id.rb` `GlobalID#eql?` / `#hash`.

These matter at run time, not only for parity: `rbHash` / `rbEqual` (ruby-compat), `uniq`,
`Deduplicable#deduplicate` and the preloader batch grouping dispatch to a TS `hash()` / `eql()`,
so a class without them falls back to identity where Rails compares by value.

## Acceptance criteria

- Each row above is ported in the mirroring TS file, as Rails defines it (an `alias :eql? :==`
  is an `eql` that answers what `equals` answers; `hash` hashes the same fields `==` compares).
- `parity:api` matched rises by the rows ported; nothing is baselined.
