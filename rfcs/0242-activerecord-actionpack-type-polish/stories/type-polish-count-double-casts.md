---
title: "parity:lint:counts ratchets as-unknown-as in the five type-polish packages' lib"
status: done
updated: 2026-11-18
rfc: "0242-activerecord-actionpack-type-polish"
cluster: type-polish-gates
packages: [activerecord, actionpack, activesupport, activemodel, actionview]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#10290
claim: "2026-11-18T13:06:58Z"
assignee: "type-polish-count-double-casts"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:lint:counts` (`scripts/parity/eslint-count.ts`) counts
`no-explicit-any` warnings per file against `origin/main` for
`packages/activerecord/{lib,test}` (`eslint.config.mjs`, RFC 0037 block).
Nothing counts `as unknown as`: activerecord `lib/` has 202 and actionpack
`lib/` has 117 (activesupport 83, activemodel 42, actionview 51), and any of
them can grow without a red. The four packages other than activerecord are
also outside the `no-explicit-any` count and the
`blazetrails/no-explicit-any-disable` rule.

`eslint-count.ts` counts only ESLint rules (its `RULES` list:
`no-explicit-any`, `rails-error-parity`, `no-standalone-associations`), so a
double cast needs a rule before it can be counted.

## Acceptance criteria

- [ ] A new rule `eslint/no-double-cast.mjs` (`blazetrails/no-double-cast`)
      reports `x as unknown as T`, with a rule test.
- [ ] The rule is at `warn` on the `lib/**/*.ts` of activerecord,
      actionpack, activesupport, activemodel and actionview, and listed in
      `RULES`, so `parity:lint:counts` counts it per file against
      `origin/main`. A file's count may not grow. A file absent at the base
      counts 0 there (`eslint-count.ts`, "a key absent at the base counts 0"),
      so a newly added `lib/` file with one double cast is red. That is the
      same rule the `no-explicit-any` count applies today.
- [ ] The other four packages' `lib/` join the `no-explicit-any` count and
      `no-explicit-any-disable`.
- [ ] A unit test for the counter covers a file that grows, shrinks and is new.

## Verification

`pnpm parity:lint:counts` is green on the PR and red on a scratch commit
that adds one `as unknown as` to `packages/actionview/lib/layouts.ts`.

## Definition of done

Adding a mark file or allowlist does not close this story: the base tree is
the mark.
