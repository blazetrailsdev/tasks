---
title: "scrub decodes each UTF-8 sequence with a BOM-stripping TextDecoder, so htmlEscape drops U+FEFF"
status: done
updated: 2026-10-29
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: trails#9441
claim: "2026-10-29T16:29:26Z"
assignee: "scrub-drops-a-byte-order-mark"
blocked-by: null
closed-reason: null
---

## Context

Found by `rails/script/tandem` on trailmap#93: a session transcript whose tool output carries U+FEFF (a CI log does) renders with it in Rails (`ERB::Util.html_escape`) and in ringo, and without it in trails.

The cause is `packages/ruby-compat/src/string/scrub.ts:26` (`dist/string/scrub.js:22` in the vendored build). It runs `new TextDecoder().decode(...)` on each valid UTF-8 sequence. A default `TextDecoder` strips a leading byte-order mark, and each sequence is decoded on its own, so every U+FEFF in the string is removed. The path into it is `htmlEscape` → `unwrappedHtmlEscape` → `Unicode.tidyBytes` → `scrub` (activesupport `core-ext/tse/util.js:16`, `multibyte/unicode.js:23`).

Expected shape: `scrub` keeps every valid sequence byte for byte, as Ruby's `String#scrub` does. `new TextDecoder("utf-8", { ignoreBOM: true })`, or decoding the whole valid run in one call with `ignoreBOM: true`.

## Acceptance criteria

- `scrub("a﻿b")` and `htmlEscape("a﻿b")` return the U+FEFF unchanged.
- A ruby-compat test holds it, beside Ruby's `"a﻿b".scrub`.
- trailmap's `rails/DEVIATIONS.md` entry "trails: `htmlEscape` drops U+FEFF" is removed at the next re-vendor.
