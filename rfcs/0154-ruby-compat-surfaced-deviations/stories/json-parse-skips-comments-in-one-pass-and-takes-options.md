---
title: "ruby-compat: JSON.parse skips comments in one pass and takes the options hash"
status: draft
updated: 2026-10-10
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced reviewing trails#8732, which moved the comment-skipping fallback from
`ActiveSupport::JSON.decode` into ruby-compat's `JSON.parse`
(`packages/ruby-compat/src/json.ts`).

The json gem skips comments inside its one grammar: `ignore = ws | comment`
(`vendor/ruby/v3.3.11/ext/json/parser/parser.rl:105-108`). `JSON.parse` here
calls `globalThis.JSON.parse`, catches `SyntaxError`, strips comments with
`stripJsonComments`, and parses a second time. That is a `try` / retry arm the
gem does not have, and a source that is malformed for another reason reports
the error of the second pass, not the first.

`cpp_comment = '//' cr_neg* cr` (`parser.rl:106`) also requires the closing
newline, so `JSON.parse("1 // x")` is a `ParserError` in Ruby; the fallback
accepts it.

`ActiveSupport::JSON.decode` passes `quirks_mode: true`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/json/decoding.rb:23`),
and `JSON.parse` here takes no options, so `packages/activesupport/src/json.ts`
omits the argument.

## Acceptance criteria

- [ ] `JSON.parse` reads its source in one pass, skipping `ws | comment`
      between tokens as `parser.rl:105-108` does, with no `try` / retry.
- [ ] An unterminated `/*` and a `//` comment with no closing newline raise
      `SyntaxError`, with a test for each.
- [ ] `JSON.parse` takes the options hash `common.rb:219` takes, and
      `ActiveSupport::JSON.decode` passes `quirksMode: true`.
