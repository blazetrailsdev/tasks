---
title: "mail-multibyte-chars-method-missing-in-prototype-chain"
status: ready
updated: 2026-11-10
rfc: "0226-mail-stack-to-parity"
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

`Mail::Multibyte::Chars#method_missing` / `#respond_to?`
(`vendor/mail/2.8.1/lib/mail/multibyte/chars.rb:48-62`) forward every String
method to `@wrapped_string`. trails' `Chars` (`packages/mail/lib/multibyte/chars.ts`)
ports `methodMissing` and `isRespondTo` but has no trap, so a Utilities method
that calls a String method on its argument fails on a Chars: `unparen` /
`unbracket` (`str.startsWith`), and `dquote` via `unquote(...).replace`.
ActiveSupport's Chars converged the same row through a proto-chain Proxy in
trails#9814 (`multibyte-chars-method-missing-in-prototype-chain`); mail's is the
sibling. `rbStrRespondTo` excludes JS String names (`JS_STRING_METHODS`,
`packages/ruby-compat/lib/string/method-table.ts:448`), so the trap must answer
the JS spelling the call site uses.

Five `spec/mail/utilities_spec.rb` examples are parked as `it.skip` on this
story in `packages/mail/test/utilities.test.ts`: "should quote mb_chars white
space" (:74) and the four `Multibyte.mb_chars` unparen / unbracket cases
(:145-178).

## Acceptance criteria

- [ ] Mail's `Chars` forwards a missed name to `methodMissing` through a Proxy
      spliced into its prototype chain, gated by `isRespondTo`, per
      CLAUDE.md § "Ruby protocol methods with a different JS mechanism".
- [ ] The five parked utilities specs run and pass.
