---
title: "actionpack-module-super-inlined-into-includers"
status: claimed
updated: 2026-10-27
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 4
pr: null
claim: "2026-10-27T00:53:29Z"
assignee: "actionpack-module-super-inlined-into-includers"
blocked-by: null
closed-reason: null
---

## Context

Follow-up to `actionpack-drop-ruby-compat-module-class`, which converted the
actionpack modules that neither call `super` nor are reached by another
module's `super` (DefaultHeaders, Logging, ParameterEncoding,
PermissionsPolicy, FormBuilder, TemplateAssertions, Testing/Functional, Head,
Translation, Logger, Assertions, ResponseAssertions, EtagWithFlash,
EtagWithTemplateDigest, ActionController::Caching, AbstractController::Caching
and ConfigMethods / Fragments, ConditionalGet, ContentSecurityPolicy,
RateLimiting, MimeResponds, AllowBrowser, ScreenshotHelper, and the helper
fixtures under `packages/actionpack/src/test-helpers/fixtures/`).

The rest are still `new Module(...)`. A plain module's methods are copied onto
the includer's prototype and outrank every carrier link, so each module that
calls `super`, and each module a `super` reaches, converts together, with the
`super` inlined into each includer per CLAUDE.md § "A module method's `super`
is inlined the same way" (`@inlinedFrom <Module>#<name> <citation>`).

Converting these without the inlining was tried and reddened
`log-subscriber.test.ts`, `flash.test.ts`, `redirect.test.ts`,
`send-file.test.ts`, `instrumentation.trails.test.ts`,
`api/modules.trails.test.ts` (Redirecting / DataStreaming reached from
Instrumentation#redirect_to / send_data / send_file and Flash#redirect_to),
and `base.test.ts` DefaultUrlOptionsTest, `renderer.test.ts`,
`routing.test.ts`, `request-forgery-protection.test.ts` (the two `UrlFor`s).
`abstract-controller/rendering.ts` (reached from
`ActionController::Rendering`'s `super`) also has a test that redefines a
method on it after include (`base-render-action.trails.test.ts:47-61`).

Modules calling `superMethod(` (Ruby `super`):

- `abstract-controller/collector.ts:87`, `abstract-controller/callbacks.ts:328`
- `action-controller/api/api-rendering.ts:11`
- `action-controller/metal/{flash.ts:48,72, basic-implicit-render.ts:17, streaming.ts:31, renderers.ts:73, instrumentation.ts:53-137, live.ts:233-372, rendering.ts:54-170, helpers.ts:52, params-wrapper.ts:264, implicit-render.ts:70,85, rescue.ts:27}`
- `action-dispatch/routing/mapper.ts:1659`, `action-dispatch/testing/integration.ts:458-539`,
  `action-dispatch/testing/assertions/routing.ts:269`,
  `action-dispatch/system-testing/test-helpers/setup-and-teardown.ts:15,26`
- `test-helpers/abstract-unit.ts:109`

Super targets left as `Module`: `abstract-controller/rendering.ts`,
`action-controller/metal/redirecting.ts`, `action-controller/metal/data-streaming.ts`,
`action-controller/metal/url-for.ts`, `action-dispatch/routing/url-for.ts`.

Other sites left:

- `action-controller/test-case.ts:496` `Behavior`: `attr_reader :response, :request`
  (`actionpack/lib/action_controller/test_case.rb:375`) defines its readers
  non-enumerably, so it is a class module (CLAUDE.md § "A Ruby module is a plain
  object or a class module").
- `abstract-controller/helpers.ts:227,241` `ClassMethods` (`attr_writer :_helpers`)
  and `Helpers` (a getter), and the `rbObjIsKindOf(_, Module)` tests at `:66,160`.
- Live include (methods defined after inclusion), for the owner:
  `action-dispatch/routing/route-set.ts:327,543-544,805` (named-route helpers
  added to `pathHelpersModule` / `urlHelpersModule` after they are included,
  `route_set.rb:85-120`) and `abstract-controller/trailties/routes-helpers.ts:75,85,103`
  (reads a `Module`'s method table).

## Acceptance criteria

- Every remaining `new Module(...)` in `packages/actionpack/src` is a plain-object
  or class module, keeping the Rails module name, members and include order.
- Each module `super` is inlined into its includers' methods with
  `@inlinedFrom` tags; no `superMethod(` call remains in the package.
- No `instanceof Module` / `Module` import from ruby-compat remains in the package.
- Live-include sites that cannot convert without a carrier are listed for the
  repo owner, not worked around.
