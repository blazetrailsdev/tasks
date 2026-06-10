---
title: "F-9g — core misc skip tail"
status: draft
updated: 2026-06-10
rfc: "0016-ar-test-compare-100"
cluster: core-residuals
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

From the 2026-06-10 snapshot. The long tail of small un-owned core skips
(1–5 each), to be batched by theme into ≤500-LOC sub-PRs: `calculations_test.rb`
(5: grouped-association calc + sanitizeSql array forms), `base_test.rb` (5),
`strict_loading_test.rb` (4), `touch_later_test.rb` (4), `reflection_test.rb` (3),
`forbidden_attributes_protection_test.rb` (3), `reserved_word_test.rb` (3),
`unsafe_raw_sql_test.rb` (2), `attributes_test.rb` (2), `inheritance_test.rb` (2),
`view_test.rb` (2), `instrumentation_test.rb` (2), `clone_test.rb` (2),
`attribute_methods/read_test.rb` (2), `statement_invalid_test.rb` (2),
`sanitize_test.rb` (1), plus the ~10 single-skip files (`finder`, `secure_token`,
`delegated_type`, `column_alias`, `table_metadata`, `types`,
`persistence/reload_association_cache`, `active_record`, etc.).

## Acceptance criteria

- [ ] Drive the listed core-tail files to 0 matched-skips, batching by theme;
      reclassify any genuinely-permanent skip (Ruby encoding/Symbol/const_missing)
      into `unported-files.ts` with a reason rather than leaving `it.skip`.
- [ ] Each sub-PR ≤500 LOC; touched test files only.

## Notes

`defaults_test.rb` (13) is NOT here — it is almost entirely schema-dump default
expressions, gated on [[i1-schema-dumper-columnspec-u3]]; pick it up there.
Split into a follow-up story via `pnpm tasks new 0016-ar-test-compare-100 <slug>`
if the tail exceeds one PR — do NOT fan out PRs.
