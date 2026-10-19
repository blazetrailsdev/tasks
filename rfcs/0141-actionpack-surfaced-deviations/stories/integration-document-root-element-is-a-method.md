---
title: "Integration::Runner#document_root_element is a method, not a getter"
status: draft
updated: 2026-10-19
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActionDispatch::Integration::Runner#document_root_element` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/testing/integration.rb:697-699`) is a method, `html_document.root`.

trails ports it as a getter (`packages/actionpack/src/action-dispatch/testing/integration.ts:723`, `get documentRootElement()`). `Rails::Dom::Testing::Assertions`' `SelectorAssertions#assert_dom` / `css_select` calls `this.documentRootElement()` (`packages/actionview/src/testing/selector-assertions.ts`). So once IntegrationTest answers `assertSelect` (via `ActionDispatch::Assertions`, which includes the dom-testing assertions since trails#9068), a selector-only call will invoke the root node as a function. trails#9068 converged `ActionController::TestCase::Behavior#documentRootElement` to a method; the integration one is the same deviation.

## Acceptance criteria

- `documentRootElement` in `integration.ts` is a method returning `this.htmlDocument.root`, as `integration.rb:697-699`.
- Callers (`integration.test.ts` "document_root_element returns the root element") call it.
- An IntegrationTest `assertSelect("...")` with no element argument selects from the response root. Port an existing Rails integration_test.rb assert_select test if one exists.
