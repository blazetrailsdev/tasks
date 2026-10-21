---
title: "converge-view-controller-delegators-across-three-files"
status: done
updated: 2026-10-21
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: trails#9167
claim: "2026-10-21T12:41:51Z"
assignee: "tse-undefined-local-raises-template-error"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api` (forced run, 2026-10-20) reports the same delegator set
missing from three actionview files:

| Ruby file                      | missing | names                                                                                                                      |
| ------------------------------ | ------- | -------------------------------------------------------------------------------------------------------------------------- |
| `helpers/controller_helper.rb` | 12      | `_controller`, `_controller=`, `_request`, `_request=`, `requestForgeryProtectionToken`, `params`, `session`, `cookies`, … |
| `base.rb`                      | 10      | `requestForgeryProtectionToken`, `params`, `session`, `cookies`, `response`, `headers`, `flash`, `actionName`, …           |
| `helpers.rb`                   | 9       | the same head of that list                                                                                                 |

That is 31 of actionview's 129 missing methods, and one shape: the controller
delegators Rails declares with `delegate` /
`attr_internal` in
`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/controller_helper.rb:10-34`
and reopens in `base.rb` and `helpers.rb`.

`controller-helper-delegators-visible-to-parity` (est 80) is `done`, so either
it covered only one of the three files or the mechanism it used stopped being
credited. Read it first. CLAUDE.md § "Module mixins" and
§ "Generated attribute readers are properties" both bear on how the delegators
must be spelled to be visible to `parity:api`.

## Acceptance criteria

- The 31 names are credited across all three files, spelled per
  § "Module mixins" (a `this`-typed function assigned to the class, or
  `include()`/`Extended<>`), not via a hand-rolled wrapper.
- `pnpm parity:api --package actionview` shows 0 missing for
  `controller_helper.rb`, `base.rb` and `helpers.rb`.
- No new `parity:api:extra` novel names, and
  `scripts/mixin-declaration-drift.test.ts` stays green.
