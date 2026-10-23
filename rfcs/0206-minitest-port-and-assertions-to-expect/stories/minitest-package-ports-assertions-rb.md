---
title: "@blazetrails/minitest package, enrolled in parity:api, with Minitest::Assertions moved in"
status: draft
updated: 2026-10-22
rfc: "0206-minitest-port-and-assertions-to-expect"
cluster: minitest-package
packages: [minitest, activesupport]
deps: []
deps-rfc: []
est-loc: 700
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

By repo-owner ruling (2026-10-22) Minitest is ported as its own gem package,
reversing RFC 0098's closed `map-vendored-minitest-and-drop-norailsequivalent`
(won't-do 2026-08-14, "file a fresh story if the decision changes"; its
mechanics were proven and reverted in trails#6535).

Today `Minitest::Assertions`
(`vendor/minitest/v5.27.0/lib/minitest/assertions.rb:16`, `assert` `:171`
through `refute` `:650`, `message` `:632`, `diff` `:57`, `mu_pp` `:127`) is
ported into `packages/activesupport/src/testing/assertions.ts:540-1016`,
beside Rails' own `ActiveSupport::Testing::Assertions`. Its members carry
`@noRailsEquivalent PERMANENT` (35 tags in the file) because
`vendor/sources.ts:449-473` registers minitest with `compareApi: false`: no
`packages/minitest/src` exists for the comparator to key onto.
`parity:api:extra --package activesupport` scores 24 of the file's names as
extra surface (10 novel, 14 moved).

## Acceptance criteria

- [ ] `packages/minitest` exists as `@blazetrails/minitest`, depending on
      `@blazetrails/ruby-compat` only, with every registration a new package
      needs (memory notes "New package needs ci yml and guard fixture",
      "New package subpath needs four registrations").
- [ ] The `minitest` entry in `vendor/sources.ts` has `compareApi: true`
      (`compareTests` stays `false`), and its `libPath` covers both
      `lib/minitest.rb` and `lib/minitest/*.rb` (the RFC's Open question 1,
      decided here and recorded in the RFC).
- [ ] `Minitest::Assertions` members live in the file that mirrors
      `lib/minitest/assertions.rb`, with no `@noRailsEquivalent` receipt where
      `parity:api` now credits them. A member that still has no counterpart
      keeps a receipt with the correct token.
- [ ] `packages/activesupport/src/testing/assertions.ts` imports what its Rails
      half calls (`assert`, `assertEqual`, `refuteEqual`, `assertNil`,
      `assertMatch`, `message`, `diff`) from `@blazetrails/minitest`, and still
      re-exports the moved names from its index so no caller breaks in this PR.
- [ ] `pnpm parity:api`, `parity:api:calls`, `parity:api:calls:args`,
      `parity:api:params` green; the activesupport `parity:api:extra` total
      drops by the moved names.
