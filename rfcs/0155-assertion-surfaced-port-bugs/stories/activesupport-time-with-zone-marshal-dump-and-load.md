---
title: "TimeWithZone#marshal_dump / marshal_load are unported"
status: done
updated: 2026-09-24
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8043
claim: "2026-09-24T17:14:05Z"
assignee: "website-sandbox-drops-base-adapter-assignment"
blocked-by: null
closed-reason: null
---

## Context

Parked `marshal dump and load` and `marshal dump and load with tzinfo identifier` in `packages/activesupport/src/core-ext/time-with-zone.test.ts`. Rails `test_marshal_dump_and_load*` (`vendor/rails/activesupport/test/core_ext/time_with_zone_test.rb:659-680`) round-trip `Marshal.dump(@twz)`. trails has no `Marshal`; the earlier port round-tripped JSON, so the tests asserted less than Rails. The parked bodies reference `globalThis.Marshal`, which does not exist.

## Acceptance criteria

- Decide the marshal seam (`marshal_dump`/`marshal_load` on `TimeWithZone` at `time_with_zone.rb`); converge or `pnpm tasks block` if Marshal has no trails home.
