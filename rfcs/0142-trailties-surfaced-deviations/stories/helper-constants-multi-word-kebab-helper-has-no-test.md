---
title: "helperConstants' kebab-to-underscore helper name translation has no test"
status: claimed
updated: 2026-11-19
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-11-19T14:46:37Z"
assignee: "health-controller-is-not-importable-from-trailties"
blocked-by: null
closed-reason: null
---

## Context

trails#8552 changed `helperConstants`
(`packages/trailties/src/trailties/action-controller.ts`) to translate a
kebab-case helper file stem to its underscored Rails spelling before
camelizing: `just-me-helper.ts` now registers `JustMeHelper`, where it used to
build the invalid constant name `Just-meHelper` and register nothing. The
matching change to `Resolution.allHelpersFromPath`
(`packages/actionpack/src/abstract-controller/helpers.ts`, Rails'
`abstract_controller/helpers.rb:49-57`) is covered by
`helpers-resolution.test.ts`; the trailties half shipped with no test.

A booted app with a multi-word helper file is the case that broke:
`helper :all` (`action_controller/railties/helpers.rb:8-22`) resolved
`just_me` to `JustMeHelper`, which the constant table did not hold.

## Acceptance criteria

- A trailties test boots the `action_controller.set_helpers_path` initializer
  over a helpers directory holding a multi-word kebab-case helper
  (`just-me-helper.ts`) and a namespaced one under a kebab-case directory, and
  asserts both constants resolve and `helper :all` includes their methods.
- The test fails with the `replaceAll("-", "_")` in `helperConstants` removed.
