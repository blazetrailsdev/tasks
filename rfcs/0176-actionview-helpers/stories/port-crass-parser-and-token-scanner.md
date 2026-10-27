---
title: "port-crass-parser-and-token-scanner"
status: draft
updated: 2026-10-27
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`port-crass-css-parser` landed `Crass::Scanner` and `Crass::Tokenizer`
(`vendor/crass/v1.0.6/lib/crass/scanner.rb`, `tokenizer.rb`) at
`packages/html-sanitizer/src/crass/`, plus `StringScanner#getch` / `#unscan`
in ruby-compat. The parser half did not fit the PR's LOC ceiling.

Still unported:

- `Crass::TokenScanner` (`vendor/crass/v1.0.6/lib/crass/token-scanner.rb:6-48`).
- `Crass::Parser` (`vendor/crass/v1.0.6/lib/crass/parser.rb`), at least
  `Parser.parse_properties`, `#parse_component_values`, `Parser.stringify`
  and the consume\_\* methods they reach, which
  `Loofah::HTML5::Scrub.scrub_css` (`vendor/loofah/v2.24.0/lib/loofah/html5/scrub.rb:72-140`) needs.
- `Crass.parse` / `Crass.parse_properties` (`vendor/crass/v1.0.6/lib/crass.rb:10-20`).

## Acceptance criteria

- [ ] TokenScanner and Parser ported beside the tokenizer, Crass names camelCased.
- [ ] Crass's own tests for those entry points ported: `test_parse_properties.rb`,
      `test_crass.rb`, and `test_css_parsing_tests.rb`'s `component_value_list` /
      `declaration_list` groups over `test/css-parsing-tests/*.json`.
