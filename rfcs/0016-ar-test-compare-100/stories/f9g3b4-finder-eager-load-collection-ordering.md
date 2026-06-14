---
title: "f9g3b4-finder-eager-load-collection-ordering"
status: ready
updated: 2026-06-14
rfc: "0016-ar-test-compare-100"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Tail of [[f9g3b-persistence-feature-gap-tail]]. Single skipped test in
`finder.test.ts`:

- `find with eager loading collection and ordering by collection primary key`

Needs eager-load collection ordering by the collection's primary key. Read the
corresponding `finder_test.rb` case before implementing.

## Acceptance criteria

- [ ] Un-skip the finder eager-load ordering test against a real implementation;
      test name matches Rails verbatim.
- [ ] ≤300 LOC; touched files only. Single draft PR from main; run /link.
