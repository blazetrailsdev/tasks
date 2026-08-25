---
title: "port-hwia-defaults-family"
status: done
updated: 2026-08-17
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6626
claim: "2026-08-17T01:42:50Z"
assignee: "port-hwia-defaults-family"
blocked-by: null
closed-reason: null
---

# Port HashWithIndifferentAccess's defaults family (`default`, `reverse_merge`, `set_defaults`)

## Context

Follow-up to `port-hash-with-indifferent-access-residue`, which shipped the
converters + readers group (PR for RFC 0098). That PR took
`hash_with_indifferent_access.rb` from 27 missing members to 12 by porting
`regular_writer`, `regular_update`, `key?`/`include?`/`has_key?`/`member?`,
`fetch`, `values_at`, `fetch_values`, `merge!`, `update_with_single_argument`,
`nested_under_indifferent_access`, `convert_key`, `convert_value` and
`convert_value_to_hash`, and routing `[]`/`[]=`/`update`/`replace`/`to_hash`
through the converters.

The receiver-shape question is settled: `[]`/`[]=` have no parity:api
counterpart (docs/ruby-ts-conventions.md "Operators"), so the class keeps
`get()`/`set()` and the `key?` family hangs off them.

Remaining in this group (Rails
`activesupport/lib/active_support/hash_with_indifferent_access.rb`):

- `default` (:225-231) — needs default/default_proc storage, which trails'
  class does not have at all; that is why it was deferred rather than stubbed.
- `reverse_merge` (:283-285) and its `with_defaults` alias
- `reverse_merge!` (:288-290) and its `with_defaults!` alias
- `set_defaults` (:415-421)

## Acceptance criteria

- [ ] All six members ported at the Rails names, `default`/`set_defaults` over
      real default storage populated by `initialize` (:70-83).
- [ ] `pnpm parity:api` reports the six as matched.
- [ ] No new `parity:api:extra` surface, no new call-mismatch baseline rows.
