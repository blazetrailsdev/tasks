---
title: "Apply Thor's spec helper to every Thor spec port through a vitest setup, and converge util.test onto the shared fixtures"
status: draft
updated: 2026-10-05
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/trailties/src/thor/test-helpers/helper.ts` ports `vendor/thor/v1.3.2/spec/helper.rb`
and `test-helpers/fixtures/script.ts` ports `spec/fixtures/script.thor` (trails PR 8553). Every
Ruby spec does `require "helper"`; no ported spec file imports the helper yet, so none runs
under `THOR_COLUMNS=10000`, `$0 = "thor"`, `$thor_runner = true` or
`Thor::Base.shell = Thor::Shell::Basic` (`helper.rb:26-30`).

A plain `setupFiles` entry that imports the helper does not work: it caches Thor's modules
before a spec file's `vi.mock` is registered, and `actions.test.ts`, `line-editor.test.ts` and
`shell/color.test.ts` then run unmocked. Measured on PR 8553, this shape does work:

- a `thor` project in `vitest.config.ts` including `packages/trailties/src/thor/**/*.test.ts`
  (excluded from `other`, and added to `vitest.trailties.config.ts`), whose setup file is
  `beforeAll(async () => { await import("./helper.js"); })`. The import then runs after the spec
  file's own imports and mocks.

Under it 5 of 519 tests fail, all from state the helper now provides:

- `util.test.ts:8-79` re-declares `Scripts`, `MyScript`, `AnotherScript`, `MyDefaults`,
  `ChildDefault`, `Apple` and `Pear`, which collide with the shared fixtures
  (`#thor_classes_in` finds two `MyScript::AnotherScript`). Import the fixtures instead;
  `BrokenCounter` stays until `group.thor` is ported.
- `thor.trails.test.ts:335` reads `script.basename()` at collection time, before `$0` is set,
  and three help-screen tests assume `$thor_runner` starts false.
- `group.trails.test.ts:133-146` expects `invoke "nowhere"` to report `[not found]`; with
  `Scripts::MyDefaults` loaded the name falls back to the default namespace class
  (`vendor/thor/v1.3.2/lib/thor/util.rb:131-148`).

`actions.test.ts:68-81` also defines a local `capture`; the helper's replaces it.

## Acceptance criteria

- [ ] The `thor` vitest project exists and its setup applies `helper.ts` to every
      `packages/trailties/src/thor/**/*.test.ts`, with `vi.mock` users still green.
- [ ] `util.test.ts` uses the shared `script.ts` fixtures and declares no copy of them.
- [ ] No Thor spec port defines a local `capture`.
- [ ] `pnpm vitest run packages/trailties/src/thor` is green.
