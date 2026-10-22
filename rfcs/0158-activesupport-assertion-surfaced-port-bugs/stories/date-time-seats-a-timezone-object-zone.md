---
title: "@blazetrails/date Time seats a timezone object (local_to_utc / utc_to_local) as its zone"
status: draft
updated: 2026-10-22
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: ["date"]
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

Prerequisite of `activesupport-time-new-timezone-object-argument`, which is
blocked on it.

Ruby's `Time.new(y, m, d, h, mi, s, zone)` accepts a timezone **object**: any
object answering `local_to_utc` / `utc_to_local`
(`vendor/ruby/v3.3.11/time.c`, `find_timezone`, `zone_timelocal`,
`zone_localtime`). The Time keeps the object as its zone and calls back into
it whenever a field or an arithmetic result is re-resolved (`+ 0`, and the
`zone.respond_to?(:utc_to_local)` arm of
`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/time/calculations.rb:147`).
`ActiveSupport::TimeZone` is such an object.

`@blazetrails/date`'s `Time` (`packages/date/src/time.ts`) seats a zone only
as a Temporal IANA id or a fixed offset (`Time.new`'s `zone` is typed
`string | number | TimeNewOptions | null`), and `ActiveSupport::TimeZone`
exposes no IANA id through the Ruby protocol. So a zone object cannot be
seated without a new seat mode in `time.ts`.

## Acceptance criteria

- `Time.new` and `Time.at(..., in:)` accept an object answering
  `localToUtc` / `utcToLocal` and keep it as the Time's zone, as
  `find_timezone` does, with the field readers and `+` / `-` / `change`
  re-resolving through it, cited to the `time.c` functions they port.
- `Time#zone` answers the object, and `Time#inspect` renders the offset Ruby
  renders for a zone-object Time.
- `packages/date` tests cover a minimal zone object; the existing
  string/offset arms are unchanged.
