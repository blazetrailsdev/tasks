---
title: "trailties-test-middleware-cache-rack-cache"
status: draft
updated: 2026-11-21
rfc: "0248-trailties-parity-100"
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

Split from `trailties-test-middleware-cache-cookies-static-logger`.
`vendor/rails/v8.0.2/railties/test/application/middleware/cache_test.rb` has
8 tests; only `test_cache_is_disabled_in_dev_mode` (:68) is ported, in
`packages/trailties/test/application/middleware/cache.test.ts` (its
`simpleController` is already the full Rails `ExpiresController`). The other
seven (`:58`, `:81`-`:170`) assert `X-Rack-Cache` and need Rack::Cache mounted:
`DefaultMiddlewareStack#load_rack_cache` currently raises
`cannot load such file -- rack/cache` (`packages/rack-cache/lib` holds only
`index.ts` / `version.ts`).

## Acceptance criteria

- [ ] The seven remaining `cache_test.rb` tests are ported with Rails names and bodies and pass.
- [ ] No new `it.skip` without a `PERMANENT-SKIP:` receipt naming a CLAUDE.md section.
