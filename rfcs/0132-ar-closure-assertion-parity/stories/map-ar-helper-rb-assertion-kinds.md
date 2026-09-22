---
title: "Map AR helper.rb suite assertions in assertion-kinds.ts"
status: done
updated: 2026-09-22
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#7953
claim: "2026-09-22T13:29:53Z"
assignee: "assertions-activesupport-cache-xml-json-callbacks"
blocked-by: null
closed-reason: null
---

## Context

`query-count-assertions-unmapped-on-both-sides` (trails#7930) mapped the four `QueryAssertions` helpers in `scripts/test-compare/assertion-kinds.ts`. Its story also asked for a check of the other assertion helpers `vendor/rails/activerecord/test/cases/helper.rb` mixes in. That check was not done.

Any helper with no `RAILS_MAP` row normalizes to `null` on both sides, so its kind is never compared. Candidates: `assert_column`, `assert_no_column`, `assert_index`, `assert_sql`-style capture helpers, and `assert_deprecated_*`.

## Acceptance criteria

- Every helper that `helper.rb` / `test_case.rb` mixes in either has a canonical kind with a one-line justification citing its Ruby `file:line`, or is listed as deliberately unmapped.
- Report the per-package mark effect before and after, and converge any rows the new kinds surface.
