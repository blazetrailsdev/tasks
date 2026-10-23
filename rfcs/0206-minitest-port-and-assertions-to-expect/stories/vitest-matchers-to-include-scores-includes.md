---
title: "vitest-matchers: toInclude / toHaveKey port assert_includes and score includes"
status: draft
updated: 2026-10-23
rfc: "0206-minitest-port-and-assertions-to-expect"
cluster: assertion-tooling
packages: [vitest-matchers]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC 0206 § "Matchers". Minitest's `assert_includes collection, obj` is
`collection.include?(obj)` (`vendor/minitest/v5.27.0/lib/minitest/assertions.rb:260-266`;
`refute_includes` `:700-706`), used 700 times across Rails' test suites
(`grep -rhoE '\bassert_includes\b' vendor/rails/v8.0.2/*/test | wc -l`).
`Array#include?` compares with `==` and `Hash#include?` reads keys. The
built-ins miss both: `toContainEqual` is structural (a record element compares
field by field, not by class and id), `toContain` on a `Map` ignores keys, and
`toHaveProperty` walks the prototype. vitest-matchers already has `toInclude`
(`packages/vitest-matchers/src/index.ts`, its `includes()` helper uses `rbEqual`
per element and `hashHas` for a Hash/`Map`) and `toHaveKey`, written for the
RSpec ports, but `TRAILS_MAP` (`scripts/test-compare/assertion-kinds.ts:238-275`)
has no entry for either, so a test that ports `assert_includes` with them scores no kind.

## Acceptance criteria

- [ ] `TRAILS_MAP` maps `toInclude` and `toHaveKey` to `includes` (negated to
      `excludes` through `NEGATION`), with `assertion-kinds.test.ts` cases.
- [ ] `pnpm parity:test` before/after on `origin/main` reported in the PR body:
      `kind` counters only fall (existing RSpec-port uses start to match).
- [ ] `src/index.test.ts` has a case where `toContainEqual` and `toInclude`
      disagree (an element with Ruby `==`) and one for a `Map` key.
- [ ] CONTRIBUTING.md § "Porting a Minitest assertion" names `toInclude` in
      the `assert_includes` row.
