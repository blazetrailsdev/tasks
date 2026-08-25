---
title: "A Ruby writer resolves to set<Name> when its reader already claims the bare name"
status: done
updated: 2026-08-13
rfc: "0103-parity-api-scoring-correctness"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: 6452
claim: "2026-08-13T02:16:50Z"
assignee: "writer-resolves-to-set-name-when-reader-claims-bare"
blocked-by: null
closed-reason: null
---

## Context

`nameCandidates` in `scripts/api-compare/conventions.ts:940-954` offers a Ruby
writer `foo=` the bare camel name first and `setFoo` second. When Ruby defines
BOTH `foo` and `foo=` and trails ports them as two functions (`foo()` /
`setFoo()`), the writer resolves to the _reader_, and every call the writer's
Ruby body makes is then reported as missing from the reader's body.

Live instance from PR #6197: `Date.beginning_of_week=`
(`activesupport/lib/active_support/core_ext/date/calculations.rb:27-29`) calls
`find_beginning_of_week!` (`:32-35`). trails ports the pair as
`beginningOfWeek()` / `setBeginningOfWeek()` in
`packages/activesupport/src/date-ext.ts`, with the call in the writer where
Rails puts it — yet `parity:api:calls` reported
`beginning_of_week=  find_beginning_of_week!` as a new mismatch against
`beginningOfWeek`. It carries a `@missingRailsCall` receipt at
`date-ext.ts:48-55` purely to absorb the artifact.

## Converged shape

When a package exports both the bare camel name and `set<Name>`, a Ruby writer
should resolve to `set<Name>` — the reader has already claimed the bare name for
the Ruby reader of the same base. The reader-vs-writer pairing is knowable from
the extracted Ruby surface (both `foo` and `foo=` present), so this does not
need a new convention, only a tiebreak in the candidate walk.

Do NOT fix this by dropping the `set*` candidate or by broadening the
`@missingRailsCall` guidance.

## Acceptance criteria

- [ ] A Ruby `foo=` whose reader `foo` also exists resolves to `setFoo` when
      both TS names are present; the bare-name-first behaviour is unchanged
      where no `setFoo` exists (`table_name=` etc.).
- [ ] The `@missingRailsCall find_beginning_of_week!` tag at `date-ext.ts:48-55`
      is DELETED as part of this story.
- [ ] `pnpm parity:api:calls` / `parity:api` deltas non-negative; add the pairing case
      to `scripts/api-compare/conventions.test.ts`.

## Sweep note (2026-08-12)

**Citations corrected — the divergence itself is still live.**

- The candidate walk moved: there is no `nameCandidates` and no
  `scripts/api-compare/conventions.ts`. The writer arm is
  `scripts/parity/conventions.ts:1210-1220` (`if (name.endsWith("="))`), whose
  own comment states the ordering this story disputes: "`setX` is offered
  _after_ the bare camel name". The generated doc text is at `:1329-1338`.
- `packages/activesupport/src/date-ext.ts` was moved to
  `packages/activesupport/src/core-ext/date/calculations.ts` (PR #6286). The
  `@missingRailsCall find_beginning_of_week!` receipt this story deletes is at
  `core-ext/date/calculations.ts:52`.
