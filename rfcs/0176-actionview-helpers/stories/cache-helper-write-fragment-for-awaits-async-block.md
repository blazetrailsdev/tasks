---
title: "cache-helper-write-fragment-for-awaits-async-block"
status: done
updated: 2026-10-19
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9055
claim: "2026-10-19T12:07:14Z"
assignee: "cache-helper-write-fragment-for-awaits-async-block"
blocked-by: null
closed-reason: null
---

## Context

`ActionView::Helpers::CacheHelper#write_fragment_for`
(`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/cache_helper.rb:292-295`)
is `fragment = output_buffer.capture(&block)`. In trails
(`packages/actionview/src/helpers/cache-helper.ts`, `writeFragmentFor`) the
capture runs through the synchronous `OutputBuffer#capture`
(`packages/actionview/src/buffers.ts:89`), so a `cache` block that awaits a
nested `render` (Rails fixture `test/_cached_nested_cached_customer.erb`)
writes an empty fragment and the inner partial never renders.

`packages/actionview/src/template/log-subscriber.test.ts`
"render cached outer partial with cached inner partial"
(`vendor/rails/v8.0.2/actionview/test/template/log_subscriber_test.rb:216-235`)
is parked as `it.skip` on this story.

## Acceptance criteria

- A `cache` block that awaits a nested `render` writes the rendered content
  as the fragment, and the outer template outputs it.
- The parked log-subscriber test is un-skipped and passes.
