---
title: "HashWithIndifferentAccess#initialize must route every arm through update"
status: done
updated: 2026-08-15
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6573
claim: "2026-08-15T18:15:06Z"
assignee: "apply-join-dependency-inlines-except-and-select-association-list"
blocked-by: null
closed-reason: null
---

# `HashWithIndifferentAccess#initialize` must route every arm through `update`

## Context

Surfaced porting the HWIA converter group in PR #6568
(`port-hash-with-indifferent-access-residue`).

`hash_with_indifferent_access.rb:70-83`:

    def initialize(constructor = nil)
      if constructor.respond_to?(:to_hash)
        super()
        update(constructor)
        ...

Every populated arm goes through `update`, so every key gets `convert_key` and
every value `convert_value`. trails'
`packages/activesupport/src/hash-with-indifferent-access.ts` constructor has a
`constructor instanceof Map` arm that writes `this.data.set(String(key), value)`
directly, bypassing both converters — a Map-shaped entry point Rails does not
have, and the one remaining way to get an unconverted key or a raw nested plain
object into the hash.

## Converged shape

One populated arm, `this.update(constructor)`, as Rails has. The `Map` argument
either goes through `update` too (it is `to_hash`-able in the Ruby sense) or is
dropped from the accepted constructor types if nothing passes one.

## Acceptance criteria

- [ ] No write path into `data` bypasses `convertKey` / `convertValue` except
      `regularWriter`, which is Rails' own un-converting alias (:91).
- [ ] `pnpm parity:api:calls` green; no new baseline rows.
