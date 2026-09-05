---
title: "Port Time.strptime, Time.rfc2822 and Time.httpdate, the three class-level time.rb readers left after xmlschema"
status: draft
updated: 2026-09-05
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #7524 ported `Time.xmlschema` / `alias iso8601 xmlschema`
(`vendor/ruby/lib/time.rb:620-653`) onto `@blazetrails/date`'s `Time` so
`Messages::Metadata#parse_expiry` could call `Time.iso8601`. Porting it made
plain that `xmlschema` was the last of four sibling class-level readers in
`time.rb`'s `class << self` block still to land, and the other three are still
absent from `packages/date/src/time.ts`:

- `Time.strptime(date, format, now = self.now)` — `vendor/ruby/lib/time.rb:456-506`
- `Time.rfc2822(date)` (aliased `rfc822`) — `vendor/ruby/lib/time.rb:508-564`
- `Time.httpdate(date)` — `vendor/ruby/lib/time.rb:566-598`

All three end in the same `make_time` / `apply_offset` / `force_zone!` /
`zone_offset` collaborators `parse` and `xmlschema` already use
(ported in #7484 and #7524), so no new machinery is needed — `strptime` needs
`Date._strptime`, which `packages/date/src/date.ts` already exports.

The instance halves (`Time#rfc2822`, `Time#httpdate`, `Time#xmlschema`) are
already ported at `packages/date/src/time.ts`; only the class-level parsers are
missing.

## Acceptance criteria

- `Time.strptime`, `Time.rfc2822` (with the `rfc822` alias) and `Time.httpdate`
  are ported line for line from the cited `time.rb` lines, with Rails' locals,
  branch order and `ArgumentError` messages.
- The `rfc822` alias is assigned AFTER the class body
  (`Time.rfc822 = Time.rfc2822;`) with a `static declare` at the Rails line —
  a `static x = Time.y` field initializer is rewritten by esbuild to
  `_a.y` and throws at module eval, which reddened four CI jobs on #7524.
- Trails-only cases in `time.trails.test.ts`, expectations checked against MRI
  (`ruby -rtime`).
