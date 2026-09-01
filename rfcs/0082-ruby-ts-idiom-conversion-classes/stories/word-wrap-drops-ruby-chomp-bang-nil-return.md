---
title: "word_wrap ends on Ruby's chomp!, whose nil return trails' non-bang chomp cannot produce"
status: draft
updated: 2026-09-01
rfc: "0082-ruby-ts-idiom-conversion-classes"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`word_wrap` ends on Ruby's **bang** `chomp!`, whose nil-on-no-change return is
the method's actual return value:

```ruby
# vendor/rails/actionview/lib/action_view/helpers/text_helper.rb:332
text.gsub(pattern, "\\1#{break_sequence}").chomp!(break_sequence)
```

`String#chomp!` (`vendor/ruby/string.c:9808` `rb_str_chomp_bang`) returns `nil`
when it removes nothing, so Rails' `word_wrap` returns `nil` — not the wrapped
text — whenever the gsub result does not end in `break_sequence`.

trails' port calls the **non-bang** `chomp`, which always returns a String:

```ts
// packages/actionview/src/helpers/text-helper.ts:253
return chomp(replaced, breakSequence);
```

This surfaced in PR #7354, which converged that line from an inlined
`endsWith`/`slice` pair onto the newly-moved `chomp()` — the convergence was
call-for-call correct against the non-bang spelling and left the bang arm
exactly as it already was, so the divergence predates the PR and is unchanged
by it.

Reachability is narrow but real. The gsub appends `break_sequence` to every
match, so the common path always ends in it and `chomp!` returns a String. The
gap is `break_sequence: ""`: `chomp!("")` is Ruby paragraph mode and returns
`nil` unless the receiver ends in newlines, so
`word_wrap(text, break_sequence: "")` over text with no trailing newline is
`nil` in Rails and the full string in trails.

This is the in-place/bang idiom class — the sibling of
[[track-ruby-in-place-reject-bang]], which covers `reject!` in `extract!` and
`Duration#initialize` and does not reach `chomp!` or actionview. See also
[[track-bang-raise-semantics]], which is about bang forms that _raise_; `chomp!`
does not raise, it returns falsy, which is the arm CLAUDE.md's "Bang methods
raise; the non-bang form returns falsy. Port both arms" names second.

## Converged shape

Add `chompBang` beside `chomp` in `@blazetrails/ruby-compat`
(`packages/ruby-compat/src/string/chomp.ts`, moved there by #7354), returning
`string | null` and mirroring `rb_str_chomp_bang`'s "nil when nothing was
removed" contract, then spell `word_wrap`'s tail as Rails does:

```ts
return chompBang(replaced, breakSequence);
```

`wordWrap`'s return type widens to `string | null`, so the callers that consume
it have to port Rails' handling of the `nil` return rather than assuming a
String. Check `simple_format` and any helper that chains off `word_wrap` before
widening.

## Acceptance criteria

- `chompBang` exists in ruby-compat with a resolving
  `vendor/ruby/string.c:9808` citation and a `@noRailsEquivalent PERMANENT`
  receipt, and returns `null` exactly where MRI returns `nil` (verify against
  `ruby -e`, which is on PATH).
- `text-helper.ts:253` calls it, and `wordWrap`'s signature reflects the
  nullable return.
- Every `wordWrap` caller handles the `null` arm the way its Rails counterpart
  handles `nil`.
- A test covers `break_sequence: ""` over text with no trailing newline — the
  arm that actually differs today — and fails on the current implementation.
- `parity:api:calls` / `:calls:args` show no new rows.
