---
title: "TimeZone#rfc3339 hand-rolls a regex + JS Date instead of Date._rfc3339 parts"
status: ready
updated: 2026-09-06
rfc: "0111-error-class-message-parity"
cluster: bare-error-throws
packages: []
deps: []
deps-rfc: []
est-loc: 110
priority: 20
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #6558 (RFC 0096 wave-4 naming burndown for activesupport). A
`class: "naming"` call-argument row on
`packages/activesupport/src/values/time-zone.ts` survives because `rfc3339` is a
wholly different implementation, not a rename.

Rails, `activesupport/lib/active_support/values/time_zone.rb:469-485`:

    def rfc3339(str)
      parts = Date._rfc3339(str)

      raise ArgumentError, "invalid date" if parts.empty?

      time = Time.new(
        parts.fetch(:year),
        parts.fetch(:mon),
        parts.fetch(:mday),
        parts.fetch(:hour),
        parts.fetch(:min),
        parts.fetch(:sec) + parts.fetch(:sec_fraction, 0),
        parts.fetch(:offset)
      )

      TimeWithZone.new(time.utc, self)
    end

trails, `values/time-zone.ts:1083-1093`, validates with a hand-rolled regex,
parses with the JS `Date` constructor, and wraps with `instantFrom(date)`:

    rfc3339(str: string): TimeWithZone {
      const trimmed = str?.trim() ?? "";
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}([.]\d+)?(Z|[+-]\d{2}:\d{2})$/.test(trimmed)) {
        throw new Error("invalid date");
      }
      const date = new Date(trimmed);
      ...
      return new TimeWithZone(instantFrom(date), this);
    }

The sibling `iso8601` (time_zone.rb:396) is already ported through a
`parts`-style path, and `@blazetrails/date` carries the `Date._rfc3339` spine, so
the parts-based shape is available here. The regex is also stricter than Ruby's
parser in ways not measured (it rejects fractional-second-only and offset forms
`Date._rfc3339` accepts), and the raised error is a bare `Error` where Rails
raises `ArgumentError`.

## Converged shape

`rfc3339` built on `Date._rfc3339` parts + `Time.new(..., offset)` + `.utc`,
mirroring time_zone.rb:469-485, raising `ArgumentError` with the message
`"invalid date"`. The `new` naming row for `values/time-zone.ts` then clears in
`pnpm parity:api:calls:args:report`.

## Acceptance criteria

- [ ] `rfc3339` mirrors time_zone.rb:469-485, including the `parts.empty?` guard
      and `ArgumentError` (not bare `Error`).
- [ ] The regex pre-validation is gone; acceptance/rejection is whatever
      `Date._rfc3339` decides, as in Rails.
- [ ] The `new` naming row clears; no new `shape` row; no baseline row added.
- [ ] activesupport time-zone suites green on all three lanes.

## Re-homed from `0023-surfaced-deviations` (2026-08-18)

Moved by the RFC 0023 backlog triage pass into `0111-error-class-message-parity`, which was carved out
of that register for this deviation class. Nothing about the finding changed —
every Rails and trails `file:line` citation above is as originally filed.
