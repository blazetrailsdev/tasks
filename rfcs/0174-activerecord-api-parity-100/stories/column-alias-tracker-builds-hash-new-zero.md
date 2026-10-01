---
title: "activerecord: Calculations ColumnAliasTracker builds Hash.new(0)"
status: draft
updated: 2026-10-01
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
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

`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/calculations.rb:8-12` builds
`@aliases = Hash.new(0)` in `ColumnAliasTracker#initialize`, and `alias_for` (`:14-26`) reads
`@aliases[aliased_name] == 0` and `count = @aliases[aliased_name] += 1` with no nil guard.

`packages/activerecord/src/relation/calculations.ts` `ColumnAliasTracker` holds a plain
`Map<string, number>` and spells each read `(this.aliases.get(aliasedName) ?? 0)`. That is the same
shape trails#8324 retired from `AliasTracker`: ruby-compat's `Hash`
(`packages/ruby-compat/src/hash.ts`) carries Ruby's `default` seat.

## Acceptance criteria

- [ ] `ColumnAliasTracker` initializes `aliases` as `new Hash<string, number>(0)` and `aliasFor` reads it without `?? 0`, branch for branch with `calculations.rb:14-26`.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green; grouped-calculation tests green.
