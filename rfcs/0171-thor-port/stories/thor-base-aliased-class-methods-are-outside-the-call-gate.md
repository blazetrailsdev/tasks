---
title: "Thor::Base's eight aliased class methods are declared where the call gate compares them"
status: ready
updated: 2026-10-04
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
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

`packages/trailties/src/thor/base.ts` ports eight `Thor::Base::ClassMethods` methods as module-level
functions (`commands` `:256`, `allCommands` `:261`, `removeCommand` `:268`, `noCommands` `:286`,
`publicCommand` `:290`, `handleNoCommandError` `:311`, `findAndRefreshCommand` `:324`, `createCommand`
`:338`) and assigns each into the `ClassMethods` object literal twice, once at its own name and once at its
`*_task` alias (`vendor/thor/v1.3.2/lib/thor/base.rb:474,486,509,534,611,616,717,784`).

A body declared that way is not in the call-gate population: `scripts/api-compare/output/call-skeletons.json`
holds 37 `base.ts` rows for thor and none of these eight. `parity:api:calls` and `parity:api:calls:args`
therefore never compare them against `base.rb`.

trails#8475 hit the same shape in `thor/thor.ts` and converged it: each method is a real member (so it gets a
skeleton), and the alias is declared at the Rails line and assigned after the body
(`static declare defaultTask: typeof Thor.defaultCommand;` then `Thor.defaultTask = Thor.defaultCommand;`).

## Acceptance criteria

- [ ] Each of the eight methods is declared as a member of `ClassMethods` that `call-skeletons.json` records
      a row for, and its `*_task` alias is the same function.
- [ ] `parity:api --package thor` still credits all sixteen names for `base.rb`.
- [ ] Every call or argument row the gate then reports for those bodies is converged, not baselined.
