---
title: "port-hwia-bang-forms-and-to-options"
status: done
updated: 2026-08-17
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6624
claim: "2026-08-17T01:02:54Z"
assignee: "port-hwia-bang-forms-and-to-options"
blocked-by: null
closed-reason: null
---

# Port HashWithIndifferentAccess's bang forms and `to_options` / `to_proc`

## Context

Follow-up to `port-hash-with-indifferent-access-residue` (see that story and
its PR for the receiver-shape decision: `[]`/`[]=` stay spelled `get()`/`set()`
per docs/ruby-ts-conventions.md "Operators", and `convert_key` /
`convert_value` / `convert_value_to_hash` are now real ports every reader and
writer routes through).

Remaining members in this group (Rails
`activesupport/lib/active_support/hash_with_indifferent_access.rb`):

- `to_options` / `to_options!` (:319, :321)
- `deep_symbolize_keys` (:320)
- `transform_keys!` (:345-352)
- `slice!` (:366-369)
- `to_proc` (:383-385) — may resolve as a `SKIP_GROUPS` entry (it returns a
  Ruby block receiver); if so it costs a reason in
  `scripts/parity/conventions.ts`, not a silent omission.

## Acceptance criteria

- [ ] The five ports land at the Rails names, routing through `convert_key` /
      `convert_value` where Rails does.
- [ ] `hash_with_indifferent_access.rb` reports 0 missing members once this and
      the defaults-family story have both landed, or the residue carries a
      `SKIP_GROUPS` entry with a reason.
- [ ] No new `parity:api:extra` surface, no new call-mismatch baseline rows.
