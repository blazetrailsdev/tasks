---
title: "mail-utilities-slice-range-and-chars-forward-wrap"
status: ready
updated: 2026-11-15
rfc: "0226-mail-stack-to-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Mail::Utilities#unparen` / `#unbracket` (`vendor/mail/2.8.1/lib/mail/utilities.rb:118-147`) are one `str.slice(1..-2)`. In trails (`packages/mail/lib/utilities.ts`) a `string` takes `slice(1, -1)` and a `Chars` takes `slice(new Range(1, -2))`, because ruby-compat has no `String#slice(Range)` that dispatches over a JS string and a `Chars`. Mail's `Chars` forwards missed names through `methodMissingPrototype` (`packages/mail/lib/multibyte/chars.ts`), which hands back the wrapped string's own JS member. That member returns a bare string, where `Chars#method_missing` (`chars.rb:48-57`) wraps a String result in `chars(result)` and returns `self` for a `!` name.

## Acceptance criteria

- [ ] `unparen` / `unbracket` make one slice call with the Rails `1..-2` Range for both receivers, and the `@inventedArm` receipts are removed.
- [ ] A JS-spelled String method forwarded by mail's `Chars` returns `chars(result)` for a String result, as `method_missing` does.
