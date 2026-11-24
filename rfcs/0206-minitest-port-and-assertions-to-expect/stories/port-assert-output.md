---
title: "vitest-matchers matcher for assert_output; drop image-processing assert_output receipts"
status: draft
updated: 2026-11-08
rfc: "0206-minitest-port-and-assertions-to-expect"
cluster: null
packages: ["vitest-matchers", "image-processing"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Minitest is not ported (operator ruling, reaffirmed 2026-11-24): a Minitest
assertion with no Vitest built-in becomes a `@blazetrails/vitest-matchers`
matcher (`packages/vitest-matchers/lib/index.ts`), never a Minitest port.

Minitest's `assert_output(stdout = nil, stderr = nil) { }`
(`vendor/minitest/v5.27.0/lib/minitest/assertions.rb`, `assert_output`) has no
counterpart. `packages/image-processing/test/mini-magick.test.ts` "accepts
deprecated :compose" / "accepts deprecated :geometry"
(`vendor/image_processing/v1.14.0/test/mini_magick_test.rb:497-502, 514-519`)
spy on `stderr.write` and `toMatch`, scored through two receipts in
`scripts/test-compare/assertion-receipts/image-processing.ts` (`assert_output`
value `x:nil` re-scored as `assert_match`).

## Acceptance criteria

- [ ] `@blazetrails/vitest-matchers` gains an output matcher on a block
      (e.g. `expect(fn).toOutput(stdout, stderr)`), capturing ruby-compat
      `$stdout` / `$stderr`; a `null` side is unchecked, a string compares
      equal, a RegExp matches, as Minitest's `assert_output` does.
- [ ] The matcher is tested in `packages/vitest-matchers/test/index.test.ts`.
- [ ] The two mini-magick tests use the matcher, and the two receipts (and
      `ASSERT_OUTPUT_REASON`) are deleted.
- [ ] test-compare's assertion-kind mapping credits the matcher as
      `assert_output`; `pnpm parity:test --assertions` OK.
- [ ] No Minitest port, no `assertOutput` helper.
