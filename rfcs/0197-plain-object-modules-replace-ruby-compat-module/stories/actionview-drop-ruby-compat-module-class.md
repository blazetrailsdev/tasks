---
title: "actionview: modules are plain objects, not ruby-compat Module instances"
status: in-progress
updated: 2026-10-19
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
cluster: null
packages: ["actionview"]
deps:
  - remove-ruby-compat-module-class
  - inlined-from-admits-module-super-segments-on-methods
deps-rfc: []
est-loc: 500
priority: null
pr: trails#9050
claim: "2026-10-19T01:15:17Z"
assignee: "actionview-drop-ruby-compat-module-class"
blocked-by: null
closed-reason: null
---

## Context

Part of `remove-ruby-compat-module-class` (RFC 0154): the repo owner does not want ruby-compat's `Module` class (`packages/ruby-compat/src/include.ts`, `export class Module`) or its spliced-carrier pattern, and no similar carrier shape may replace it. Kernel, Comparable and nokogiri's `Searchable` were converted first.

Sites in `packages/actionview/src` (non-test) constructing or testing a `Module`:

- `packages/actionview/src/model-naming.ts:17`
- `packages/actionview/src/rendering.ts:265`
- `packages/actionview/src/helpers/asset-url-helper.ts:292`
- `packages/actionview/src/helpers/csrf-helper.ts:28`
- `packages/actionview/src/helpers/date-helper.ts:243`
- `packages/actionview/src/helpers/capture-helper.ts:107`
- `packages/actionview/src/helpers/cache-helper.ts:212`
- `packages/actionview/src/helpers/form-options-helper.ts:405`
- `packages/actionview/src/helpers/javascript-helper.ts:61`
- `packages/actionview/src/test-helpers/active-record-unit.ts:101`
- `packages/actionview/src/context.ts:28`
- `packages/actionview/src/helpers.ts:48`
- `packages/actionview/src/lookup-context.ts:30`
- `packages/actionview/src/layouts.ts:45`
- `packages/actionview/src/layouts.ts:237`
- `packages/actionview/src/record-identifier.ts:37`
- `packages/actionview/src/helpers/asset-tag-helper.ts:524`
- `packages/actionview/src/view-paths.ts:172`
- `packages/actionview/src/helpers/form-helper.ts:1059`
- `packages/actionview/src/helpers/content-exfiltration-prevention-helper.ts:30`
- `packages/actionview/src/helpers/translation-helper.ts:162`
- `packages/actionview/src/helpers/number-helper.ts:142`
- `packages/actionview/src/helpers/csp-helper.ts:23`
- `packages/actionview/src/helpers/active-model-helper.ts:6`
- `packages/actionview/src/helpers/active-model-helper.ts:25`
- `packages/actionview/src/helpers/controller-helper.ts:64`
- `packages/actionview/src/helpers/rendering-helper.ts:25`
- `packages/actionview/src/helpers/debug-helper.ts:44`
- `packages/actionview/src/helpers/output-safety-helper.ts:96`
- `packages/actionview/src/helpers/form-tag-helper.ts:635`
- `packages/actionview/src/helpers/text-helper.ts:377`
- `packages/actionview/src/helpers/tag-helper.ts:594`
- `packages/actionview/src/helpers/url-helper.ts:518`
- `packages/actionview/src/routing-url-for.ts:127`
- `packages/actionview/src/test-helpers/fixtures/helpers/abc-helper.ts:3`
- `packages/actionview/src/helpers/sanitize-helper.ts:119`
- `packages/actionview/src/test-helpers/fixtures/helpers/helpery-test-helper.ts:3`

Test files:

- `packages/actionview/src/routing-url-for.trails.test.ts`
- `packages/actionview/src/actionpack/controller/view-paths.test.ts`
- `packages/actionview/src/template/test.test.ts`
- `packages/actionview/src/actionpack/abstract/helper.test.ts`

13 non-test `superMethod(` calls (a module method's Ruby `super`), e.g.:

- `packages/actionview/src/routing-url-for.ts:48`
- `packages/actionview/src/routing-url-for.ts:55`
- `packages/actionview/src/routing-url-for.ts:59`
- `packages/actionview/src/routing-url-for.ts:94`
- `packages/actionview/src/routing-url-for.ts:108`

Plain-object `include()` copies methods onto the class prototype, so these have no plain-object equivalent yet; the shape for module `super` is an owner decision (raised on the first PR). Do not invent a carrier for it.

## Acceptance criteria

- Every `new Module(...)` in `packages/actionview/src` is a plain-object module (`include()` / `extend()` / `defineModule`, `Included<>` / `Extended<>`), keeping the Rails module name, members and include order.
- No `instanceof Module` / `Module` type import from ruby-compat remains in the package.
- Sites relying on live include (methods defined after inclusion) or module `super` that cannot be ported without a carrier are listed in the PR body for the repo owner, not worked around.
