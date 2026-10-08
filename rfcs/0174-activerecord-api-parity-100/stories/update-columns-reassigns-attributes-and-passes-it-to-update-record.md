---
title: "activerecord: update_columns reassigns attributes and passes it to _update_record"
status: ready
updated: 2026-10-08
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
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

`Persistence#update_columns`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/persistence.rb:616-624`) reassigns its
parameter and passes it on:

    attributes = attributes.each_with_object({}) do |(k, v), h|
      h[k] = @attributes.write_cast_value(k, v)
      clear_attribute_change(k)
    end

    affected_rows = self.class._update_record(attributes, update_constraints)

Since trails#8660 `_updateRecord` (`packages/activerecord/src/persistence.ts`) takes the
`Hash` that `attributes_with_values` returns, so `updateColumns` builds the memo `h` as a
`Hash` and passes `h`, with no `attributes = …` reassignment: the parameter is typed
`Record<string, unknown>`, which a `Hash` (a `Map`) is not assignable to, and the pairs are
read with `Object.entries`. The reviewer accepted this in the PR body; it is still a local the
Rails body does not pass.

## Acceptance criteria

- [ ] `updateColumns` reassigns `attributes` to the `each_with_object` result and passes
      `attributes` to `_updateRecord`, as `persistence.rb:616-624` does.
- [ ] Its parameter admits what the body actually reads: the pairs are read through a call that
      answers both a plain object and a `Hash` (ruby-compat `eachPair`, or an `eachWithObject`
      port), so widening the type is not a false signature.
- [ ] `persistence.test.ts` stays green; `pnpm parity:api:calls` and `:calls:args` green with no
      new row.
