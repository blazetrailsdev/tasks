---
title: "Port HashWithIndifferentAccess's last six members (to_options family, transform_keys!, slice!, to_proc)"
status: done
updated: 2026-08-17
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6635
claim: "2026-08-17T09:37:51Z"
assignee: "port-date-time-to-fs-onto-the-datetime-receiver"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #6626, which took
`packages/activesupport/src/hash-with-indifferent-access.ts` from 12 missing
members to 6 by porting the defaults family (`default`, `dup`,
`reverse_merge`/`with_defaults`, `reverse_merge!`/`with_defaults!`,
`set_defaults`).

The six still missing against
`vendor/rails/activesupport/lib/active_support/hash_with_indifferent_access.rb`,
measured with `pnpm parity:api` on the merge commit:

- `to_options` (:363) — `alias_method :to_options, :symbolize_keys`
- `to_options!` (:366) — `alias_method :to_options!, :symbolize_keys!`
- `deep_symbolize_keys` (:359-361) — `to_hash.deep_symbolize_keys!`
- `transform_keys!` (:313-316) — `_, keys = keys.partition { ... }` shape;
  the un-bang `transform_keys` is already ported
- `slice!` (:333-336) — `Hash#slice!` over converted keys; note
  `core-ext/hash/slice.ts`'s `sliceBang` is the plain-object one, not this
- `to_proc` (:383-385) — `proc { |key| self[key] }`

`slice!` and `to_proc` are the two with real bodies; the rest are aliases or
one-liners over already-ported members.

## Acceptance criteria

- [ ] All six ported at the Rails names, `parity:api` for
      `hash_with_indifferent_access.rb` reports 0 missing.
- [ ] No new `parity:api:extra` surface, no new call-mismatch baseline rows.
