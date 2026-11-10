---
title: "test-compare: expand x || 'nil' interpolation in loop-generated Ruby test names"
status: ready
updated: 2026-11-10
rfc: "0226-mail-stack-to-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/mail/2.8.1/spec/mail/message_spec.rb:2004` generates its examples in a
nested loop: `it "when #{mail_charset || 'nil'} vs #{part_charset || 'nil'}"`
over `charsets = ['UTF-8', 'ISO-8859-1', nil]`. The trails port
(`packages/mail/test/message.test.ts`, describe "adding parts should preserve
the charset of the mail") is complete. `parity:test` still reports it missing:

- Ruby side: `interpolated_name` / `eval_loop_expr`
  (`scripts/test-compare/extract-ruby-tests.rb:1489-1534`) has no `:binary`
  `||` arm. A bound `nil` also fails the `bound.is_a?(String)` check (:1525).
  The name therefore collapses to the literal "when (two spaces) vs" with no pattern.
- TS side: it records `when <expr> vs <expr>` (`DYNAMIC_TITLE_PLACEHOLDER`,
  `scripts/test-compare/extract-ts-core.ts:1045`), which
  `matchesInterpolatedPath` (`scripts/test-compare/compare.ts:430`) can only
  match against a Ruby pattern.

## Acceptance criteria

- [ ] `eval_loop_expr` evaluates `a || b` with Ruby truthiness, treating a bound
      `nil`/`false` as falsy and taking the right operand, so the loop expands
      to the 9 concrete names (or emits a `<expr>` pattern).
- [ ] `parity:test --package mail` credits the 9 "adding parts should preserve
      the charset of the mail > when … vs …" examples.
- [ ] A `scripts/test-compare` unit test covers the `||` arm.
