---
title: "converge-finder-one-schema"
status: done
updated: 2026-06-30
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4343
claim: "2026-06-30T17:32:37Z"
assignee: "converge-finder-one-schema"
blocked-by: null
---

## Context

Split out from `converge-finder-enum-relation-one-schema` (RFC 0048): that story
bundled `enum.test.ts` + `finder.test.ts`, but each file is a large
all-or-nothing faithful port that exceeds the 500-LOC ceiling on its own, so they
must ship as separate PRs. The enum half shipped first; this story is the finder
half.

Port `packages/activerecord/src/finder.test.ts` to a faithful mirror of
`vendor/rails/activerecord/test/cases/finder_test.rb` (~150 `test` methods,
1933 lines). The current trails file is a bespoke suite with invented
`describe`/`it` names and `_tableName` hacks — delete it and port the real Rails
cases, riding canonical `TEST_SCHEMA` + official `test-helpers/models/*` + real
fixtures (Topic/Company/Customer/etc.), per the RFC 0048 Convergence contract.

## Acceptance criteria

- [ ] `finder.test.ts` mirrors `finder_test.rb` word-for-word as closely as TS
      allows: same test names, same fixtures, same assertions. Test names map
      `test:compare`; never reword.
- [ ] Canonical schema/models/fixtures only — no bespoke tables, invented
      columns, or `_tableName` hacks painting a canonical name onto a bespoke
      suite.
- [ ] Surfaced impl gaps → fix the impl or file under `0023-surfaced-deviations`
      and `it.skip` tracked-pending-convergence. A temporary `test:compare`
      regression is acceptable; record the un-skip.
- [ ] Confirm against the Rails source, not prior trails behavior. Split across
      sub-cluster PRs under the 500-LOC ceiling if needed.
