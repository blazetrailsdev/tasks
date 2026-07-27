---
title: "converge-instantiate-sti-extra-surface"
status: ready
updated: 2026-07-27
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/inheritance.ts:717` exports `instantiateSti`, a
trails-only wrapper with no Rails counterpart — Rails' STI construction path is
`instantiate` -> `discriminate_class_for_record` -> `find_sti_class`
(`vendor/rails/activerecord/lib/active_record/inheritance.rb:278`,
`persistence.rb`). It is re-exported publicly from
`packages/activerecord/src/index.ts:137` and called from
`packages/activerecord/src/base.ts:2939`.

It has always been extra TS surface, but `scripts/api-compare/extra-surface.ts`
did not report it while `inheritance.ts` contained no class container. PR #5387
added `export class ClassMethods` to that file (converging `abstract_class=`
onto a static accessor), which made the file's function bucket visible and
surfaced `instantiateSti` as `1 novel`. Net novel surface still fell 426 -> 424
in that PR; this story is the leftover.

## Acceptance criteria

- `instantiateSti` either converges onto the Rails call path
  (`discriminateClassForRecord` + the shared `instantiate`), or is made
  non-public surface (drop the `index.ts` re-export and tag the declaration
  `@internal`) if it is genuinely an internal construction helper.
- No new `extra-surface-allow.json` entry and no `@noRailsEquivalent` tag.
- `activerecord` novel extra-surface count decreases by at least 1.
- `pnpm api:compare` matched-method count does not regress.
