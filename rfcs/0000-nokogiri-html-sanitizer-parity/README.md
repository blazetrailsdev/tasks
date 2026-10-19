---
rfc: "0000-nokogiri-html-sanitizer-parity"
title: "Nokogiri and rails-html-sanitizer to parity"
status: active
created: 2026-10-19
updated: 2026-10-19
owner: "@deanmarano"
packages:
  - "nokogiri"
  - "html-sanitizer"
clusters: []
related-rfcs:
  - "0176-actionview-helpers"
  - "0193-small-gem-ports-parity-100"
---

<!-- Unnumbered until merge: `scripts/finalize-rfc.mjs` swaps 0000 for the
     assigned number at merge. -->

# RFC — Nokogiri and rails-html-sanitizer to parity

## Summary

Bring `@blazetrails/nokogiri` and `@blazetrails/html-sanitizer` to parity with
the gems they port: `nokogiri` (vendored at `vendor/nokogiri/v1.18.3/`) and
`rails-html-sanitizer` with its `loofah` / `crass` dependencies (not vendored
yet). Both packages are dependencies of the ActionView helper work in
`0176-actionview-helpers` (`assert_select`, `assert_dom_equal`,
`SanitizeHelper`), but their own parity is not that RFC's goal, "the helper
half to parity". This RFC owns it; 0176 stories that need a story here wait on
it through a cross-RFC `deps` edge.

## Motivation

By 2026-10-19 RFC 0176 had collected six open stories whose work lives
entirely in `packages/nokogiri` or `packages/html-sanitizer`:

| Story                                             | Package        | Status at the move |
| ------------------------------------------------- | -------------- | ------------------ |
| `nokogiri-xpath-evaluator-behind-searchable-css`  | nokogiri       | claimed            |
| `nokogiri-xml-node-set-union-and-root-namespaces` | nokogiri       | draft              |
| `nokogiri-css-on-css-select`                      | nokogiri       | draft              |
| `port-nokogiri-css-parser-and-tokenizer-tests`    | nokogiri       | draft              |
| `html-sanitizer-parser-concerns`                  | html-sanitizer | blocked            |
| `html-sanitizer-safe-list-sanitize-css`           | html-sanitizer | blocked            |

They were filed into 0176 because the helper suites surfaced them. Leaving
them there makes 0176's open set disagree with its stated goal, and hides
gem-port work under an ActionView RFC. The done nokogiri / sanitizer stories
(`port-nokogiri-css-xpath-visitor`, `nokogiri-xml-document-searchable`,
`html-sanitizer-port-html5-vendor`, …) stay in 0176 as its record, since only
open stories move.

## Design

Nothing beyond the gems' own source. Constraints carried over:

- **Nokogiri's CSS path is CSS → XPath → an XPath engine.**
  `Nokogiri::XML::Searchable#css_internal` → `css_rules_to_xpath` →
  `xpath_query_from_css_rule` (`vendor/nokogiri/v1.18.3/lib/nokogiri/xml/searchable.rb:229-270`).
  The CSS parser and `XPathVisitor` are ported (`packages/nokogiri/src/css/`);
  `nokogiri-xpath-evaluator-behind-searchable-css` replaces the private
  selector matcher in `xml/searchable.ts` with an evaluator for that XPath.
- **DOM testing is HTML5 only** (trails CLAUDE.md § "DOM testing is HTML5
  only"). `@blazetrails/nokogiri` has no HTML4 parser, which is what blocks
  `html-sanitizer-parser-concerns`' HTML4 vendor arm.
- **rails-html-sanitizer, loofah and crass must be vendored** (via
  `vendor/sources.ts`) before the sanitizer stories can cite and mirror their
  source; that is what blocks `html-sanitizer-safe-list-sanitize-css`.

## Non-goals

- **ActionView helpers and their test suites.** RFC 0176. A helper story that
  needs work here takes a `deps` edge on the story here.
- **ActiveSupport `XmlMini`'s Nokogiri engine.** Owned by the activesupport
  RFCs and buckets that already hold its stories.

## Alternatives considered

- **Leave the stories in 0176.** Rejected: 0176 would own gem-port work
  outside its goal and could not close on the helper half alone.
- **Fold into `0193-small-gem-ports-parity-100`.** Rejected: 0193 explicitly
  scopes out packages with no vendored upstream and its stories are parity
  residue burndowns; nokogiri's open work is substantive porting and
  sanitizer needs vendoring first.

## Rollout

Stories are rehomed from 0176 by `pnpm tasks rehome … --to <this RFC>` after
this RFC merges, is numbered and ingests (status, claim and PR are kept).

1. Nokogiri CSS evaluation: `nokogiri-xpath-evaluator-behind-searchable-css`,
   then `nokogiri-css-on-css-select` (its role is decided against the
   evaluator; see Open question 1).
2. Nokogiri residue: `nokogiri-xml-node-set-union-and-root-namespaces`,
   `port-nokogiri-css-parser-and-tokenizer-tests`.
3. Sanitizer: vendor rails-html-sanitizer / loofah / crass, then
   `html-sanitizer-safe-list-sanitize-css` and `html-sanitizer-parser-concerns`.

## Verification

- `xml/searchable.ts` carries no `CONVERGEABLE port-nokogiri-css-xpath-visitor`
  receipt, and `test_parser.rb` / `test_tokenizer.rb` are ported with names
  verbatim.
- `SafeListSanitizer#sanitizeCss` exists, and the sanitizers are composed from
  the Parser / Scrubber / Serializer concerns at their Rails names.
- All six stories above are done or closed with a `PERMANENT:` /
  `FALSIFIED:` reason.

## Open questions

1. **css-select's role** — replace the matcher or serve as a test oracle.
   Deferred to `nokogiri-css-on-css-select`, which must be decided by the
   repo owner before it starts.
2. **Which parser backs `Nokogiri::HTML4`.** Deferred to
   `html-sanitizer-parser-concerns` (blocked on the owner decision it names);
   also recorded as RFC 0176's Open question 2.

## Changelog

- 2026-10-19: initial RFC, split out of `0176-actionview-helpers` at the repo
  owner's direction; six stories to be rehomed after merge.
