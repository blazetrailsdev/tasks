---
title: "TimeWithZone#to_fs must resolve through Time::DATE_FORMATS, not a hand-rolled switch"
status: done
updated: 2026-08-17
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 6670
claim: "2026-08-17T21:28:00Z"
assignee: "converge-request-method-onto-methodoverride-original-method"
blocked-by: null
closed-reason: null
---

# `TimeWithZone#to_fs` must resolve through `Time::DATE_FORMATS`

Sibling of the done [[route-time-and-date-to-fs-through-date-formats]] (#6645),
which converged `Time#to_fs` and `Date#to_fs` onto the registry but left
`TimeWithZone#to_fs` on its own hand-rolled switch.

## Context

Rails, `activesupport/lib/active_support/time_with_zone.rb:212-220`:

```ruby
def to_fs(format = :default)
  if format == :db
    utc.to_fs(format)
  elsif formatter = ::Time::DATE_FORMATS[format]
    formatter.respond_to?(:call) ? formatter.call(self).to_s : strftime(formatter)
  else
    to_s
  end
end
alias_method :to_formatted_s, :to_fs
```

Every key in `Time::DATE_FORMATS` therefore works on a `TimeWithZone` —
`:number`, `:usec`, `:nsec`, `:long_ordinal`, `:time`, and any format an app
registers into the hash at boot.

trails' `packages/activesupport/src/time-with-zone.ts` (`toFs`, around :497)
instead hard-codes a `switch` over `db`, `long`, `short`, `rfc822`, `rfc2822`,
`iso8601`, `xmlschema` and `inspect`, and falls through to `toString()` for
anything else. It never consults `DATE_FORMATS`. So:

- `:usec`, `:nsec`, `:number` and `:time` silently return the default string
  instead of their formats.
- An app-registered custom format is unreachable, which is the registry's whole
  point.

Surfaced in PR #6663 while converging `Relation#compute_cache_version`'s
`timestamp.utc.to_fs(cache_timestamp_format)` (`relation.rb:511`) — the
cache-timestamp formats are exactly `:usec` and `:number`, so a `TimeWithZone`
receiver reaching this method would render the wrong cache version. That PR's
receiver is a `Temporal.Instant` and goes through `time-ext.ts`'s `toFs`
(already converged by PR 6645), so it was not affected.

## Converged shape

Delete the switch. Mirror the Ruby three arms exactly: the `:db` special case
delegating to the UTC receiver's `to_fs`, then the `DATE_FORMATS` lookup with
the callable-vs-strftime split, then `to_s`. `DATE_FORMATS` is already exported
from `time-ext.ts` and already carries the callable/string union and the
`DateFormatsReceiver` duck-typing that #6645 established — reuse it rather than
building a second registry.

Watch the import direction: `time-ext.ts` already imports `TimeWithZone`, so
reading `DATE_FORMATS` back from `time-with-zone.ts` closes a cycle. Verify with
a plain-node import of the BUILT `dist/**.js` modules as entry modules, per
CLAUDE.md's call-time-constant section — a vitest run enters through a funnel
module and would mask a TDZ.

## Acceptance criteria

- [ ] `TimeWithZone#toFs` mirrors time_with_zone.rb:212-220 line for line.
- [ ] `:usec`, `:nsec`, `:number` and `:time` render correctly on a
      `TimeWithZone`; a format registered into `DATE_FORMATS` after boot is
      reachable.
- [ ] No second copy of the registry; no cycle-induced TDZ, verified against
      `dist/`.
- [ ] `pnpm parity:api:calls` green; no new baseline rows.
