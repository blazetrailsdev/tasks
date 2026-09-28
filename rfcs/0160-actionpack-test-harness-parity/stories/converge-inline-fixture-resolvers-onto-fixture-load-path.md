---
title: "Converge respond_to and trails tests' inline FixtureResolvers onto FIXTURE_LOAD_PATH"
status: draft
updated: 2026-09-28
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: []
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

trails#8211 ported `vendor/rails/v8.0.2/actionpack/test/fixtures/` into
`packages/actionpack/src/test-helpers/fixtures/` (`FIXTURE_LOAD_PATH`,
`abstract_unit.rb:67`). The Rails tests that read those fixtures still build an
inline `FixtureResolver` instead:
`action-controller/controller/mime/respond-to.test.ts:33-35` (Rails:
`respond_to_test.rb` reads `fixtures/respond_to/*`), plus
`action-controller/base-layout.trails.test.ts`,
`metal/implicit-render.trails.test.ts`, `metal/mime-responds.trails.test.ts` and
`metal/instrumentation.trails.test.ts`.

A known naming gap blocks a straight swap. The fixture files keep Rails'
snake-case basenames (`respond_to/variant_with_implicit_template_rendering.html+mobile.tse`),
but trails actions are camelCase (`variantWithImplicitTemplateRendering`), so an
implicit render looks for the camelCase template name. The inline resolver in
`respond-to.test.ts:34` hides this by naming its template after the camelCase
action. Settle how an action name maps to a template name first, and cite
where it is decided.

`port-abstract-unit-controller-reopenings-and-rack-test-case` owns
`self.view_paths = FIXTURE_LOAD_PATH` on `Base` (`abstract_unit.rb:220-244`).
Depend on it rather than prepending the path per test.

## Acceptance criteria

- `respond-to.test.ts` renders from `FIXTURE_LOAD_PATH`'s `respond_to/`
  fixtures, with no inline `FixtureResolver`.
- The rule mapping an action name to its template name is decided, and the
  fixtures or the lookup follow it. No per-test renames.
- Each of the four `*.trails.test.ts` files moves onto a fixture, or its inline
  resolver stays with a stated reason (e.g. it tests resolver behaviour itself).
