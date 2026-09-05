---
title: "port-actionview-cache-helper"
status: claimed
updated: 2026-09-05
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-09-05T19:26:47Z"
assignee: "port-actionview-cache-helper"
blocked-by: null
closed-reason: null
---

## Context

`ActionView::Helpers::CacheHelper`
(`vendor/rails/actionview/lib/action_view/helpers/cache_helper.rb`, 315 lines)
is not ported at all — `packages/actionview/src/helpers/` has no
`cache-helper.ts`, and nothing in `packages/` names `CacheHelper`.

This blocks `enroll-the-fragment-cache-log-subscriber-tests`. The seven
fragment-cache tests in
`vendor/rails/actionpack/test/controller/log_subscriber_test.rb:330-393` drive a
controller whose actions render inline templates calling the helper —
`render inline: "<%= cache('foo'){ 'bar' } %>"` and the `cache_if` /
`cache_unless` variants (`log_subscriber_test.rb:51-72`). With no helper there
is nothing to emit the `read_fragment` / `write_fragment` notifications the
subscriber's four fragment methods
(`vendor/rails/actionpack/lib/action_controller/log_subscriber.rb:77-88`, ported
in #7501) subscribe to, so the tests cannot be written the way Rails writes
them.

What is already in place: inline rendering works
(`packages/actionview/src/renderer/template-renderer.ts:40-42`,
`InlineTemplate` at `:194`), and the fragment primitives exist on the
controller side (`packages/actionpack/src/abstract-controller/caching.ts` —
`readFragment`, `writeFragment`, `fragmentExist`, `cacheStore`,
`performCaching`, `enableFragmentCacheLogging`).

What the port needs beyond the three public methods: `fragment_for`,
`read_fragment_for`, `write_fragment_for`, `cache_fragment_name`,
`fragment_name_with_digest`, `digest_path_from_template`,
`combined_fragment_cache_key`, and the `view_cache_dependencies` /
`@view_renderer.cache_hits` wiring the helper reads.

## Acceptance criteria

- [ ] `ActionView::Helpers::CacheHelper` is ported to
      `packages/actionview/src/helpers/cache-helper.ts`, method-for-method
      against `cache_helper.rb`, and mixed into the view the way Rails does.
- [ ] An inline template calling `cache` / `cacheIf` / `cacheUnless` in a
      controller with `performCaching` and a `cacheStore` emits the
      `read_fragment.action_controller` / `write_fragment.action_controller`
      notifications.
- [ ] `parity:api` for actionview does not drop; no new extra surface without a
      receipt.
