---
title: "mirror-actionview-render-test-fixtures"
status: done
updated: 2026-10-20
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9119
claim: "2026-10-20T12:24:34Z"
assignee: "mirror-actionview-render-test-fixtures"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionview/test/actionpack/controller/render_test.rb` (122 tests, 3 matched in
`packages/actionview/src/actionpack/controller/render.test.ts`) renders templates from Rails' actionview
fixture tree through `FIXTURE_LOAD_PATH` (`vendor/rails/v8.0.2/actionview/test/abstract_unit.rb:49-57`):
`test/fixtures/actionpack/test/*` (77 files), `test/fixtures/test/*`, `layouts/`, `layout_tests/`, `fun/`,
`shared.html.erb`, `_top_level_partial*.erb`, `respond_to/`, and others. trails' mirror
(`packages/actionview/src/test-helpers/fixtures/`, `FIXTURE_LOAD_PATH` in `test-helpers/abstract-unit.ts:23`)
holds only 7 files under `test/`, so the existing render.test.ts uses an invented inline `FixtureResolver`.

## Acceptance criteria

- Every fixture template `render_test.rb` reaches is mirrored under `packages/actionview/src/test-helpers/fixtures/`
  at its Rails path, ERB ported to TSE (`.erb` → `.tse`), content unchanged otherwise.
- `render.test.ts` drops its inline `FixtureResolver` and resolves through `FIXTURE_LOAD_PATH` as Rails does.
