---
title: "explain-payload-binds-carry-query-attributes"
status: done
updated: 2026-08-16
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6616
claim: "2026-08-16T22:53:03Z"
assignee: "converge-relation-select-and-join-residue"
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Explain#render_bind` (explain.rb:40-51) has two arms:

```ruby
if ActiveModel::Attribute === attr
  value = ... connection.type_cast(attr.value_for_database)
else
  value = connection.type_cast(attr)
  attr  = nil
end
[attr&.name, value]
```

In Rails the first arm is the one that fires in practice: the
`sql.active_record` payload carries `QueryAttribute` binds, so
`exec_explain` renders `[["id", 1]]`. Rails' own SQLite EXPLAIN test asserts
exactly that (`test/cases/adapters/sqlite3/explain_test.rb:11`).

trails' adapters instrument the notification with plain bind VALUES, not
`QueryAttribute`s (`explain-subscriber.ts` pushes `payload.binds` straight
through, and `ExplainPayload.binds` is `unknown[]`). So the non-Attribute arm
fires and the rendered header is `[[nil, 1]]`.

PR converging `exec_explain`/`build_explain_clause` into the `Explain` mixin
(RFC 0107 `converge-explain-exec-and-build-clause-into-one-mixin`) routed bind
rendering through `renderBind` as Rails does at explain.rb:24, which surfaced
this gap: `packages/activerecord/src/adapters/sqlite3/explain.test.ts` now
carries a trails-only `\[\[nil, 1\]\]` alternative next to the Rails
`\[\["id", 1\]\]` one, with a comment pointing here.

## Acceptance criteria

- [ ] The `sql.active_record` payload carries the `QueryAttribute` bind objects
      the query was built with, on every adapter that instruments a query.
- [ ] `ExplainSubscriber`/`ExplainRegistry` pass them through unchanged.
- [ ] `renderBind`'s Attribute arm (explain.rb:41-46) is the one that fires for
      a real relation, so `exec_explain` renders `[["id", 1]]`.
- [ ] The trails-only `\[\[nil, 1\]\]` alternatives are deleted from
      `adapters/sqlite3/explain.test.ts`, leaving the Rails regex verbatim.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
