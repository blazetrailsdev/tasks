---
title: "The DateTime seat's instant is off by up to 59s for a sub-minute offset date_zone_to_diff keeps in seconds"
status: done
updated: 2026-08-09
rfc: "0088-date-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6272
claim: "2026-08-09T01:45:47Z"
assignee: "date-to-date-seat-raises-on-julian-only-spellings"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while shipping `datetime-temporal-seat-drops-the-parsed-offset` (PR #6267).

That story made `DateTime#toDatetime` (the port of `datetime_to_datetime`,
`vendor/date/ext/date/date_core.c:9101-9105`) carry the parsed offset into the
default return: a `Temporal.ZonedDateTime` in the offset time zone `of2str`
spells when `of` is nonzero, a `PlainDateTime` when it is zero.

**A sub-minute offset truncates to the minute in the seat**, which is the
decision that story asked to be made and recorded. `date_zone_to_diff`
(`vendor/date/ext/date/date_parse.c:523-528`) answers SECONDS — it multiplies
the parsed `hh`, `mm` and `ss` out and keeps all three, so
`Date._parse("2008-03-01T06:00:00-00:44:30")[:offset]` is `-2670` on ruby
3.3.11 — while a `Temporal` offset time zone is minute-precision and has
nowhere to put the 30.

The choice made was to spell the zone with `of2str` (`date_core.c:1973-1980`),
whose `"%c%02d:%02d"` drops the same seconds, so the seat agrees with
`DateTime#zone` (which already answers `"-00:44"`) rather than inventing a
third reading. The alternative — a `PlainDateTime` fallback — is strictly
lossier, dropping the whole offset rather than its last few seconds. Both are
cited at the call site on `DateTime#toDatetime`.

What remains: the seat's **instant** is wrong by up to 59 seconds for such a
value. `ZonedDateTime.epochNanoseconds` is derived from the truncated offset, so
a sub-minute-offset value round-tripped through the default return does not name
the same moment MRI's does. The exact seconds stay reachable on the gem-shaped
object (`DateTime#offset`, `DateTime#zone`), so nothing is lost from the port —
only from the seat.

## Converged shape

No Rails counterpart to converge toward: MRI has no seat, and `Temporal`'s
minute-precision offset zones are a genuine language limit rather than a port
choice. What is open is whether the limit is stated where it is measured:

- Add the case to RFC 0088's mapping table alongside the other `Temporal`
  carve-outs, naming the affected inputs (`date_zone_to_diff`'s seconds arm) and
  the size of the error, so a caller reading the table learns it without reading
  `toDatetime`'s body.
- Or narrow the default return for a sub-minute `of` to the gem-shaped object,
  which is the only value that holds the exact seconds — the same decision
  `date-to-date-seat-raises-on-julian-only-spellings` faces for `::Date`, and
  worth deciding with it rather than separately.

Note `packages/date/src/time.ts:26-28` keeps `::Time`'s offset as a `number` for
exactly this reason, so the precedent for "the seat cannot hold it, the port
can" already exists in the package.

## Acceptance criteria

- [ ] The sub-minute case is named in RFC 0088's mapping table, not only at the
      `toDatetime` call site.
- [ ] A test pins what `DateTime.parse("2008-03-01T06:00:00-00:44:30")`'s
      default return names as an instant, against live `ruby -rdate`.
- [ ] `pnpm parity:api:extra --package date` clean; no new baseline rows.
