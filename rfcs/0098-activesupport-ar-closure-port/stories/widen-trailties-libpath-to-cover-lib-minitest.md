---
title: "widen-trailties-libpath-to-cover-lib-minitest"
status: closed
updated: 2026-08-14
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "No mini test"
---

# Widen the trailties libPath so `railties/lib/minitest/` is measured

## Context

`vendor/sources.ts:127-129` pins trailties' API-compare population to
`libPath: "railties/lib/rails"`. Rails also ships
`railties/lib/minitest/rails_plugin.rb`, which is a real, ported Rails file
(`packages/trailties/src/minitest/rails-plugin.ts`, added by PR #6499 —
`BacktraceFilterWithFallback` and `plugin_rails_init`'s backtrace-filter arm).

Because the .rb sits outside the scanned libPath, `parity:api` reports the TS
file as `[no Rails counterpart]` and both its public names as novel, so the port
carries `@noRailsEquivalent` receipts that describe a TOOLING gap, not a
deviation. The test side has no such gap: `testPath: "railties/test"` already
covers `railties/test/minitest/rails_plugin_test.rb`, which `parity:test` credits.

## Acceptance criteria

- [ ] `railties/lib/minitest/rails_plugin.rb` is inside the trailties API-compare
      population (widen `libPath`, or add a second scanned root), without
      dragging in unported `railties/lib/**` files as false negatives.
- [ ] `packages/trailties/src/minitest/rails-plugin.ts` matches its .rb; the two
      `@noRailsEquivalent` tags on `BacktraceFilterWithFallback` and
      `pluginRailsInit` are deleted.
- [ ] `pnpm parity:api` delta non-negative.
