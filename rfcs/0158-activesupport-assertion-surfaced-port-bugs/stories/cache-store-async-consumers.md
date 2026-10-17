---
title: "cache-store-async-consumers"
status: ready
updated: 2026-10-17
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: ["actionview", "actionpack"]
deps: ["cache-store-async-store-and-local-stores"]
deps-rfc: []
est-loc: null
priority: 0
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split from `cache-store-async-over-npm-clients`. `cache-store-async-store-and-local-stores` made the Store async and converted every consumer that has an async caller: the controller fragment API (`actionpack/src/abstract-controller/caching/fragments.ts`, `caching.ts#cache`), collection caching (`actionview/src/renderer/partial-renderer/collection-caching.ts`), the session `CacheStore` (prewarmed in `prepareSession`), and the view `cache` / `cacheIf` / `cacheUnless` helper chain (`actionview/src/helpers/cache-helper.ts`), which now returns a promise. One consumer is left.

A non-streaming template compiles to a synchronous function (`actionview/src/template.ts:408`, `Object.assign(function ...)`; only the `_streaming` variant is `async`). So `<%= context.cache("foo", {}, () => { %>bar<% }) %>` concatenates an unresolved promise, and the fragment's read and write land after the template returns. Rails' `cache` helper (`actionview/lib/action_view/helpers/cache_helper.rb:176-187`) is synchronous in an ERB body. The seven `ACLogSubscriberTest` "with fragment cache ..." tests (`actionpack/src/action-controller/controller/log-subscriber.test.ts`) are parked as `it.skip` under `// BLOCKED: cache-store-async-consumers`. The same wall stops session accessors from going async: `formAuthenticityToken` and `request.flash` read the session from inside a template.

## Acceptance criteria

- A template can await a helper. Either templates compile to `async` functions and the output buffer accepts awaited concatenation, or the view `cache` helper gets an explicitly decided shape that renders inside a sync template.
- The seven parked `ACLogSubscriberTest` fragment-cache tests run green.
