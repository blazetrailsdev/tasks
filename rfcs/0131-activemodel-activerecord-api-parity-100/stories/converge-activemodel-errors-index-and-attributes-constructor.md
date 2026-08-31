---
title: "Give Errors its [] reader and Attributes its constructor, closing activemodel to 754/754"
status: draft
updated: 2026-08-31
rfc: "0131-activemodel-activerecord-api-parity-100"
cluster: null
packages:
  - activemodel
deps: []
deps-rfc: []
est-loc: 170
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

activemodel's two remaining misses after the three bucket-A stories, neither
declaration-only.

**`errors.rb` `[]` → `get`.** Rails
`vendor/rails/activemodel/lib/active_model/errors.rb:229`,
`def [](attribute)`, returning `messages_for(attribute)`.
`docs/ruby-ts-conventions.md` maps Ruby's `[]` to `get`, and
`packages/activemodel/src/errors.ts` has no `get` — the lookup is reachable
some other way, so this is a spelling and surface miss, not absent behavior.

**`attributes.rb` `initialize` → `constructor`.** Rails
`vendor/lib/active_model/attributes.rb:106`, `def initialize(*)`, which seeds
`@attributes` from `_default_attributes` before calling `super`. trails'
`packages/activemodel/src/attributes.ts` has no constructor, so the
initialization happens somewhere a Rails developer opening the file would not
find it.

`initialize_dup` (`attributes.rb:111`) already matches and is not in scope.

## Acceptance criteria

- `Errors` gains `get(attribute)` with Rails' body, and every in-repo caller
  that reaches the same data by another route is switched to it.
- `Attributes` gains a constructor holding Rails' body, and the initialization
  it replaces is removed rather than duplicated.
- activemodel `errors.rb` reaches **33/33** and `attributes.rb` **17/17**.
- **activemodel reaches 754/754 methods and 67/67 files** — this story and
  `port-gem-version-files` are the last two in the package, so whichever lands
  second states the 100% figure in its PR body.
- `pnpm parity:api:calls`, `:calls:args` and `:params` clean; no new baseline
  row and no `@noRailsEquivalent`.

## Definition of done

A `get` that duplicates an existing lookup rather than replacing it does not close this story — two routes to the same data is new surface, not convergence.

## Verification

```sh
pnpm build
API_COMPARE_FORCE=1 pnpm parity:api --package activemodel
pnpm parity:api:calls
pnpm parity:api:calls:args
pnpm parity:api:params
```

The summary line must read `activemodel — 754/754 methods (100%) | files: 67/67`
once `port-gem-version-files` has also landed.
