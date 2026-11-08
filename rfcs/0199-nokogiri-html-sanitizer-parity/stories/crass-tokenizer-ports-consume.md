---
title: "crass-tokenizer-ports-consume"
status: in-progress
updated: 2026-11-08
rfc: "0199-nokogiri-html-sanitizer-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9888
claim: "2026-11-08T22:20:27Z"
assignee: "crass-tokenizer-ports-consume"
blocked-by: null
closed-reason: null
---

## Context

`packages/html-sanitizer/lib/crass/tokenizer.ts` tokenizes through `@csstools/css-tokenizer` and converts each token in `_convertToken`, then syncs `this.s` (a `Crass::Scanner`) forward to the token's start for the arms ported from `vendor/crass/v1.0.6/lib/crass/tokenizer.rb` (`consume_url` :542, `consume_bad_url` :275, `consume_escaped` :326). Ruby's tokenizer drives one scanner through `consume` (:69) and its `consume_*` helpers; there is no converter. `_convertToken` carries `@noRailsEquivalent CONVERGEABLE crass-tokenizer-ports-consume`.

## Acceptance criteria

- [ ] `Tokenizer#tokenize` and `consume` are ported from tokenizer.rb over `this.s`, with `consume_comments`, `consume_ident`, `consume_name`, `consume_number`, `consume_numeric`, `consume_string` and `consume_unicode_range`.
- [ ] `_convertToken`, `mergeTokens` and the `@csstools/css-tokenizer` dependency are removed, and the receipts are deleted.
