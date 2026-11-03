---
title: "Port ActionText::SystemTestHelper and the system tests"
status: draft
updated: 2026-11-03
rfc: "0219-actiontext-port"
cluster: at-engine
packages: ["actiontext"]
deps: ["actiontext-engine", "actiontext-install-generator-and-rake"]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

- `vendor/rails/v8.0.2/actiontext/lib/action_text/system_test_helper.rb` (61): `fill_in_rich_textarea`
  (`:35-37`) runs `this.editor.loadHTML(arguments[0])` on the matched
  `trix-editor`, alias `fill_in_rich_text_area`, and the two
  `Capybara.add_selector` registrations whose XPath matches by id,
  placeholder, `aria-label`, input name or label (`:42-61`).
- trails' system tests run on Vitest and Playwright with no Capybara
  (CLAUDE.md § "System testing runs on Vitest";
  `packages/actionpack/src/action-dispatch/system-test-case.ts`).
- Tests: `test/system/system_test_helper_test.rb` (6),
  `rich_text_editor_test.rb` (1); they need Trix loaded in the page from the
  npm package.

## Acceptance criteria

- This story adds the engine's `action_text.system_test_helper` initializer
  (`engine.rb:77-82`) at its Rails position between `action_text.renderer`
  and `action_text.configure`; `actiontext-engine` leaves it out.

- `fillInRichTextarea` / its alias follow the owner's answer to the RFC's
  open question 4; the locator arms match the Rails XPath one for one.
- The system tests run in the system-test lane with `trix` and
  `@rails/actiontext` served from npm.
