---
title: "Port Time.parse onto @blazetrails/date's Time, the stdlib reader Cookie#expires and Messages::Metadata both need"
status: claimed
updated: 2026-09-04
rfc: "0129-ruby-compat"
cluster: null
packages: ["date", "activesupport"]
deps: []
deps-rfc: []
est-loc: 150
priority: 5
pr: null
claim: "2026-09-04T14:50:46Z"
assignee: "port-zlib-gzipreader-open-for-schema-cache-read"
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
beside `Time.now` (`:572`), and this is settled by what that file already is
rather than by a judgement call:

- **`time.ts` already hosts four `ruby/lib/time.rb` members** — `#xmlschema`
  (`:1325`), `#iso8601` (`:1335`), `#rfc2822` (`:1342`) and `#httpdate`
  (`:1350`), each cited to `ruby/lib/time.rb`. The file is Ruby's `::Time` as
  trails needs it, core `time.c` members and stdlib-`time.rb` reopenings
  together, so a fifth `time.rb` member is the file's existing shape and not a
  new decision. Do not open a second file mirroring `lib/time.rb`.
- **A `ruby-compat` seat is barred.** `ruby-compat` is a leaf package
  (`scripts/ruby-compat-leaf.test.ts`, `enforce-ruby-compat-leaf-and-browser-freedom`)
  and does not depend on `@blazetrails/date` — stated at
  `packages/ruby-compat/src/comparable.ts:64` — while `date` already imports
  ruby-compat (`time.ts:25`). Reopening `Time` from ruby-compat inverts a live
  edge.
- **Ruby points the same way.** `vendor/ruby/lib/time.rb:4` is `require 'date'`,
  and `parse` (`:381-387`) is `Date._parse(date, comp)` then `make_time(...)`.
  `Date._parse` is ported in `packages/date/src/date.ts` (its answer-hash field
  set is documented at `date.ts:862`), the sibling module.

`0023-surfaced-deviations/port-time-xmlschema-reader-to-date-package` proposes
the same seat for the `Time.xmlschema` **reader**, but it is `status: draft` —
a proposal, not the reason. The four landed members above are the reason.

This story is filed under this RFC because `Time.parse` is a Ruby stdlib
value-type member, not because it lands in `ruby-compat`; it does not.

Surfaced by RFC 0137-rack-test-gem-port. `Rack::Test::Cookie#expires` is
`Time.parse(@options['expires'])` (`cookie_jar.rb:82`) and `#expired?` is
`expires && expires < Time.now` (`:87`) — so `port-rack-test-cookie-jar` cannot
be written faithfully without it. Cookie `Expires` values are RFC 2822 / RFC
1123 date strings, which `Temporal` will not take and which JS `Date` parses
with implementation-defined leniency, so neither is a substitute.

## Acceptance criteria

- [ ] `Time.parse` on `packages/date/src/time.ts`, beside the four
      `lib/time.rb` members already there, written against
      `vendor/ruby/lib/time.rb`'s `Date._parse`-driven implementation, taking
      Ruby's `now` second argument.
- [ ] A test pins at least one RFC 2822 / RFC 1123 input (the cookie `Expires`
      shape) and at least one input where MRI and JS `Date` disagree. Verify
      MRI's answer by running `ruby`, which is on PATH — do not derive it.
- [ ] `pnpm parity:api` delta non-negative; the member is scored against
      `ruby/lib/time.rb`, not left as extra surface.
