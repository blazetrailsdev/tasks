---
title: "crass-parse-properties-at-rule-tests"
status: draft
updated: 2026-10-28
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

`port-crass-css-parser` landed `packages/html-sanitizer/src/crass/parser.ts` (Crass-shaped facade over `@csstools/css-tokenizer`) and ported six of the eight `#parse_properties` tests from `vendor/crass/v1.0.6/test/test_parse_properties.rb` into `packages/html-sanitizer/src/crass/parse-properties.test.ts`. It stayed within the PR size ceiling by leaving out the two at-rule tests, whose expected trees are long:

- `should parse at-rules even though they may be invalid in the given context` (`test_parse_properties.rb:33-68`)
- `should parse at-rules with a {} simple block immediately following the prelude` (`:70-187`)

A differential run against the Ruby gem (`ruby -r vendor/crass/v1.0.6/lib/crass`) produced the same trees for both inputs, so this is test coverage only.

## Acceptance criteria

- Both tests are ported verbatim (same names, same expected `:pos` / `:tokens` trees) into `parse-properties.test.ts`, and both pass.
