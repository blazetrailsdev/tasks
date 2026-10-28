---
title: "Crass facade over @csstools (parse_properties / parse_component_values / stringify)"
status: claimed
updated: 2026-10-28
rfc: "0176-actionview-helpers"
cluster: null
packages: ["html-sanitizer"]
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: "2026-10-28T11:49:47Z"
assignee: "parity-maps-ruby-tracker-onto-tse-tracker-parser-arm"
blocked-by: null
closed-reason: null
---

## Context

`Loofah::HTML5::Scrub.scrub_css` (`vendor/loofah/v2.24.0/lib/loofah/html5/scrub.rb:72-121`)
and `scrub_attribute_that_allows_local_ref` (`:123-140`) are the only callers
of Crass, and they reach three entry points:

- `Crass.parse_properties(style)` (`vendor/crass/v1.0.6/lib/crass.rb:16-20`)
- `Crass::Parser.new(value).parse_component_values`
  (`vendor/crass/v1.0.6/lib/crass/parser.rb`)
- `Crass::Parser.stringify(nodes)` (`parser.rb`)

They read only these node fields: `:node` (`:property`, `:whitespace`,
`:string`, `:function`, `:ident`, `:url`, `:bad_url`, `:hash`, `:semicolon`),
`:raw`, `:name`, `:value`, `:important` and `:children`. `stringify` must
round-trip `:raw`. This story unblocks `html-sanitizer-safe-list-sanitize-css`
and `port-loofah-scrubber-and-html5-scrub`.

**Decision (repo owner, 2026-10-27): Crass is not ported line for line.** It
is a Crass-shaped facade over `@csstools/css-tokenizer` and
`@csstools/css-parser-algorithms` (4.x, zero-dependency). Both implement CSS
Syntax Level 3, the spec Crass implements, and their tokens keep their exact
source text and offsets. This follows the nokogiri-over-parse5 precedent.
Rule and stylesheet parsing (`parse_rules`, `parse_stylesheet`,
`Crass::Scanner`, `TokenScanner`) is not ported.

## Acceptance criteria

- `@csstools/css-tokenizer` added as an exact-version dependency of
  `html-sanitizer`. `@csstools/css-parser-algorithms` is not used: its
  component-value tree drops the non-standard `:whitespace` / `:semicolon` /
  `:tokens` nodes that `parse_properties` returns and `stringify` reads
  (`crass/parser.rb:74-122,276-323`), so the parser subset those entry points
  reach is ported line for line over the mapped tokens instead.
- `packages/html-sanitizer/src/crass.ts` (+ `crass/parser.ts`,
  `crass/token-scanner.ts`, mirroring `crass.rb` / `crass/parser.rb` /
  `crass/token-scanner.rb`) exposes `Crass.parseProperties`, `Crass.Parser`
  with `#parseComponentValues`, and `Parser.stringify`. `crass/tokenizer.ts`
  maps `@csstools` tokens onto the token hashes `Tokenizer#create_token`
  builds (a Ruby Symbol is a JS string per CLAUDE.md). Facade-only members
  carry `@noRailsEquivalent PERMANENT`.
- Crass's tests for those entry points ported: `test_parse_properties.rb`
  (its two at-rule tests by `crass-parse-properties-at-rule-tests`) and the
  `component_value_list` / `declaration_list` groups of
  `test_css_parsing_tests.rb` over `test/css-parsing-tests/*.json`.
  `test_serialization.rb` is not ported: every test there builds its tree
  with `Crass.parse` / `Parser.parse_rules` (`test_serialization.rb:14,25,31,38,68`),
  which this decision leaves unported.
- Where `@csstools` tokenizes differently from Crass (Crass follows an older
  spec draft: `bad_url`, unicode-range, escapes), the facade maps to Crass's
  output. Any test that can't match is parked with a `PERMANENT-SKIP:` line
  naming the spec difference.
- No `UNPORTED_FILES` rows for the rule and stylesheet test files: crass is
  `compareTests: false` in `vendor/sources.ts`, so `parity:test` never reads
  them.
