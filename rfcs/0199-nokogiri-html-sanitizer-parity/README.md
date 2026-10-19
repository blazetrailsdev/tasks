---
rfc: "0199-nokogiri-html-sanitizer-parity"
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

# RFC 0199 — Nokogiri and rails-html-sanitizer to parity

## Summary

Converge `@blazetrails/nokogiri` and `@blazetrails/html-sanitizer` onto the
gems they port: `nokogiri` (vendored at `vendor/nokogiri/v1.18.3/` as a
read-anchor) and `rails-html-sanitizer` with its `loofah` / `crass`
dependencies (not vendored yet). Neither package is measured by `parity:api`
or `parity:test` today, so "parity" here means the concrete gaps listed below
are closed, not a percentage. Both packages are dependencies of the ActionView helper work in
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

No parity tool measures either package: nokogiri's `vendor/sources.ts` entry
(`:447-463`) is `compareApi: false`, `compareTests: false`, and
`html-sanitizer` is in `PACKAGES_OUTSIDE_MANIFEST`
(`scripts/api-compare/config.ts:227`). The gaps are known from the helper
suites that hit them, and from receipts in the code: 15
`@noRailsEquivalent CONVERGEABLE nokogiri-xpath-evaluator-behind-searchable-css`
tags in `packages/nokogiri/src/xml/searchable.ts` and 3
`CONVERGEABLE html-sanitizer-parser-concerns` tags in
`packages/html-sanitizer/src/html5.ts`.

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
- **Turning on `compareApi` / `compareTests` for these gems.** Enrolling
  nokogiri (a C-extension gem, much of whose surface lives in `ext/`) or the
  sanitizer gems in the comparers is its own tooling decision with its own
  burndown; this RFC closes the known gaps first.
- **Replacing `sanitize-html` wholesale.** The concerns story ports the
  composition; whether the scrub engine underneath becomes a Loofah port is
  decided there, not here.
- **ActiveSupport `XmlMini`'s Nokogiri engine.** Owned by the activesupport
  RFCs and buckets that already hold its stories.

## Alternatives considered

- **Leave the stories in 0176.** Rejected: 0176 would own gem-port work
  outside its goal and could not close on the helper half alone.
- **Fold into `0193-small-gem-ports-parity-100`.** Rejected: 0193's unit is a
  measured package brought back to 100% on its gates, and neither package
  here is measured; the open work is substantive porting (an XPath
  evaluator, the sanitizer concerns) plus vendoring, not residue burndown.

## Rollout

One story is filed here, `vendor-rails-html-sanitizer-loofah-and-crass`.
The other six are rehomed from 0176 after this RFC merges (see § "After
merge").

1. Nokogiri CSS evaluation: `nokogiri-xpath-evaluator-behind-searchable-css`,
   then `nokogiri-css-on-css-select` (its role is decided against the
   evaluator; see Open question 1).
2. Nokogiri residue: `nokogiri-xml-node-set-union-and-root-namespaces`,
   `port-nokogiri-css-parser-and-tokenizer-tests`.
3. Sanitizer: `vendor-rails-html-sanitizer-loofah-and-crass`, then
   `html-sanitizer-safe-list-sanitize-css` and `html-sanitizer-parser-concerns`
   (each `deps` on the vendoring story; the latter also needs the HTML4
   ruling, Open question 2).

## After merge

Run once this RFC is numbered `<NNNN>` and `tasks show` reports the new id for
the vendoring story (an ingest still pending shows `0000-`):

1. `pnpm tasks rehome nokogiri-xpath-evaluator-behind-searchable-css nokogiri-xml-node-set-union-and-root-namespaces nokogiri-css-on-css-select port-nokogiri-css-parser-and-tokenizer-tests html-sanitizer-parser-concerns html-sanitizer-safe-list-sanitize-css --to <NNNN>-nokogiri-html-sanitizer-parity`
2. `pnpm tasks set-deps html-sanitizer-safe-list-sanitize-css --add vendor-rails-html-sanitizer-loofah-and-crass`
3. `pnpm tasks set-deps html-sanitizer-parser-concerns --add vendor-rails-html-sanitizer-loofah-and-crass`
4. `pnpm tasks status-set html-sanitizer-safe-list-sanitize-css ready`: its
   `blocked-by` names only the missing vendoring, which step 2's `deps` edge
   now holds. `html-sanitizer-parser-concerns` stays blocked on the HTML4
   ruling.

5. `scripts/finalize-rfc.mjs` rewrites `0000-` only inside this directory,
   so the bare `nokogiri-html-sanitizer-parity` mentions in
   `0176-actionview-helpers/README.md` (Non-goals, Open question 2,
   Changelog) and `0193-small-gem-ports-parity-100/README.md` (Non-goals)
   become `<NNNN>-nokogiri-html-sanitizer-parity`, and both READMEs add it to
   `related-rfcs` (0193 gains the field). One follow-up tasks commit.

No 0176 story takes a `deps` edge: none of its open stories needs this work.
The one parked helper test it unblocks (`sanitize_css` in
`packages/actionview/src/template/sanitize-helper.test.ts`) is parked under
`// BLOCKED: html-sanitizer-safe-list-sanitize-css` and is un-skipped in that
story's PR.

## Verification

The RFC closes when all seven of its stories (six rehomed, one filed) are
done, or closed with a `PERMANENT:` / `FALSIFIED:` reason. What that means in
the tree, since no parity tool measures these packages:

- **Nokogiri.** `Searchable#css` on every document type runs
  `css_rules_to_xpath` → `CSS.xpath_for` → an XPath evaluation, as
  `vendor/nokogiri/v1.18.3/lib/nokogiri/xml/searchable.rb:229-270` does, and
  the private selector matcher in `packages/nokogiri/src/xml/searchable.ts`
  is deleted: 0 of today's 15 `CONVERGEABLE
nokogiri-xpath-evaluator-behind-searchable-css` receipts remain. XML node
  sets union by node identity, and `test_parser.rb` / `test_tokenizer.rb` are
  ported with names verbatim.
- **Sanitizer.** `vendor/sources.ts` lists rails-html-sanitizer, loofah and
  crass; `SafeListSanitizer#sanitizeCss` exists; the sanitizers are composed
  from the Parser / Scrubber / Serializer concerns at their Rails names, so 0
  of today's 3 `CONVERGEABLE html-sanitizer-parser-concerns` receipts in
  `packages/html-sanitizer/src/html5.ts` remain.
- **The split itself.** After § "After merge": `pnpm tasks list --rfc
<NNNN>-nokogiri-html-sanitizer-parity` shows the seven stories, `pnpm tasks
list --rfc 0176-actionview-helpers` shows none of the six, and no README
  mentions the unnumbered slug.

## Open questions

1. **css-select's role** — replace the matcher or serve as a test oracle.
   Deferred to `nokogiri-css-on-css-select`, which must be decided by the
   repo owner before it starts.
2. **Which parser backs `Nokogiri::HTML4`.** Deferred to
   `html-sanitizer-parser-concerns` (blocked on the owner decision it names);
   also recorded as RFC 0176's Open question 2.

## Changelog

- 2026-10-19: initial RFC, split out of `0176-actionview-helpers` at the repo
  owner's direction; six stories to be rehomed after merge, one vendoring story filed.
