---
title: "wire-messages-metadata-parse-expiry-onto-time-parse"
status: in-progress
updated: 2026-09-05
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 4
pr: 7524
claim: "2026-09-05T17:26:48Z"
assignee: "wire-messages-metadata-parse-expiry-onto-time-parse"
blocked-by: null
closed-reason: null
---

## Context

`Time.parse` (`vendor/ruby/lib/time.rb:381-387`) now exists on
`@blazetrails/date`'s `Time`, ported in PR #7484 together with its
`zone_offset` / `zone_utc?` / `force_zone!` / `month_days` / `apply_offset` /
`make_time` collaborators. The two consumers that motivated it are still
unwired.

`ActiveSupport::Messages::Metadata#parse_expiry`
(`vendor/rails/activesupport/lib/active_support/messages/metadata.rb:113-118`)
is

```ruby
def parse_expiry(expires_at)
  if !expires_at.is_a?(String)
    expires_at
  elsif ActiveSupport.use_standard_json_time_format
    Time.iso8601(expires_at)
  else
    time = Time.parse(expires_at)
    time.utc? ? time : time.getutc
  end
end
```

`packages/activesupport/src/messages/metadata.ts:160-176` carries
`@missingRailsCall iso8601 — PERMANENT` and `@missingRailsCall parse —
PERMANENT` plus a `new Date(expiresAt).getTime()` fallback whose stated
justification — "Ruby's lenient `Time.parse` has no Temporal equivalent" — is no
longer true. PR #7484 re-pointed the `parse` tag at this story; the `iso8601`
one still needs its own look.

`Rack::Test::Cookie#expires` (`cookie_jar.rb:82`) is the second consumer, and
`port-rack-test-cookie-jar` under RFC 0137 can now be written against the real
reader.

## Acceptance criteria

- `parseExpiry` calls `Time.parse` (and `Time.iso8601`) rather than `new Date`,
  with Rails' `time.utc? ? time : time.getutc` arm.
- The `@missingRailsCall parse` tag and the boundary comment are deleted, not
  re-worded; state whether `iso8601` can go with them.
- `pnpm parity:api:calls` shows the two rows converging, never a new baseline
  row.
- Check the activesupport -> date workspace edge exists before assuming it; if
  it does not, that is the first thing this story settles.
