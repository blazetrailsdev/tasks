---
title: "Seat Associations/ConnectionAdapters/Encryption namespaces on ActiveRecord so constantize resolves them"
status: in-progress
updated: 2026-09-25
rfc: "0151-activesupport-autoload-slot-registry"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: 22
pr: trails#8094
claim: "2026-09-25T16:19:00Z"
assignee: "seat-nested-namespaces-on-active-record"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activerecord/lib/active_record.rb` autoloads the nested namespaces on `ActiveRecord`:
`autoload :Encryption` (`:51`), `autoload :Associations` (`:98`, under `eager_autoload`), and
`module ConnectionAdapters` is nested at `connection_adapters.rb:5`. So `ActiveRecord::Encryption`,
`ActiveRecord::Associations` and `ActiveRecord::ConnectionAdapters` are constants of `ActiveRecord`,
and `ActiveSupport::Inflector.constantize` (`Object.const_get`, `inflector/methods.rb:289-291`) resolves them.

In trails, `packages/activerecord/src/namespaces.ts` defines `Associations`, `ConnectionAdapters` and
`Encryption` as separate namespace objects but never seats them on `ActiveRecord` (there is no
`ActiveRecord.Associations` / `.ConnectionAdapters` / `.Encryption`). Since trails#8068, `constantize`
walks each segment through the constant seated on the enclosing namespace, and `ActiveRecord` registers
itself, so `constantize("ActiveRecord::Encryption")` / `"ActiveRecord::Associations::CollectionProxy"`
raise `NameError` where Ruby resolves them.

`packages/activerecord/src/connection-adapters.ts` also exports an invented
`interface ConnectionAdapters { readonly AbstractAdapter: unknown }`, which forced the
`ConnectionAdapters as ConnectionAdaptersNamespace` import alias in trails#8068.

## Acceptance criteria

- `ActiveRecord.autoload("Encryption")`, `ActiveRecord.autoload("Associations")` (under `eagerAutoload`,
  as `active_record.rb:98`) and a `ConnectionAdapters` seat, each seated with its namespace object,
  typed on the `ActiveRecord` namespace.
- `constantize("ActiveRecord::Encryption")`, `"ActiveRecord::Associations::CollectionProxy"` and
  `"ActiveRecord::ConnectionAdapters::ConnectionPool"` resolve (a trails test).
- The invented `ConnectionAdapters` interface in `connection-adapters.ts` is deleted if nothing reads it,
  and the import alias goes with it.
