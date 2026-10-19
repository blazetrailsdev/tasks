---
title: "Converge MockResponse#identify_cookie_attributes onto mock_response.rb"
status: in-progress
updated: 2026-10-19
rfc: "0193-small-gem-ports-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#9093
claim: "2026-10-19T20:17:53Z"
assignee: "converge-mock-response-identify-cookie-attributes"
blocked-by: null
closed-reason: null
---

## Context

`packages/rack/src/mock-response.ts` `identifyCookieAttributes` diverges from
`Rack::MockResponse#identify_cookie_attributes`
(`vendor/rack/v3.1.14/lib/rack/mock_response.rb:100-121`):

- Rails splits each `bit` untrimmed (`bit.split('=', 2)` then strips each
  half); TS trims the bit first and uses `split("=", 2)`, which drops
  everything after a second `=` (JS `split` limit truncates, Ruby's keeps the
  remainder).
- Rails branches on `cookie_attributes.key? 'max-age'`; TS tests truthiness
  (`attrs["max-age"]`), so an empty `max-age=` value skips the arm.
- Rails parses `expires` with `Time.httpdate` (raises on a non-HTTP date); TS
  uses `new Date(...)`, which silently yields `Invalid Date`.
- The loop is a counted `for` from 1 instead of `cookie_bits.drop(1).each`.

## Acceptance criteria

- [ ] Body mirrors `mock_response.rb:100-121` line for line: untrimmed split
      with remainder kept, `Object.hasOwn(attrs, "max-age")`, an HTTP-date
      parse that raises like `Time.httpdate`.
- [ ] Ported `spec_mock_response.rb` cookie tests still pass.
