---
title: "Converge the ported Thor specs onto the shared spec helper and script fixtures"
status: closed
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
closed-reason: "superseded by thor-vitest-setup-applies-the-spec-helper: its context claimed no setup file can work, which is false"
---

## Context

`packages/trailties/src/thor/test-helpers/helper.ts` ports `vendor/thor/v1.3.2/spec/helper.rb`,
and `test-helpers/fixtures/script.ts` ports `spec/fixtures/script.thor`. The already-ported spec
files predate them and carry local copies:

- `packages/trailties/src/thor/util.test.ts:8-79` re-declares `Scripts`, `MyScript`,
  `AnotherScript`, `Scripts::MyScript`, `MyDefaults`, `ChildDefault`, `Apple` and `Pear` with
  trimmed bodies. `BrokenCounter` there belongs to `group.thor`.
- `actions.test.ts:68-81` and other files define a local `capture`, or import ActiveSupport's.
- No ported spec file does `require "helper"`, so none runs under `THOR_COLUMNS=10000`,
  `$0 = "thor"`, `$thor_runner = true` or `Thor::Base.shell = Thor::Shell::Basic`
  (`helper.rb:26-30`).

The helper cannot be a vitest `setupFiles` entry. A setup file that imports Thor's modules
caches them before a spec file's `vi.mock` is registered, and `actions.test.ts`,
`line-editor.test.ts`, `shell/color.test.ts` and `group.trails.test.ts` then run against the
unmocked module (21 failures when tried). Each spec imports it, as each Ruby spec requires it.

## Acceptance criteria

- [ ] Every `packages/trailties/src/thor/**/*.test.ts` that mirrors a Thor spec file imports
      `./test-helpers/helper.js` and uses its `capture`, `sourceRoot` and `destinationRoot`.
- [ ] `util.test.ts` uses the shared `script.ts` fixtures and declares no copy of them.
- [ ] No Thor spec port defines a local `capture`.
