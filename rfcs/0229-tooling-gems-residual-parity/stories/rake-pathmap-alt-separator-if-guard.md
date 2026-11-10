---
title: "rake pathmap tests mirror Rails' if File::ALT_SEPARATOR guard instead of vacuous ternaries"
status: ready
updated: 2026-11-10
rfc: "0229-tooling-gems-residual-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails guards platform-only assertions with `if File::ALT_SEPARATOR`
(`vendor/rake/v13.2.1/test/test_rake_path_map_explode.rb:25-32`,
`vendor/rake/v13.2.1/test/test_rake_path_map.rb:136-141`). trails#9947 could not write that
guard. Two rules forbid an `if` around an `expect`: `vitest/no-conditional-in-test` and
`vitest/no-conditional-expect` (`eslint.config.mjs:1076-1089`). And a loop over the cases
red-flags the assertion-mismatch ratchet, which counts the loop as one assertion. So
`packages/rake/test/test-rake-path-map-explode.test.ts` and `test-rake-path-map.test.ts`
("works with windows separators") write
`expect(File.ALT_SEPARATOR ? pathmapExplode("c:a") : ["c:.", "a"]).toEqual(["c:.", "a"])`,
which compares a literal to itself off Windows.

## Acceptance criteria

- [ ] The conditional-test lint admits an `if` whose condition is a platform constant
      (`File.ALT_SEPARATOR`), as `eslint/no-conditional-in-test.mjs` already admits an
      adapter condition, and the assertion comparer counts the `expect`s inside it one per line.
- [ ] Both rake tests are written as Rails' `if` block with plain `expect`s, and the ternaries are gone.
- [ ] `pnpm parity:test --package rake --assertions` shows no mismatch.
