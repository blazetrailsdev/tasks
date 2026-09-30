---
title: "Adopt rbObjDup/rbObjClone at the remaining open-coded copy sites across packages"
status: draft
updated: 2026-09-30
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8290 ratified `rbObjDup` / `rbObjClone` (`@blazetrails/ruby-compat`) as the one spelling of Ruby
`obj.dup` / `obj.clone` (CLAUDE.md, "Fidelity is the job"). These non-activemodel sites still build the copy
by hand (`Object.create(Object.getPrototypeOf(x))` + `Object.assign` or `initializeCopy`):

- activerecord: `core.ts:741` `clone`, `aggregations.ts:151`, `encryption/contexts.ts:21`, and `relation.ts:1748`, `association-relation.ts:35`, `disable-joins-association-relation.ts:181` (`Relation#spawn`/`clone`, which reach `initialize_copy`, `relation.rb:76`)
- activesupport: `broadcast-logger.ts:176`, `current-attributes.ts:202`, `deep-mergeable.ts:14`
- actionview: `buffers.ts:84` (`OutputBuffer#initialize_copy`); arel: `clone-support.ts:5`
- actionpack: `testing/integration.ts:441` (`open_session`'s `dup`, `integration.rb:392`)
- ruby-compat: `uri/generic.ts:484`
- rack-test: `test.ts:230`

## Converged shape

Each site calls `rbObjDup(x)` / `rbObjClone(x)` according to which one the Ruby source calls, and the class's
`initialize_copy` / `initialize_dup` / `initialize_clone` is ported at its Rails name so the helper
dispatches it. Where a site is `Object#clone` on a frozen value (`aggregations.ts`), the helper's
frozen-carry replaces the manual `Object.freeze`.

## Acceptance criteria

- The listed sites no longer call `Object.create` to build a copy. Any site that has to keep doing so carries a receipt.
- Each package's dup/clone tests stay green.
