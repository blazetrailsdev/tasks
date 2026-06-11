---
title: "strict-loading.test.ts + strict-loading-sync-reader.test.ts → canonical schema"
status: draft
updated: 2026-06-11
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 400
priority: 7
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Split out of `misc-core-cluster`. Both `strict-loading.test.ts` (~2470 LOC) and
`strict-loading-sync-reader.test.ts` (~210 LOC) remain in
`require-canonical-schema-exclude.json`.

`strict-loading.test.ts` currently `defineSchema`s ~70 bespoke prefixed tables
(`slvr_authors`, `sl_bt_publishers`, `sl_hm_books`, …) with inline anonymous
models — none in `TEST_SCHEMA`. Rails' `strict_loading_test.rb` rides
`fixtures :developers, :developers_projects, :projects, :ships` + the canonical
Developer/Project/Ship/etc. models plus a few `Class.new(ActiveRecord::Base)`
anonymous classes. Port onto those canonical models/fixtures rather than the
invented prefixed tables. Likely needs splitting further given the 300–500 LOC
ceiling. Do NOT add the invented tables to `TEST_SCHEMA`.

## Acceptance criteria

- [ ] Both files ride `TEST_SCHEMA` + canonical models + fixtures.
- [ ] Bodies match `strict_loading_test.rb` where a counterpart exists; names unchanged.
- [ ] `pnpm vitest run` passes; both removed from the exclude JSON.
