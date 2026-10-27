---
title: "Map Rails::Dom::Testing (testing.rb) into the rails-dom-testing parity package"
status: draft
updated: 2026-10-27
rfc: "0120-extra-surface-gating-rollout"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#9377 enrolled rails-dom-testing in `parity:api` with `libPath: lib/rails/dom/testing`, so the gem's entry module `vendor/rails-dom-testing/v2.2.0/lib/rails/dom/testing.rb` (`Rails::Dom::Testing`: `default_html_version`, `html5_support?`, `html_document`, `html_document_fragment`, private `choose_html_parser`, :11-48) is outside the extractor. Its port, `packages/actionview/src/testing.ts`, still scores as actionview surface, and it sits outside `packages/actionview/src/rails-dom-testing/`.

## Acceptance criteria

- Set `libEntryFile: "lib/rails/dom/testing.rb"` on the rails-dom-testing entry in `vendor/sources.ts`, and relocate `testing.ts` to the file that entry maps onto (or add a `RUBY_FILE_TS_OVERRIDES` row like `i18n:../i18n.rb`). Update the importers (`@blazetrails/actionview/testing` in actionpack).
- `parity:api` scores `Rails::Dom::Testing`'s five methods. The extra-surface marks for actionview and rails-dom-testing are tightened, never raised.
