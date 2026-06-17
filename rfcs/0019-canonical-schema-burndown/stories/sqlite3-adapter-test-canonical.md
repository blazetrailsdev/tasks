---
title: "Port sqlite3-adapter.test.ts to canonical schema or isolated-by-design"
status: ready
updated: 2026-06-17
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 400
priority: 9
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Carved out of `adapter-tests-cluster` (RFC 0019) on 2026-06-17: at 645 LOC,
`packages/activerecord/src/adapters/sqlite3-adapter.test.ts` is over the 500-LOC
PR ceiling on its own, so it cannot ride along with the other adapter files.
The first cluster attempt (PR #3118) was closed unmerged largely for this
reason.

Convert (or explicitly mark isolated-by-design) `adapters/sqlite3-adapter.test.ts`
→ Rails `adapters/sqlite3/sqlite3_adapter_test.rb`. This is a genuine adapter/DDL
test, so most of it likely qualifies as category (b) — owns its own schema, keep
file-unique tables with a scoped `eslint-disable` and a one-line reason — but
verify each describe block against the Rails source before deciding; anything
that's really a model-layer assertion should ride `TEST_SCHEMA` + canonical
models + fixtures.

Confirm exclude-JSON membership at claim time: currently listed in
`eslint/require-canonical-schema-exclude.json`.

## Acceptance criteria

- [ ] Each block classified (a) canonical-schema or (b) isolated-by-design with a
      scoped `eslint-disable` carrying a one-line reason; no blanket file-level
      disable.
- [ ] Bodies match `sqlite3_adapter_test.rb` word-for-word where a counterpart
      exists; test names unchanged.
- [ ] File removed from the exclude JSON, or every retained own-table block
      carries a justified scoped disable and uses file-unique table names.
- [ ] `pnpm vitest run packages/activerecord/src/adapters/sqlite3-adapter.test.ts`
      passes.
- [ ] If the diff would exceed 500 LOC, split per-describe and register the
      remainder as a follow-up story rather than fanning out PRs.

## Definition of done

`sqlite3-adapter.test.ts` either rides the canonical schema or owns file-unique
tables with justified scoped disables; no blanket file-level `eslint-disable`.
