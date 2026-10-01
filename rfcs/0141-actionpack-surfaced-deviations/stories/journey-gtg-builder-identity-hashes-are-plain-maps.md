---
title: "journey-gtg-builder-identity-hashes-are-plain-maps"
status: draft
updated: 2026-10-01
rfc: "0141-actionpack-surfaced-deviations"
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

`Journey::GTG::Builder#transition_table`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/journey/gtg/builder.rb:21-25`)
builds two identity hashes:

```ruby
marked   = {}.compare_by_identity
state_id = Hash.new { |h, k| h[k] = h.length }.compare_by_identity
```

and `#build_followpos` (`builder.rb:130-131`) a third:

```ruby
table = Hash.new { |h, k| h[k] = [] }.compare_by_identity
```

trails' `packages/actionpack/src/action-dispatch/journey/gtg/builder.ts` uses a
`Set` for `marked` (`:34`), a plain `Map` plus an open-coded miss branch for
`stateId` (`:35-41`), and a plain `Map` for `table` (`:172`). The keying is
already by identity, so behaviour matches, but the miss path lives at the read
site instead of in the default proc and `marked` is a different collection
type from Rails'.

ruby-compat's `Hash` carries both halves this needs: the `default_proc` seat
and, since `ruby-compat-hash-keys-by-identity-not-eql` (trails#8344),
`compareByIdentity()` (`packages/ruby-compat/src/hash.ts`, MRI
`rb_hash_compare_by_id`, `vendor/ruby/v3.3.11/hash.c:4427`).

## Acceptance criteria

- `marked`, `stateId` and `table` are `new Hash(...).compareByIdentity()` with
  the Rails default procs, matching `builder.rb:23-24,131`.
- Each read is the Rails read (`state_id[s]`, `marked[s]`, `table[i]`) with no
  open-coded miss branch.
- `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green and the
  journey test files pass.
