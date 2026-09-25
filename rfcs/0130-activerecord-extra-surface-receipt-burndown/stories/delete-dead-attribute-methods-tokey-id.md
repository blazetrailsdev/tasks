---
title: "Delete dead toKey/id duplicates in attribute-methods.ts"
status: ready
updated: 2026-09-25
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/attribute-methods.ts:673-697` still exports `toKey` and
`id(value?)`, dead duplicates of the ported `AttributeMethods::PrimaryKey` members.
`Base` wires `toKey` from `attribute-methods/primary-key.ts` (`base.ts:220`, `:2778`),
and nothing imports either function from `attribute-methods.ts`.

They also diverge from Rails:

- `toKey` collapses any key containing `null` to `null`. Rails' `to_key` is
  `key = id; Array(key) if key` (`activerecord/lib/active_record/attribute_methods/primary_key.rb:11-14`),
  so a new composite-pk record gives `[nil, nil]`. trails#8054 converged the live copy
  in `primary-key.ts` and left this one.
- `id(value?)` merges the reader and the writer into one function, and its composite
  arm raises `TypeError` with an invented message. Rails' message is
  `"Expected value matching #{self.class.primary_key.inspect}, got #{value.inspect}."`
  (`attribute_methods/composite_primary_key.rb:27`), and the live port lives in
  `attribute-methods/composite-primary-key.ts`.

## Acceptance criteria

- `toKey` and `id` are deleted from `attribute-methods.ts`, along with any interface
  members only they used.
- `pnpm parity:api:extra:gate` and `pnpm typecheck` stay green.
