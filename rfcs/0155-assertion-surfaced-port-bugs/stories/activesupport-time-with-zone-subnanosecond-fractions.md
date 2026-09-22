---
title: "TimeWithZone cannot keep a Float sub-nanosecond fraction (xmlschema(12))"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Parked `xmlschema with fractional seconds` in `packages/activesupport/src/core-ext/time-with-zone.test.ts` (3 Rails assertions; 2 before). Rails `test_xmlschema_with_fractional_seconds` (`vendor/rails/activesupport/test/core_ext/time_with_zone_test.rb:157-162`): `@twz += 0.1234560001` then `xmlschema(12) == "...123456000100-05:00"`. `TimeWithZone` stores an instant at nanosecond precision, so the `...0100` digits cannot be represented. Structural; not tried against a Rational-backed time.

## Acceptance criteria

- Either a representation that keeps the fraction, or `pnpm tasks block` with that reason.
