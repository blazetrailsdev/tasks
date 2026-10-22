---
title: "Port the RSpec matchers mini_magick's specs use to @blazetrails/vitest-matchers"
status: done
updated: 2026-10-22
rfc: "0203-mini-magick-port-to-100"
cluster: mini-magick-prereqs
packages: ["vitest-matchers"]
deps: []
deps-rfc: []
est-loc: 280
priority: null
pr: trails#9251
claim: "2026-10-22T19:53:21Z"
assignee: "ruby-compat-deprecate-constant-and-file-executable"
blocked-by: null
---

## Context

The generator lowers RSpec expectations to vitest matchers. Twelve of them have
no built-in vitest form and are not in `@blazetrails/vitest-matchers` on `main`.
Commit `9c7181ec6f` on the trails branch `mini-magick-port` adds them to
`packages/vitest-matchers/src/index.ts` with tests in `index.test.ts` (13 pass):

- value matchers `toStartWith` / `toEndWith` (rspec-expectations
  `start_or_end_with.rb`), `toInclude` (`include.rb`: substring, element by
  `==`, hash key, key/value pairs), `toContainExactly` (`contain_exactly.rb`),
  `toHaveKey`, `toBeBetween`;
- async block matchers `toChange` (`change.rb`, with `from` / `to` / `by`),
  `toYieldControl`, `toYieldWithNoArgs`, `toYieldWithArgs`,
  `toYieldSuccessiveArgs` (`yield.rb`, through a probe block; arguments match by
  `===` for a RegExp or class, else `==`), and `toOutput` (`output.rb`,
  capturing ruby-compat's `stdout` / `stderr`).

## Acceptance criteria

- The matchers land on `main` from `9c7181ec6f` (cherry-picked onto a branch
  from `main`), each with its rspec-expectations source cited in its JSDoc.
- Each matcher's message reads as rspec's does for the failing case.
- `pnpm vitest run packages/vitest-matchers` passes.
