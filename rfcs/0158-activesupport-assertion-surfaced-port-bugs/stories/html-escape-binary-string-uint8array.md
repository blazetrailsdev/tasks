---
title: "html-escape-binary-string-uint8array"
status: done
updated: 2026-11-17
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10237
claim: "2026-11-17T13:06:36Z"
assignee: "date-and-time-calculations-drops-eager-date-time-imports"
blocked-by: null
closed-reason: null
---

## Context

`unwrappedHtmlEscape` and `htmlEscapeOnce` (`packages/activesupport/lib/core-ext/tse/util.ts`) read their argument through `rbObjAsString`, the port of `s.to_s` in ERB's `html_escape` (`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/erb/util.rb:18`). For an ASCII-8BIT String, which is a `Uint8Array` per CLAUDE.md "An ASCII-8BIT String is a `Uint8Array`", `rbObjAsString` returns the bytes, so `Unicode.tidyBytes(...).replace` raises a `TypeError`. Ruby escapes a binary String. Found in review of trails#10143.

## Acceptance criteria

- [ ] A `Uint8Array` passed to `htmlEscape` / `htmlEscapeOnce` is read one character per byte for the scan, as CLAUDE.md prescribes for a regex over binary bytes, and is escaped, not raised on.
- [ ] A test covers both helpers with a `Uint8Array` input.
