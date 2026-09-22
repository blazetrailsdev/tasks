---
title: "FormatValidator multiline-anchor check ignores JS m flag"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails `FormatValidator#regexp_using_multiline_anchors?`
(`vendor/rails/activemodel/lib/active_model/validations/format.rb`, `check_options_validity`)
checks `source.start_with?("^") || (source.end_with?("$") && !source.end_with?("\\$"))`.
In Ruby `^`/`$` are ALWAYS line anchors, so that source check equals "uses multiline anchors".
trails ports the source check verbatim (`packages/activemodel/src/validations/format.ts:83-86`),
but in JS `^`/`$` are line anchors only under the `m` flag; without it they are `\A`/`\z`.
So `/^\d+$/` (a safe, whole-string JS regexp) raises the multiline-anchor ArgumentError, and a
faithful port of Rails' `/\A...\z/` tests has to spell the anchors `(?<![\s\S])` / `(?![\s\S])`
(found while porting `format_validation_test.rb` for
`assertions-activemodel-validations-remainder`).

## Acceptance criteria

- [ ] `regexpUsingMultilineAnchors` answers true only when the regexp actually has line-anchor
      semantics (`regexp.multiline` and the Rails source check), converging the Rails meaning.
- [ ] `/^x$/` without `m` validates without raising; `/^x$/m` without `multiline: true` still raises.
