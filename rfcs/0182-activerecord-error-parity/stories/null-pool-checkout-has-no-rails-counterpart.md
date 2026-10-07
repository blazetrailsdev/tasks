---
title: "NullPool#checkout and its ConnectionNotEstablished message have no Rails counterpart"
status: draft
updated: 2026-10-07
rfc: "0182-activerecord-error-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActiveRecord::ConnectionAdapters::NullPool`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:14-48`)
defines `server_version`, `schema_reflection`, `schema_cache`,
`connection_descriptor`, `checkin`, `remove`, `async_executor`, `db_config` and
`dirties_query_cache`. It has no `checkout`: calling one raises `NoMethodError`.

trails' `NullPool` (`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts`)
defines `checkout(): never`, which throws
`new ConnectionNotEstablished("NullPool does not support checkout")`. Both the
method and the message are invented. `blazetrails/rails-error-parity`'s
`inventedMessage` arm (trails#8612) cannot see it, because Rails has no
`checkout` on `NullPool` to raise the class bare in.

## Acceptance criteria

- [ ] `NullPool#checkout` is deleted, or its caller is shown to need it and the
      story is blocked with that caller's `file:line`.
- [ ] No caller relies on `ConnectionNotEstablished` from a `NullPool` checkout.
