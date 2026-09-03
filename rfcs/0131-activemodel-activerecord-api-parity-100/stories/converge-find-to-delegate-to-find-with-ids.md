---
title: "converge-find-to-delegate-to-find-with-ids"
status: claimed
updated: 2026-09-03
rfc: "0131-activemodel-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 8
pr: null
claim: "2026-09-03T15:54:31Z"
assignee: "move-remaining-transaction-manager-delegates-to-database-statements"
blocked-by: null
closed-reason: null
---

## Context

`FinderMethods#find` is `def find(*args); return super if block_given?;
find_with_ids(*args); end`
(`vendor/rails/activerecord/lib/active_record/relation/finder_methods.rb:98-101`)
— three lines that delegate the whole job to `find_with_ids`
(`finder_methods.rb:432-459`).

trails' `find` (`packages/activerecord/src/relation/finder-methods.ts:242`)
instead inlines a whole reimplementation: it normalizes the args itself, builds
an OR chain of `buildPkWhere` predicates for the composite-PK tuple case,
and does its own `where(...).limit(1).toArray()` / `where({pk: ids})` reads
with `raiseNotFoundSingle` / `raiseNotFoundAll` — never calling
`findWithIds` (`:729`), which is already the faithful port of
`find_with_ids` and already delegates to `findOne` / `findSome`.

The divergence was invisible to `parity:api:calls` while the function was
named `performFind`; PR renaming the finders to their Rails names (story
`rename-finder-methods-to-rails-names`) surfaced it as a NEW
`find -> find_with_ids` row, suppressed at the call site with
`@missingRailsCall find_with_ids — CONVERGEABLE <this story>`.

Converging is not a pure delegation swap: the inline body's composite-PK
multi-tuple branch has no counterpart in `findSome`
(`finder-methods.ts:752`), which does `where({ [pk]: ids })` with `pk` cast to
a string and cannot express a tuple set. So `findSome` (Rails
`find_some`, `finder_methods.rb:472-500`) needs the composite arm before
`find` can shrink to its Rails three lines.

## Acceptance criteria

- `find` in `relation/finder-methods.ts` is Rails' body: delegate to
  `findWithIds` with no inline normalization, predicate building, or reads.
- `findSome` / `findOne` carry whatever composite-PK handling the inline body
  had, at the Rails method that owns it.
- The `@missingRailsCall find_with_ids` tag on `find` is deleted, not reworded.
- `pnpm parity:api:calls` and `:calls:args` clean with no new baseline row;
  the AR `finder.test.ts`, `relations.test.ts` and composite-PK suites stay
  green on every adapter lane.
