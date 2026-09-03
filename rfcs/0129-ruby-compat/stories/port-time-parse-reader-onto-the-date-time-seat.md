---
title: "Port Time.parse onto @blazetrails/date's Time, the stdlib reader Cookie#expires and Messages::Metadata both need"
status: draft
updated: 2026-09-03
rfc: "0129-ruby-compat"
cluster: null
packages: ["date", "activesupport"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Time.parse` (Ruby stdlib, `vendor/ruby/lib/time.rb:381`) has no port.
`packages/activesupport/src/messages/metadata.ts:176` already records the gap in
prose — "`Time.parse` has no Temporal equivalent, so the non-standard-format
branch ..." — and
`0023-surfaced-deviations/converge-messages-metadata-onto-time-analogue` lists
`Time.parse(expires_at)` (`metadata.rb:113-118`) as one of five Rails `Time`
calls with no receiver to land on.

The seat is `@blazetrails/date`'s `Time` (`packages/date/src/time.ts:524`),
beside `Time.now` (`:572`), on the precedent set by
`0023-surfaced-deviations/port-time-xmlschema-reader-to-date-package`: stdlib
`time.rb` **readers** belong on that class, which already carries the instance
`#xmlschema` (`time.ts:598`). It is filed under this RFC because it is a Ruby
stdlib value-type member, not because it lands in `ruby-compat`.

Surfaced by RFC 0137-rack-test-gem-port. `Rack::Test::Cookie#expires` is
`Time.parse(@options['expires'])` (`cookie_jar.rb:82`) and `#expired?` is
`expires && expires < Time.now` (`:87`) — so `port-rack-test-cookie-jar` cannot
be written faithfully without it. Cookie `Expires` values are RFC 2822 / RFC
1123 date strings, which `Temporal` will not take and which JS `Date` parses
with implementation-defined leniency, so neither is a substitute.

## Acceptance criteria

- [ ] `Time.parse` on `packages/date/src/time.ts`, written against
      `vendor/ruby/lib/time.rb`'s `Date._parse`-driven implementation, taking
      Ruby's `now` second argument.
- [ ] A test pins at least one RFC 2822 / RFC 1123 input (the cookie `Expires`
      shape) and at least one input where MRI and JS `Date` disagree. Verify
      MRI's answer by running `ruby`, which is on PATH — do not derive it.
- [ ] `pnpm parity:api` delta non-negative; the member is scored against
      `ruby/lib/time.rb`, not left as extra surface.
