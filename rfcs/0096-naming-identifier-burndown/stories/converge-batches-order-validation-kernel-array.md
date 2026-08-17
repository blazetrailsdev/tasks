---
title: "converge-batches-order-validation-kernel-array"
status: done
updated: 2026-08-17
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6646
claim: "2026-08-17T12:10:23Z"
assignee: "converge-batches-order-validation-kernel-array"
blocked-by: null
closed-reason: null
---

## Context

`ensure_valid_options_for_batching!`'s `:order` validation
(`vendor/rails/activerecord/lib/active_record/relation/batches.rb:323-325`) is:

```ruby
if (Array(order) - [:asc, :desc]).any?
  raise ArgumentError, ":order must be :asc or :desc or an array consisting of :asc or :desc, got #{order.inspect}"
end
```

trails (`packages/activerecord/src/relation/batches.ts`, end of
`ensureValidOptionsForBatchingBang`) diverges on three counts:

- it normalizes with a bespoke `Array.isArray(order) ? order : [order]`
  rather than `kernelArray`, which is the settled spelling of `Kernel#Array`
  (`packages/activesupport/src/array-utils.ts`) — the last such site in the
  file after PR #6633 converged the other six;
- it loops per element (`for (const o of orderArr)`) where Rails does one set
  subtraction, so the branch shape does not mirror the Ruby;
- the message is `:order must be :asc or :desc, got X`, dropping Rails'
  "or an array consisting of :asc or :desc" clause and the `inspect`
  rendering of the value.

Surfaced during review of PR #6633 (RFC 0096 `wave-4-naming-ar-relation`),
which deliberately scoped itself to the `Kernel#Array` call sites the story
named; this one sits outside those line numbers.

## Acceptance criteria

- [ ] The check is one `kernelArray(order)` subtraction against `["asc","desc"]`,
      mirroring `batches.rb:323`.
- [ ] The ArgumentError message matches Rails verbatim, including the
      `inspect` rendering of `order`.
- [ ] No new `shape` rows in `pnpm parity:api:calls:args`.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
