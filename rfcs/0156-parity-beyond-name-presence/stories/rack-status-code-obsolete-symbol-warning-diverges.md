---
title: "Rack Utils#status_code warns when Rails is silent and renders the Symbol with JSON.stringify"
status: draft
updated: 2026-09-24
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rack's `Utils#status_code` (`vendor/rack/lib/rack/utils.rb:589-605`) warns about an
obsolete status Symbol ONLY when it has no canonical mapping: the
`if canonical_symbol = OBSOLETE_SYMBOL_MAPPINGS[status]` arm is empty — its
`# message = "#{message} Please use #{canonical_symbol.inspect} instead."` line is
commented out ("For now, let's not emit any warning when there is a mapping", `:595-596`) —
and the `else` arm is `warn message, uplevel: 3`. The message renders the status with
`status.inspect`, i.e. `:payload_too_large`.

trails' `statusCode` (`packages/rack/src/utils.ts`, the `obsolete !== undefined` arm)
always warns, appends `Please use ${JSON.stringify(mapping)} instead.` when a mapping
exists, and renders the status with `JSON.stringify(s)` (`"payload_too_large"`). The
`Unrecognized status code` raise also comes after the table lookups rather than as
`OBSOLETE_SYMBOLS_TO_STATUS_CODES.fetch`'s block (`:592`).

## Acceptance criteria

- The obsolete arm mirrors `utils.rb:591-601`: no warning when
  `OBSOLETE_SYMBOL_MAPPINGS` has the status, `warn` otherwise, and no "Please use" suffix.
- The status renders as Ruby's Symbol inspect (`rbInspect` of the `":name"`-string Symbol value).
- `return status code and give deprecation warning for obsolete symbols`
  (`rack/test/spec_utils.rb`) asserts the warnings Rack's test asserts.
