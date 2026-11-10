---
title: "Port ActionText module, Fragment, HtmlConversion and PlainTextConversion"
status: in-progress
updated: 2026-11-10
rfc: "0219-actiontext-port"
cluster: at-content
packages: ["actiontext"]
deps: ["actiontext-parity-enrollment-and-package", "nokogiri-html5-node-mutation-for-actiontext"]
deps-rfc: []
est-loc: 350
priority: null
pr: trails#9970
claim: "2026-11-10T20:55:23Z"
assignee: "actiontext-module-fragment-and-conversions"
blocked-by: null
closed-reason: null
---

## Context

- `vendor/rails/v8.0.2/actiontext/lib/action_text.rb` (59): `ActiveSupport::Autoload` lists for
  `ActionText`, `Attachables` and `Attachments` (`:13-44`) and the memoized
  `html_document_class` / `html_document_fragment_class` (`:46-57`).
- `lib/action_text/fragment.rb` (62): `wrap`, `from_html`, `find_all`,
  `update`, `replace`, `to_plain_text`, `to_html`, `to_s`, and
  `delegate :deconstruct, to: "source.elements"` (`:26`).
- `lib/action_text/html_conversion.rb` (26): `extend self` module.
- `lib/action_text/plain_text_conversion.rb` (119): `extend self` module whose
  `plain_text_for_node` (`:14-20`) dispatches by `send` behind `respond_to?`
  to a closed set of methods, with `alias_method` loops at `:38-40`, `:46-48`.
- Test: `test/unit/plain_text_conversion_test.rb` (19 tests).

## Acceptance criteria

- The namespaces are seated per CLAUDE.md § "Call-time constant resolution"
  (autoload namespace objects, plain `Namespace.Name = Klass` seats).
- `html_document_class` keeps the `defined?(Nokogiri::HTML5)` probe and its
  `@html_document_class` memo; the HTML4 arm is unported (RFC non-goals).
- `PlainTextConversion` dispatch is a module-private registry from node name
  to the ported `plainTextFor*Node` functions, per the RFC's "Dispatch by
  name"; the aliases are real aliases, not copies. No `rbFSend`.
- `Fragment#update` takes the block as Rails' `yield` (block parameter);
  `deconstruct` is delegated, not reimplemented.
- `plain_text_conversion_test.rb`'s 19 tests pass.
