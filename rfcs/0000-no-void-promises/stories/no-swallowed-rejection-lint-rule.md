---
title: "blazetrails/no-swallowed-rejection bans unawaited empty rejection handlers"
status: draft
updated: 2026-11-12
rfc: "0000-no-void-promises"
cluster: gate
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC § Design 1. 42 source and 132 test sites attach `.catch(() => {})`,
`.catch(() => undefined)` or `.catch(() => null)` without awaiting the result,
e.g. `activesupport/lib/callbacks.ts:1021-1043`,
`activerecord/src/connection-adapters/abstract/connection-pool.ts:737,802`,
`activestorage/lib/service/mirror-service.ts:125`. An awaited
`await p.catch(() => null)` is Ruby's `rescue nil`
(`ruby-compat/lib/file.ts:995`, `trailties/lib/generators.ts:167`) and is
allowed.

## Acceptance criteria

- [ ] A rule in `eslint/` reports `.catch(fn)` / `.then(_, fn)` where `fn` has an empty body or only returns a literal, unless the call is the operand of `await` or `return`.
- [ ] RuleTester covers: statement form, `void` form, stored form, awaited form (allowed), returned form (allowed), handler with a body (allowed).
- [ ] Runs repo-wide against an only-shrink per-package mark seeded at the current count.

## Definition of done

An `eslint-disable`, a receipt tag, or a raised mark does not close this story.
