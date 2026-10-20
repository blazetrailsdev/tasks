---
title: "actionpack: modules are plain objects, not ruby-compat Module instances"
status: done
updated: 2026-10-20
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
cluster: null
packages: ["actionpack"]
deps:
  - remove-ruby-compat-module-class
  - inlined-from-admits-module-super-segments-on-methods
deps-rfc: []
est-loc: 700
priority: null
pr: trails#9084
claim: "2026-10-19T17:12:12Z"
assignee: "actionpack-drop-ruby-compat-module-class"
blocked-by: null
closed-reason: null
---

## Context

Part of `remove-ruby-compat-module-class` (RFC 0154): the repo owner does not want ruby-compat's `Module` class (`packages/ruby-compat/src/include.ts`, `export class Module`) or its spliced-carrier pattern, and no similar carrier shape may replace it. Kernel, Comparable and nokogiri's `Searchable` were converted first.

Sites in `packages/actionpack/src` (non-test) constructing or testing a `Module`:

- `packages/actionpack/src/abstract-controller/collector.ts:15`
- `packages/actionpack/src/abstract-controller/callbacks.ts:304`
- `packages/actionpack/src/abstract-controller/callbacks.ts:334`
- `packages/actionpack/src/abstract-controller/logger.ts:15`
- `packages/actionpack/src/abstract-controller/rendering.ts:146`
- `packages/actionpack/src/abstract-controller/translation.ts:67`
- `packages/actionpack/src/abstract-controller/caching.ts:38`
- `packages/actionpack/src/abstract-controller/caching.ts:60`
- `packages/actionpack/src/abstract-controller/caching.ts:64`
- `packages/actionpack/src/abstract-controller/helpers.ts:164`
- `packages/actionpack/src/abstract-controller/helpers.ts:192`
- `packages/actionpack/src/abstract-controller/helpers.ts:215`
- `packages/actionpack/src/abstract-controller/helpers.ts:229`
- `packages/actionpack/src/abstract-controller/trailties/routes-helpers.ts:75`
- `packages/actionpack/src/abstract-controller/trailties/routes-helpers.ts:85`
- `packages/actionpack/src/abstract-controller/caching/fragments.ts:40`
- `packages/actionpack/src/abstract-controller/caching/fragments.ts:44`
- `packages/actionpack/src/action-controller/caching.ts:23`
- `packages/actionpack/src/action-controller/form-builder.ts:15`
- `packages/actionpack/src/action-controller/test-case.ts:495`
- `packages/actionpack/src/action-controller/template-assertions.ts:14`
- `packages/actionpack/src/action-controller/api/api-rendering.ts:14`
- `packages/actionpack/src/action-controller/metal/default-headers.ts:15`
- `packages/actionpack/src/action-controller/metal/allow-browser.ts:57`
- `packages/actionpack/src/action-controller/metal/etag-with-template-digest.ts:62`
- `packages/actionpack/src/action-controller/metal/content-security-policy.ts:83`
- `packages/actionpack/src/action-controller/metal/etag-with-flash.ts:8`
- `packages/actionpack/src/action-controller/metal/conditional-get.ts:144`
- `packages/actionpack/src/action-controller/metal/basic-implicit-render.ts:26`
- `packages/actionpack/src/action-controller/metal/helpers.ts:60`
- `packages/actionpack/src/action-controller/metal/helpers.ts:87`
- `packages/actionpack/src/action-controller/metal/instrumentation.ts:25`
- `packages/actionpack/src/action-controller/metal/instrumentation.ts:178`
- `packages/actionpack/src/action-controller/metal/head.ts:76`
- `packages/actionpack/src/action-controller/metal/flash.ts:81`
- `packages/actionpack/src/action-controller/metal/flash.ts:87`
- `packages/actionpack/src/action-controller/metal/parameter-encoding.ts:65`
- `packages/actionpack/src/action-controller/metal/mime-responds.ts:122`
- `packages/actionpack/src/action-controller/metal/params-wrapper.ts:236`
- `packages/actionpack/src/action-controller/metal/params-wrapper.ts:336`
- `packages/actionpack/src/action-controller/metal/renderers.ts:94`
- `packages/actionpack/src/action-controller/metal/renderers.ts:118`
- `packages/actionpack/src/action-controller/metal/redirecting.ts:228`
- `packages/actionpack/src/action-controller/metal/url-for.ts:51`
- `packages/actionpack/src/action-controller/metal/streaming.ts:35`
- `packages/actionpack/src/action-controller/metal/testing.ts:25`
- `packages/actionpack/src/action-controller/metal/testing.ts:28`
- `packages/actionpack/src/action-controller/metal/permissions-policy.ts:31`
- `packages/actionpack/src/action-controller/metal/rendering.ts:189`
- `packages/actionpack/src/action-controller/metal/rendering.ts:201`
- `packages/actionpack/src/action-controller/metal/implicit-render.ts:101`
- `packages/actionpack/src/action-controller/metal/logging.ts:23`
- `packages/actionpack/src/action-controller/metal/data-streaming.ts:123`
- `packages/actionpack/src/action-controller/metal/rescue.ts:12`
- `packages/actionpack/src/action-controller/metal/rate-limiting.ts:69`
- `packages/actionpack/src/action-controller/metal/live.ts:343`
- `packages/actionpack/src/action-controller/metal/live.ts:364`
- `packages/actionpack/src/action-dispatch/routing/mapper.ts:1640`
- `packages/actionpack/src/action-dispatch/routing/route-set.ts:326`
- `packages/actionpack/src/action-dispatch/routing/route-set.ts:542`
- `packages/actionpack/src/action-dispatch/routing/route-set.ts:543`
- `packages/actionpack/src/action-dispatch/routing/route-set.ts:805`
- `packages/actionpack/src/action-dispatch/testing/assertions.ts:30`
- `packages/actionpack/src/action-dispatch/system-testing/test-helpers/screenshot-helper.ts:32`
- `packages/actionpack/src/action-dispatch/system-testing/test-helpers/setup-and-teardown.ts:8`
- `packages/actionpack/src/action-dispatch/testing/assertions/routing.ts:361`
- `packages/actionpack/src/action-dispatch/testing/assertions/routing.ts:430`
- `packages/actionpack/src/action-dispatch/testing/assertions/response.ts:146`
- `packages/actionpack/src/action-dispatch/routing/url-for.ts:166`
- `packages/actionpack/src/test-helpers/abstract-unit.ts:100`
- `packages/actionpack/src/test-helpers/fixtures/helpers/me-too-helper.ts:3`
- `packages/actionpack/src/test-helpers/fixtures/helpers/fun/pdf-helper.ts:3`
- `packages/actionpack/src/test-helpers/fixtures/helpers/fun/games-helper.ts:3`
- `packages/actionpack/src/test-helpers/fixtures/alternate-helpers/foo-helper.ts:3`
- `packages/actionpack/src/test-helpers/fixtures/helpers/just-me-helper.ts:3`
- `packages/actionpack/src/test-helpers/fixtures/helpers/abc-helper.ts:3`
- `packages/actionpack/src/action-dispatch/testing/integration.ts:138`
- `packages/actionpack/src/action-dispatch/testing/integration.ts:583`
- `packages/actionpack/src/test-helpers/fixtures/helpers2-pack/pack2-helper.ts:3`
- `packages/actionpack/src/test-helpers/fixtures/helpers-typo/admin/users-helper.ts:3`
- `packages/actionpack/src/test-helpers/fixtures/helpers1-pack/pack1-helper.ts:3`

