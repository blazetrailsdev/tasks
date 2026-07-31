---
title: "Keep the arunit2-only tables out of the primary canonical schema"
status: done
updated: 2026-07-31
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps:
  - fixture-seeding-should-use-model-connection
deps-rfc: []
est-loc: 200
priority: null
pr: 5685
claim: "2026-07-30T23:15:18Z"
assignee: "arunit2-tables-should-leave-the-primary-schema"
blocked-by: null
closed-reason: null
---

## Context

Rails' `arunit` database never carries `colleges`/`courses`/`professors`/
`courses_professors`: `schema.rb:1444-1460` creates them through
`Course`/`College`/`Professor.lease_connection`, i.e. only in arunit2. trails
loads one canonical schema into the primary database, so the primary carries
them too.

`setupSecondPool` (`packages/activerecord/src/support/setup-second-pool.ts`)
papers over this by dropping the four tables from the primary for the duration
of `MultipleDbTest` and `teardownSecondPool` puts them back — surgery with no
Rails counterpart, needed only because the primary schema is wrong. It is what
makes `MultipleDbTest`'s "exception contains correct pool" assertion meaningful.

The blocker is the fixture-registry seed loop and any suite that reaches these
tables through `Base.adapter`; see [[fixture-seeding-should-use-model-connection]].

## Acceptance criteria

- The four tables leave the primary canonical schema (`test-schema.ts` and
  `support/canonical-schema.ts` — both sources must change together) and exist
  only in arunit2.
- `setupSecondPool`'s primary drops and `teardownSecondPool` disappear.
- `dogs` is unaffected: `schema.rb:559` puts the full-shape table in the primary
  and `schema.rb:1462` a bare id-only one in arunit2.
