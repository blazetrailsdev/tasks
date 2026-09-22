---
title: "rbObjAsString renders a toS-answering object through JS String() instead of its to_s"
status: draft
updated: 2026-09-22
rfc: "0154-ruby-compat-surfaced-deviations"
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

Surfaced by trails#7984. `rbObjAsString` (`packages/ruby-compat/src/object.ts:280`) ports
`rb_obj_as_string` (`vendor/ruby/string.c:1654`), which answers a String as is and otherwise
sends `to_s`. The port only special-cases Array / Hash / Number and falls back to JS
`String(value)`, so an object that answers `toS()` — an `ActiveSupport::Multibyte::Chars`, a
`SafeBuffer`, any trails class mirroring a Ruby `to_s` — renders as `[object Object]` (or its JS
`toString`) instead of its Ruby `to_s`. It is reached from the new String method table's
`gsub`/`sub` block and Hash arms (`packages/ruby-compat/src/string/sub.ts`), so
`"a".gsub(/a/) { mbChars("b") }` answers `"[object Object]"` where Ruby answers `"b"`.

## Converged shape

`rbObjAsString` dispatches `to_s` the way `rb_obj_as_string` does: a receiver answering `toS()`
renders through it, before the JS `String()` fallback.

## Acceptance criteria

- `rbObjAsString(x)` calls `x.toS()` when `x` answers it (`rbObjRespondTo(x, "toS")`).
- A trails test covers a `toS`-answering object and the gsub-block path.
