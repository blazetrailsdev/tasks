---
title: "vitest-matchers README: each matcher and the Ruby/JS gap that earns it"
status: draft
updated: 2026-10-23
rfc: "0206-minitest-port-and-assertions-to-expect"
cluster: assertion-tooling
packages: [vitest-matchers]
deps: [vitest-matcher-to-be-kind-of, vitest-matchers-to-include-scores-includes]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`packages/vitest-matchers` has no README. Its Minitest-serving matchers are
`toEqualRuby`, `toBeRubyTruthy`, `toBeRubyFalsy`, `toBeWithinDelta`,
`toBeEmpty`, `toBeExactInstanceOf`, `toRespondTo`, plus `toBeKindOf` and
`toInclude` / `toHaveKey` from this RFC's two matcher stories (its RSpec-serving
ones, `toStartWith` … `toOutput`, get a row too). Minitest is vendored for
reference, not ported (repo-owner ruling 2026-10-23), so the README is where a
porter learns which matcher ports which Minitest assertion faithfully, and
where the bar for adding one is written down (RFC § "Matchers").

## Acceptance criteria

- [ ] `packages/vitest-matchers/README.md` lists each matcher with: the
      Minitest assertion it serves (`vendor/minitest/v5.27.0/lib/minitest/assertions.rb:<line>`),
      the built-in it replaces, a concrete value on which the built-in gives
      the wrong answer, and the kind `scripts/test-compare/assertion-kinds.ts`
      scores it.
- [ ] It states the rule from CONTRIBUTING.md § "Porting a Minitest assertion"
      by link, not restatement, and the bar from RFC § "Matchers": a Minitest
      assertion Rails' tests use often, a measured Ruby/JS gap no existing
      matcher covers, no dispatch by name, and a `TRAILS_MAP` entry in the
      same PR.
- [ ] It says Minitest's trailing `msg` argument ports as `expect(value, msg)`.
- [ ] It records that `assert_nil` maps to `toBeNull` / `toBeUndefined`, with
      no `toBeNil` matcher, by repo-owner ruling (2026-10-22).
- [ ] `src/index.test.ts` has a case for each matcher on the value the README
      names.
