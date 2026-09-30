---
title: "activerecord: Delegation#encode_with and ClassSpecificRelation.name"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: api-surface
packages: ["activerecord"]
deps: ["psych-object-to-yaml"]
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`relation/delegation.rb → relation/delegation.ts` scores 45/47:

- `Delegation#encode_with` (`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/delegation.rb:101`) — delegates to
  `records` so a delegated relation dumps like an Array.
- `Delegation::ClassSpecificRelation::ClassMethods#name` (`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/delegation.rb:106,112`) —
  `superclass.name`, so `Post.all.class.name` reads `"ActiveRecord::Relation"`-family names rather than
  the generated subclass's.

## Acceptance criteria

- [ ] Both are ported in `relation/delegation.ts`; the generated relation subclasses answer `name` as Rails does.
- [ ] `relation/delegation.rb` scores 47/47.

## Verification

```bash
pnpm build && pnpm parity:api && pnpm parity:api:calls && pnpm parity:api:calls:args
```
