---
title: "where() serializes null-mapped and unknown enum labels (last_read/prohibited/cover)"
status: ready
updated: 2026-07-07
rfc: "0050-enum-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Left pending in `packages/activerecord/src/enum.test.ts` after PR #4754
(`find via where with symbols` / `find via where with strings`), mirroring
`vendor/rails/activerecord/test/cases/enum_test.rb:115-138`. Three assertions
still can't be ported faithfully on canonical `Book`:

1. `Book.where(last_read: :forgotten).first == books(:ddd)` — `forgotten` maps
   to `null` (`enum("last_read", { ..., forgotten: null })`). `where({ last_read:
"forgotten" })` must serialize the label to `IS NULL` and match the fixture
   whose `last_read` is null.
2. `Book.where(status: :prohibited).first == nil` — `prohibited` is not a
   declared status label; Rails serializes an unknown label to a value that
   matches nothing (returns nil), rather than erroring.
3. `Book.where(cover: :soft).first == @book` / `Book.where.not(cover: :hard)` —
   `cover` where-matches by enum label.

## Acceptance criteria

- [ ] `where({ last_read: "forgotten" })` serializes the null-mapped label to
      `IS NULL` and matches `books(:ddd)`.
- [ ] `where({ status: "prohibited" })` (unknown label) matches nothing and
      `.first` returns null, without raising.
- [ ] `where({ cover: "soft" })` / `whereNot({ cover: "hard" })` match by label.
- [ ] Un-skip the corresponding pending assertions in the
      `find via where with symbols` / `find via where with strings` cases of
      `enum.test.ts` and drop their pending notes.