Test files:

- `packages/actionpack/src/abstract-controller/trailties/routes-helpers.test.ts`
- `packages/actionpack/src/abstract-controller/collector.test.ts`
- `packages/actionpack/src/abstract-controller/helpers-resolution.test.ts`
- `packages/actionpack/src/action-controller/base.trails.test.ts`
- `packages/actionpack/src/abstract-controller/helpers.test.ts`
- `packages/actionpack/src/action-controller/controller/redirect.test.ts`
- `packages/actionpack/src/action-controller/controller/integration.test.ts`
- `packages/actionpack/src/action-controller/controller/render.test.ts`
- `packages/actionpack/src/action-controller/controller/api/with-helpers.test.ts`
- `packages/actionpack/src/action-controller/metal/helpers.trails.test.ts`
- `packages/actionpack/src/action-dispatch/dispatch/prefix-generation.test.ts`
- `packages/actionpack/src/action-dispatch/dispatch/content-security-policy.test.ts`
- `packages/actionpack/src/action-controller/controller/helper.test.ts`
- `packages/actionpack/src/action-dispatch/dispatch/routing/custom-url-helpers.test.ts`
- `packages/actionpack/src/action-dispatch/dispatch/permissions-policy.test.ts`
- `packages/actionpack/src/action-dispatch/testing/assertions.trails.test.ts`

29 non-test `superMethod(` calls (a module method's Ruby `super`), e.g.:

- `packages/actionpack/src/abstract-controller/collector.ts:87`
- `packages/actionpack/src/abstract-controller/callbacks.ts:328`
- `packages/actionpack/src/action-controller/api/api-rendering.ts:11`
- `packages/actionpack/src/action-controller/metal/basic-implicit-render.ts:17`
- `packages/actionpack/src/action-controller/metal/instrumentation.ts:56`

Plain-object `include()` copies methods onto the class prototype, so these have no plain-object equivalent yet; the shape for module `super` is an owner decision (raised on the first PR). Do not invent a carrier for it.

## Acceptance criteria

- Every `new Module(...)` in `packages/actionpack/src` is a plain-object module (`include()` / `extend()` / `defineModule`, `Included<>` / `Extended<>`), keeping the Rails module name, members and include order.
- No `instanceof Module` / `Module` type import from ruby-compat remains in the package.
- Sites relying on live include (methods defined after inclusion) or module `super` that cannot be ported without a carrier are listed in the PR body for the repo owner, not worked around.
