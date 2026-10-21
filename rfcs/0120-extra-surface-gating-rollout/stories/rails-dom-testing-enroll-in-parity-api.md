---
title: "rails-dom-testing-enroll-in-parity-api"
status: draft
updated: 2026-10-21
rfc: "0120-extra-surface-gating-rollout"
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
closed-reason: null
---

## Context

`packages/actionview/src/testing/dom-assertions.ts`,
`testing/selector-assertions.ts`, `testing/selector-assertions/html-selector.ts`
and `testing/selector-assertions/substitution-context.ts` port the
rails-dom-testing gem (`vendor/rails-dom-testing/v2.2.0/lib/rails/dom/testing/assertions/dom_assertions.rb`,
`selector_assertions.rb`, `selector_assertions/html_selector.rb`,
`selector_assertions/substitution_context.rb`) under its Rails names
(`assert_dom_equal`, `assert_dom`, `css_select`, `HTMLSelector`,
`SubstitutionContext#substitute!`, …). The gem is vendored with
`compareApi: false` (`vendor/sources.ts:451-465`), so `parity:api` maps no Ruby
file onto these TS files: every public name scores novel against an empty
allowed set in actionview's extra surface. `burn-down-and-enroll-actionview`
receipted them `@noRailsEquivalent CONVERGEABLE` against this story to enroll
actionview.

## Acceptance criteria

- rails-dom-testing is enrolled in `parity:api` (`compareApi: true`), with the
  four TS files mapped onto their `.rb` counterparts (a package of its own, or
  a file mapping from actionview), following trails#9198's marcel enrollment.
- The `CONVERGEABLE rails-dom-testing-enroll-in-parity-api` receipts in those
  files are deleted, and actionview's extra-surface mark is tightened.
