---
title: "actionview-module-super-blocked-on-actionpack-modules"
status: ready
updated: 2026-10-29
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
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

`actionview-module-super-remaining-modules` converted `TagHelper`, `ActiveModelHelper`,
`ActiveModelInstanceTag` and the `AbcHelper` / `HelperyTestHelper` fixtures to
plain-object modules. These are still ruby-compat `new Module(...)` in
`packages/actionview/src`, each blocked by an ordering constraint found while
converting them:

- `routing-url-for.ts` `RoutingUrlFor` and `helpers/url-helper.ts` `UrlHelper`:
  `RoutingUrlFor#url_for`'s `super` (`actionview/lib/action_view/routing_url_for.rb:80-136`)
  reaches actionpack's `ActionDispatch::Routing::UrlFor`, still a live `Module`
  (`packages/actionpack/src/action-dispatch/routing/url-for.ts:168`), whose
  `included` block calls `rbModMethodDefined` on the includer, and that
  function does not yet answer a plain-object module (`ruby-compat/src/object.ts:863`).
  `UrlHelper` cannot convert alone: as a plain-object module its copied
  `urlFor` outranks `RoutingUrlFor`'s carrier link in `ActionView::TestCase::Behavior`
  (`test-case.ts:185`), which reds "is able to use routes" in
  `template/test-case.test.ts`. Convert the three together.
- `rendering.ts` `Rendering`, `layouts.ts` `Layouts` / `LayoutConditions`: their
  `super` (`process`, `_process_format`, `_normalize_args`,
  `_process_render_template_options`) reaches `AbstractController::Rendering`,
  still `new Module` at `packages/actionpack/src/abstract-controller/rendering.ts:142`.
  A super target converts in the same PR (root CLAUDE.md § "A module method's
  `super` is inlined the same way").
- `lookup-context.ts` `Accessors`: `LookupContext.register_detail`
  (`actionview/lib/action_view/lookup_context.rb:21-37`) defines methods on
  `Accessors` after `include Accessors` (`:228`) is in place for later details,
  and `lookup-context.trails.test.ts` pins a later `registerDetail`. That is
  the "method defined on a module after it is included" case, which needs a
  decision on the trails-only tests.
- `test-helpers/active-record-unit.ts:101`, a per-call `new Module()` with a
  `superMethod(this, "setup")`.

## Acceptance criteria

- `git grep -nE 'new Module\(|\.superMethod\(' -- packages/actionview/src ':!*.test.ts'` is empty.
- Each module `super` is inlined with `@inlinedFrom` (closed includer set) or is
  `rbCallSuper` (open set), per RFC 0197.
- `parity:api:extra:gate`, `parity:api:calls`, `parity:api:calls:args`,
  `parity:api:inlined`, `parity:modules` green.
