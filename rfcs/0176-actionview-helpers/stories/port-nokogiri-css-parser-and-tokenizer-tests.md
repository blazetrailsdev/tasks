---
title: "Port Nokogiri test_parser.rb and test_tokenizer.rb"
status: claimed
updated: 2026-10-22
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: "2026-10-22T17:45:29Z"
assignee: "build-views-precompiles-builder-templates"
blocked-by: null
closed-reason: null
---

## Context

trails#9060 ported `Nokogiri::CSS::Tokenizer`, `CSS::Parser` (on the racc runtime) and `CSS::XPathVisitor` (`packages/nokogiri/src/css/`). Only `vendor/nokogiri/v1.18.3/test/css/test_xpath_visitor.rb` was ported, as `packages/nokogiri/src/css/xpath-visitor.test.ts`. The parser and tokenizer suites are unported: `test/css/test_parser.rb` (parse trees via `Node#to_a`, `find_by_type`, the `SyntaxError` messages from `parser_extras.rb` `on_error`) and `test/css/test_tokenizer.rb` (token streams from `Tokenizer#scan_setup` / `next_token`). Nothing exercises `Node#toA` / `findByType` or the error path today.

## Acceptance criteria

- [ ] `test_parser.rb` ported as `packages/nokogiri/src/css/parser.test.ts`, test names verbatim.
- [ ] `test_tokenizer.rb` ported as `packages/nokogiri/src/css/tokenizer.test.ts`, test names verbatim.
- [ ] Any divergence these tests surface is fixed in the port, not in the tests.
