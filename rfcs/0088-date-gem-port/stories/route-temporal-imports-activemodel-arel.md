---
title: "route-temporal-imports-activemodel-arel"
status: done
updated: 2026-08-06
rfc: "0088-date-gem-port"
cluster: null
deps: ["move-date-time-to-date-package"]
deps-rfc: []
est-loc: 200
pr: 6147
claim: "2026-08-06T00:53:04Z"
assignee: "converge-time-with-zone-strftime-onto-date-package"
blocked-by: null
closed-reason: null
---

## Context

**Integration slice 1 of the "Temporal comes from `packages/date`" flip.**

In Rails nothing re-exports `Date`/`Time` through ActiveSupport — a file that
needs them does `require "date"`, and ActiveSupport's `core_ext` _reopens_ those
classes rather than owning them. Trails inverted that: `Temporal` is re-exported
from `packages/activesupport/src/temporal.ts` (8 lines) and **153 files across
activemodel, arel and activerecord import it from there**, so the substrate
appears to belong to activesupport when it does not.

`date-package-scaffold` makes `activesupport/src/temporal.ts` a re-export from
`@blazetrails/date`, which keeps every existing import working. This story starts
converging the call sites onto the real owner.

Scope here is **activemodel (15 files, 9 non-test) and arel (8 files, 3
non-test)** — activerecord is a separate slice (`route-temporal-imports-activerecord`)
because it alone is 130 files, and the two must not overlap.

arel's temporal surface: `arel/src/temporal-tag.ts`, `nodes/binary.ts`,
`visitors/ruby-class.ts`, plus `test-helpers/{connection,default-quoter}.ts`.

**Out of scope: actionpack.** Its 4 files stay on the activesupport path; its
date handling is an HTTP-header concern tracked separately in RFC 0023
(`actionpack-http-cache-layer-uses-js-date`).

## Acceptance criteria

- [ ] Every `@blazetrails/activesupport/temporal` import in `packages/activemodel`
      and `packages/arel` becomes `@blazetrails/date`.
- [ ] `packages/{activemodel,arel}/package.json` declare `@blazetrails/date`.
- [ ] **No `instanceof` regressions.** `instanceof` is identity-sensitive across
      module instances; the whole point of single ownership is that
      `value instanceof Temporal.PlainDate` keeps working. Verify the AR quoting
      guards (`connection-adapters/abstract/quoting.ts:155-158`) still accept
      values produced by activemodel types.
- [ ] `packages/activesupport/src/temporal.ts` still re-exports for the
      not-yet-converged packages — **do not delete it here.**
- [ ] Mechanical only: no behavior change, no type change. Note it in the PR body.
- [ ] `pnpm typecheck` green; AM and arel suites pass.
