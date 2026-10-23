---
title: "vitest-matchers README: each matcher and the Ruby/JS gap that earns it"
status: draft
updated: 2026-10-23
rfc: "0206-minitest-port-and-assertions-to-expect"
cluster: assertion-tooling
packages: [vitest-matchers]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`packages/vitest-matchers` (69-line `src/index.ts`, seven matchers:
`toEqualRuby`, `toBeRubyTruthy`, `toBeRubyFalsy`, `toBeWithinDelta`,
`toBeEmpty`, `toBeExactInstanceOf`, `toRespondTo`) has no README. The RFC's
disposition table measured that these seven cover every gap the Minitest
sweeps meet, so the README is where a porter learns when to reach for one, and
where the bar for adding an eighth is written down.

## Acceptance criteria

- [ ] `packages/vitest-matchers/README.md` lists each matcher with: the
      Minitest assertion it serves (`vendor/minitest/v5.27.0/lib/minitest/assertions.rb:<line>`),
      the built-in it replaces, a concrete value on which the built-in gives
      the wrong answer, and the kind `scripts/test-compare/assertion-kinds.ts`
      scores it.
- [ ] It states the rule from CONTRIBUTING.md § "Porting a Minitest assertion"
      by link, not restatement, and that a new matcher needs a measured
      Ruby/JS gap no existing matcher covers, plus a `TRAILS_MAP` entry in the
      same PR.
- [ ] It records that `assert_nil` maps to `toBeNull` / `toBeUndefined`, with
      no `toBeNil` matcher, by repo-owner ruling (2026-10-22).
- [ ] `src/index.test.ts` has a case for each matcher on the value the README
      names.
