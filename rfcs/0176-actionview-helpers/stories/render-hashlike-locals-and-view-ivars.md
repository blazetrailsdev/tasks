---
title: "render-hashlike-locals-and-view-ivars"
status: done
updated: 2026-10-26
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9341
claim: "2026-10-26T17:25:26Z"
assignee: "render-hashlike-locals-and-view-ivars"
blocked-by: null
closed-reason: null
---

## Context

Left from `render-test-controller-gaps-owner-rulings`. Two tests in
`packages/actionview/src/actionpack/controller/render.test.ts` stay parked
(`vendor/rails/v8.0.2/actionview/test/actionpack/controller/render_test.rb`):

- `test_partial_with_hashlike_locals` (`:1336`): `ActionController::Parameters` as locals. Rails' `locals_code` (`actionview/lib/action_view/template.rb:561-572`) reads `local_assigns[:key]`; the TSE stand-in's `__lookup` (`packages/trails-tsc/src/plugins/tse.ts`, `scopeLines`) reads `name in scope` / `Reflect.get`, which a `Parameters` does not answer, so the `_customer` partial renders "Anonymous".
- `test_controller_does_not_leak_instance_variables`: the view's own-property list differs from Rails' ivar list (`render_test.rb:131`). Needs an owner ruling on what a trails view's `instance_variables` are (converge vs PERMANENT-SKIP).

## Acceptance criteria

- `partial with hashlike locals` is un-skipped with the Rails body and passes, via a locals-binding change that reads each local the way `local_assigns[:key]` does.
- `controller does not leak instance variables` is un-skipped and passes, or parked under a `PERMANENT-SKIP:` line citing an owner ruling.
