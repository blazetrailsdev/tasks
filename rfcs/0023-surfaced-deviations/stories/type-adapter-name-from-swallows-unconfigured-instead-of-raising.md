---
title: "Type.adapterNameFrom falls back to sqlite where Rails raises on an unconfigured model"
status: draft
updated: 2026-07-24
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActiveRecord::Type.adapter_name_from`
(vendor/rails/activerecord/lib/active_record/type.rb:49-51) is
`model.connection_db_config.adapter.to_sym` with no rescue: a model with no
configured connection makes `connection_pool` (strict: true) raise
`ConnectionNotEstablished`, and that propagates.

trails' port (packages/activerecord/src/type.ts:129-141, landed in #5181)
catches `ConnectionNotEstablished` and returns `"sqlite"`. The catch is
deliberately narrow — any other error propagates — and the deviation is
justified at the call site, but it is still a deviation: trails resolves
adapter names during module load and during `attribute()` declarations that can
run before `establishConnection`, so raising there would break importing a
model file without a connection.

Converging means removing the reason those call sites run unconfigured (lazy
resolution at the point of use rather than at declaration time), not deleting
the catch and accepting the raise.

## Acceptance criteria

- `adapterNameFrom` matches Rails: no fallback, `ConnectionNotEstablished`
  propagates.
- The call paths that previously depended on the fallback (module-load type
  registration, `attribute()` before `establishConnection`) resolve lazily so
  they no longer hit an unconfigured model, or are shown never to have.
- `type.trails.test.ts`'s "falls back to sqlite when the model has no
  configuration" test is replaced by one asserting the raise.

## Definition of done

## Verification
