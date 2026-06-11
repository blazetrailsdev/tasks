---
title: "Index comment introspection + dump emission (MySQL INDEX_COMMENT, PG obj_description)"
status: done
updated: 2026-06-11
rfc: "0010-adapter-cleanup"
cluster: adapter-cleanup
deps: []
deps-rfc: []
est-loc: 120
priority: 15
pr: 3122
claim: "2026-06-11T16:39:06Z"
assignee: "index-comments-mysql-pg"
blocked-by: null
---

## Context

Column and table comments landed in PR #3046. Two index-comment tests remain
`it.skip("add index with comment later")` in `comment.test.ts` (comment_test.rb:74
`blank indexes created in block` and :89 `add index with comment later`).

Requires:

- MySQL: read `INDEX_COMMENT` from `information_schema.STATISTICS` in `indexes()`
  and carry it on `IndexInfo`
- PG: read from `pg_description` via `obj_description(indexrelid, 'pg_class')`
- Both: emit `comment:` in schema-dump index stanza when present

`IndexInfo` currently has no `comment` field — needs to be added at the type layer
first, then introspection, then dump.

## Acceptance criteria

- [ ] `IndexInfo` carries an optional `comment` field
- [ ] MySQL `indexes()` populates `comment` from `INDEX_COMMENT`
- [ ] PG `indexes()` populates `comment` from `pg_description`
- [ ] Schema-dump emits `comment:` in `add_index` stanza when present
- [ ] The two `it.skip("add index with comment later")` tests un-skipped and green
- [ ] `api:compare` delta non-negative
