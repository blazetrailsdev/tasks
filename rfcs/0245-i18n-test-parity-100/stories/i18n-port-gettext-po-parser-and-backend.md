---
title: "i18n: port Gettext::PoParser on the racc runtime and I18n::Backend::Gettext"
status: done
updated: 2026-11-19
rfc: "0245-i18n-test-parity-100"
cluster: gettext
packages: [i18n]
deps: [i18n-port-gettext-helpers]
deps-rfc: []
est-loc: 650
priority: null
pr: trails#10326
claim: "2026-11-18T23:06:40Z"
assignee: "i18n-port-gettext-po-parser-and-backend"
blocked-by: null
closed-reason: null
---

## Context

- Lib: `vendor/i18n/v1.14.8/lib/i18n/gettext/po_parser.rb` (329 lines). It is racc-generated
  (`:13-17`, tables from `:113`) and subclasses `Racc::Parser`.
  `vendor/i18n/v1.14.8/lib/i18n/backend/gettext.rb` (83 lines) adds `load_po` and
  `normalize` to a backend.
- Test: `vendor/i18n/v1.14.8/test/gettext/backend_test.rb` has 11 tests. It loads
  `vendor/i18n/v1.14.8/test/test_data/locales/de.po`.
- racc runtime: `packages/nokogiri/lib/racc/parser.ts` is the only port. Where
  i18n imports it from is RFC Open question 3.
- File loading goes through the awaited load step (packages/i18n/CLAUDE.md
  § "A translation lookup is synchronous").

## Acceptance criteria

- [ ] **RFC Open question 3 is resolved.** If the runtime moves to its own
      package, that move is a separate story and is added to `deps`.
- [ ] `packages/i18n/lib/gettext/po-parser.ts` keeps the generated tables
      verbatim, and `packages/i18n/lib/backend/gettext.ts` mirrors the module.
- [ ] All 11 tests are ported under the Rails names, the `de.po` fixture is
      copied into `packages/i18n/test/test-data/locales/`, and the `gettext`
      exclusion is deleted.
