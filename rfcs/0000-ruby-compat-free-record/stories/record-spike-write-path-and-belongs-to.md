---
title: "Record spike: create, update, destroy and belongsTo"
status: draft
updated: 2026-11-24
rfc: "0000-ruby-compat-free-record"
cluster: spike
packages: []
deps: ["record-spike-reflection-and-read-path"]
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The second half of the spike in the RFC README's "Rollout", on top of
`record-spike-reflection-and-read-path`. The read path alone cannot show
what dirty tracking and association loading cost, and those are where
ActiveRecord dispatches by computed name (README, "What depends on
ruby-compat, feature by feature", rows "Associations" and "Attribute methods
and assignment").

## Acceptance criteria

- [ ] `new Model(attributes)`, `save`, `create`, `createBang`, `update`,
      `destroy`, `isPersisted`, `isNewRecord`, with the names and signatures
      of `@blazetrails/activerecord`.
- [ ] Assignment by attribute name goes through a per-model table built at
      schema load, not through a string-keyed send.
- [ ] `changes` and `isChanged` for assigned attributes; `update` writes only
      changed columns, as ActiveRecord does.
- [ ] `static { this.belongsTo("author", { className: "Author", foreignKey: "author_id" }) }`
      defines the reader and writer at declaration time. Both options are
      required in the spike, which has no inflector; the class is found in a
      module-private map of spike models by name. The reader's return type is ActiveRecord's
      (`Author | null | Promise<Author | null>`), and `includes("author")`
      loads it in one extra query.
- [ ] For each write the spike supports, a test asserts the SQL and binds
      equal what `@blazetrails/activerecord` sends, read through a
      `sql.active_record` subscriber on the faithful side.
- [ ] The boot-graph check still reports 0 ruby-compat modules.
- [ ] The bench reports insert and update of 12,000 rows through the spike,
      ActiveRecord and the bare driver.

## Definition of done

Validations, callbacks and transactions are not part of the spike. A
`belongsTo` reader that always returns a promise does not close this story:
Open question 4 is answered by measuring the drop-in return type.
