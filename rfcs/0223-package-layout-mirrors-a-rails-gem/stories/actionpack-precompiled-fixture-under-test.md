---
title: "actionpack-precompiled-fixture-under-test"
status: done
updated: 2026-11-09
rfc: "0223-package-layout-mirrors-a-rails-gem"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9930
claim: "2026-11-09T21:17:30Z"
assignee: "actionpack-precompiled-fixture-under-test"
blocked-by: null
closed-reason: null
---

## Context

`packages/actionpack/test-fixtures/precompiled/app/views/posts/show.html.tse` sits at the package root, outside `test/`, after RFC 0223's actionpack move (trails#9853). Readers: `packages/actionpack/test/action-dispatch/dispatch/exception-wrapper.trails.test.ts:44` (`../../../test-fixtures/precompiled`) and `packages/actionview/src/test-helpers/build-precompiled-fixtures.ts:3` (`../../../actionpack/test-fixtures/precompiled`). Rails keeps fixtures under `vendor/rails/v8.0.2/actionpack/test/fixtures/`.

## Acceptance criteria

- [ ] `git mv` to `packages/actionpack/test/fixtures/precompiled/`; both readers repointed.
- [ ] Precompiled fixture build and exception-wrapper test pass; no `actionpack/test-fixtures` string remains.
