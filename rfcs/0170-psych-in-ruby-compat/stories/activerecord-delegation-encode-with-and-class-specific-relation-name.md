---
title: "activerecord: Delegation#encode_with"
status: ready
updated: 2026-09-30
rfc: "0170-psych-in-ruby-compat"
cluster: api-surface
packages: ["activerecord"]
deps: ["psych-object-to-yaml"]
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

Narrowed on 2026-10-11. The `ClassSpecificRelation` `name` half moved to
`relation-strict-loading-scope-class-and-class-specific-relation-name` (RFC 0156), which waits on
nothing. This story keeps the one row that needs Psych.

`Delegation` (`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/delegation.rb:101-104`)
lists `:encode_with` in its `delegate ... to: :records`, beside `:to_xml`, `:length`, `:each` and the
rest. The delegated method forwards its `coder` argument to the records Array. `Relation` also
defines `encode_with` itself (`relation.rb:347-350`), ported by
`activerecord-relation-encode-with-and-strict-loading-scope`.

The argument is a `Psych::Coder`, which ruby-compat gains with `psych-object-to-yaml`, this story's
dep.

## Acceptance criteria

- [ ] `encodeWith` is in `relation/delegation.ts`'s delegate-to-`records` list at its Rails position,
      generated the way that list's other members are.
- [ ] `relation/delegation.rb` has no missing `encode_with` row in `parity:api`.

## Verification

```bash
pnpm build && pnpm parity:api && pnpm parity:api:calls && pnpm parity:api:calls:args
```
