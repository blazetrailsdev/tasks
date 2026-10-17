---
title: "converge-call-rows-surfaced-by-same-file-mixin-owner"
status: claimed
updated: 2026-10-17
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-10-17T22:32:12Z"
assignee: "converge-call-rows-surfaced-by-same-file-mixin-owner"
blocked-by: null
closed-reason: null
---

## Context

`call-gates-skip-a-method-recorded-under-class-and-synthesized-mixin` found that
both call gates skipped a Ruby method whose body `flattenIncludedMethodInfos`
copies from a same-file module onto its includer
(`TestCase::Behavior#controller_class_name`, copied onto `TestCase`,
`vendor/rails/v8.0.2/actionpack/lib/action_controller/test_case.rb:552`): the
two Ruby owners made `ambiguousRubyOwner` answer true against one TS member.
`countsAsRubyOwner` (`scripts/api-compare/compare.ts`) now counts the copy as
one owner, and the rows below surfaced. They were baselined with this story as
their reason.

Call-set rows (`parity:api:calls`):

- actiondispatch `middleware/session/abstract-store.ts` `initialize_sid` → `delete` (x2), Rails `action_dispatch/middleware/session/abstract_store.rb` (`StaleSessionCheck` / `SessionObject`)
- actiondispatch `routing/mapper.ts`: `apply_action_options` → `action_options?` (`mapper.rb:1795-1798`), `draw` → `find`, `read` (`mapper.rb:1668-1683`), `has_named_route?` → `key?` (`mapper.rb:652-654`), `merge_options_scope` → `merge` (`mapper.rb:1107-1109`), `resource` / `resources` order `get,constructor`, `resources_path_names` → `merge!` (`mapper.rb:1315-1317`)
- actionview `lookup-context.ts` `detail_args_for_any` → `call`, `details_cache_key` (`actionview/lib/action_view/lookup_context.rb`)
- rack `request.ts` `add_header` → `has_header?` (`vendor/rack/v3.1.14/lib/rack/request.rb:129-137`; trails' Request spells `has_header?` as `has`), `forwarded_for` order `map,splitAuthority` x2 (`request.rb:353-372`)

Call-argument rows (`parity:api:calls:args`):

- actiondispatch `routing/mapper.ts` `map_match` `warn(ref:squish)`, `mount` `delete(str:at)`
- rack `request.ts` `GET` / `POST` `warn(..., uplevel: 1)` — ruby-compat's `warn` has no `uplevel:` and the port calls `console.warn`

## Acceptance criteria

- Each TS body above makes the call Rails makes, with Rails' arguments, and its
  baseline row (reason naming this story) is deleted.
- `pnpm parity:api:calls` and `pnpm parity:api:calls:args` are green with the
  marks tightened.
