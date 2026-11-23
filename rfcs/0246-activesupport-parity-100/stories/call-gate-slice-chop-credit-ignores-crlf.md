---
title: "call gate: slice(0, -1) credits chop without the CRLF arm"
status: done
updated: 2026-11-22
rfc: "0246-activesupport-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trails#10607
claim: "2026-11-22T22:24:08Z"
assignee: "activesupport-cache-format-version-accessor-property"
blocked-by: null
closed-reason: null
---

# call gate: `slice(0, -1)` credits Ruby `chop` too loosely

## Context

trails#10494 added `TYPED_STRING_FORM.chop` (`scripts/api-compare/enumerable-idioms.ts`): the extractor (`extract-ts-api.ts`, `slice` case) credits any checker-proven-string `s.slice(0, -1)` as Ruby `String#chop`. MRI's `rb_str_chop` (`vendor/ruby/v3.3.11/string.c`, `chopped_length`) also removes a trailing `\r\n` pair as one unit, so the JS form is the whole port only where the value cannot end in `\r\n`. The one current credited site is `Duration#inspect` (`packages/activesupport/lib/duration.ts`, `vendor/rails/v8.0.2/activesupport/lib/active_support/duration.rb:455`, `unit.to_s.chop` over a unit-name literal).

## Acceptance criteria

- [ ] The `chop` credit applies only where the receiver is proven to not end in `\r\n` (e.g. a string-literal union type), or call sites that can see `\r\n` call ruby-compat's `chop`.
- [ ] `parity:api:calls` stays green with no new baseline row.
