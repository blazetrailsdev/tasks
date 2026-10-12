---
title: "HealthController is registered by side effect and not importable from @blazetrails/trailties"
status: draft
updated: 2026-10-12
rfc: "0142-trailties-surfaced-deviations"
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

`Rails::HealthController` is a public constant an application can subclass or
name in a test. trails' `HealthController`
(`packages/trailties/src/health-controller.ts:4`) is reachable only by its
side effect: `rails.ts` imports the file, which registers `rails/health` in
`controllerConstants`. `packages/trailties/package.json`'s `exports` has no
entry that hands the class out.

Found in trailmap#66: a controller test of `/up` had to write
`controllerConstants.get("rails/health") as unknown as typeof ProbesController`
to get a class `ActionController.TestCase.tests` would accept.

Related, same file: `renderUp` (`:14`) and `renderDown` are `@internal`, so a
subclass cannot change the body (JSON for a non-browser probe) without
overriding framework internals. Rails' are private too, so that half is a
question to settle against `railties/lib/rails/health_controller.rb`, not a
given.

## Acceptance criteria

- [ ] `HealthController` is importable from a public `@blazetrails/trailties` entry, typed as a controller class.
- [ ] A test names it through `ActionController.TestCase.tests` with no cast.
