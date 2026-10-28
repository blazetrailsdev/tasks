---
title: "Crass facade reads U+0080-U+009F as name code points, as Crass does"
status: done
updated: 2026-10-28
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#9409
claim: "2026-10-28T16:26:59Z"
assignee: "crass-parse-properties-at-rule-tests"
blocked-by: null
closed-reason: null
---

## Context

`packages/html-sanitizer/src/crass/tokenizer.ts` maps `@csstools/css-tokenizer` tokens onto Crass token hashes. Crass's `RE_NAME` / `RE_NAME_START` (`vendor/crass/v1.0.6/lib/crass/tokenizer.rb:18-19`) count every code point from U+0080 up as a name code point. CSS Syntax 3 as @csstools implements it leaves out U+0080–U+009F, so `\x7f\x80\x81` comes out as three delims where Crass produces a delim and then the ident `"\x80\x81"`. The `component_value_list` case starting `\- red0 …` in `crass/css-parsing-tests.test.ts` is parked as `PERMANENT-SKIP` because of this.

The facade can still match Crass's output here. `Tokenizer#mergeTokens` already merges adjacent tokens for the match tokens and the IE `*` hack.

## Acceptance criteria

- Contiguous runs of U+0080–U+009F delims are merged into, or with, the adjacent ident / function / at-keyword / hash / dimension-unit token, so the result matches Crass's `consume_name` (`tokenizer.rb:375-403`).
- The `PERMANENT-SKIP` in `css-parsing-tests.test.ts` is removed, and that case passes.
