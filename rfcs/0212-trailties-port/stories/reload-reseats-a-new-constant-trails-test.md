---
title: "Trails-only test: Dependencies.clear seats a new app constant"
status: draft
updated: 2026-11-09
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9929 made `Dependencies.clear` (`packages/activesupport/lib/dependencies.ts`) eager load after `autoloader.reload()`, so an app constant is seated again after a reload (Rails autoloads it on first reference; `activesupport/lib/active_support/dependencies.rb:70-76`). The Rails-named test "filters for Active Record encrypted attributes are added to config.filter_parameters only once" (`railties/test/application/initializers/frameworks_test.rb:412-430`) keeps only Rails' three assertions, so nothing asserts that the constant after a reload is a NEW class rather than the stale one. A fourth assertion there reds the assertion-count ratchet.

## Acceptance criteria

- A trails-only `.trails.test.ts` in `packages/trailties/test/application/` boots an app with `app/models/post.ts`, reads `TopLevel.Post`, calls the `reload` helper (`Dependencies.clear`), and asserts `TopLevel.Post` is defined and `not.toBe` the pre-reload class.
