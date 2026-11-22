---
title: "humanize matches [[:alpha:]] words and its 8.0.5.2 test is ported"
status: claimed
updated: 2026-11-22
rfc: "0191-rails-8-0-5-1-upgrade-workflow"
cluster: null
packages: []
deps:
  - flip-the-rails-ref-to-v8-0-5-1
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-11-22T04:20:05Z"
assignee: "flip-the-rails-ref-to-v8-0-5-1"
blocked-by: null
closed-reason: null
---

## Context

The `v8.0.5.2` dry run (trails#10147) with the ledger seeded leaves the assertion-mismatch ratchet red: activesupport assertion-value-mismatch +1. Rails adds `test_humanize_with_international_characters` (`vendor/rails/v8.0.5.2/activesupport/test/inflector_test.rb:439-442`), and the story gives added tests no ledger row. trails already has `it("humanize with international characters")` in `packages/activesupport/test/inflector.test.ts:954`, with a bespoke body (`é_employee`, `ü_user`).

The Rails body needs the 8.0.5.2 `humanize`: `result.gsub!(/([[[:alpha:]]\d]+)/i) { match.downcase!; inflections.acronyms[match] || match }` (`vendor/rails/v8.0.5.2/activesupport/lib/active_support/inflector/methods.rb:146-149`). The current port fails `humanize("áÉÍÓÚ")` and returns `ÁÉÍÓÚ`.

## Acceptance criteria

- [ ] In the flip PR, or right after it, `humanize` mirrors `methods.rb:135-159` at v8.0.5.2: the `[[:alpha:]]` word regex, and downcasing before the acronym lookup.
- [ ] The TS test body is Rails' verbatim: `humanize("áÉÍÓÚ")` is `"Áéíóú"` and `humanize("аБВГДЕ")` is `"Абвгде"`.
- [ ] The assertion-mismatch ratchet is green at the flip.
