---
title: "per-connection-default-timezone-convergence"
status: draft
updated: 2026-06-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced while implementing [[base-test-connection-default-timezone]] (PR #3320).

Rails stores `default_timezone` as per-adapter instance state
(`AbstractAdapter#default_timezone`, abstract_adapter.rb:167, 219-220), so two
simultaneous connections can cast date/time values in different zones. The
trails port resolves the cast zone from a process-wide singleton
(`type/internal/timezone.ts` → `setDefaultTimezone`), and
`ConnectionHandling.establishConnection` applies a config's `default_timezone`
to that singleton on success (`validateConfigDefaultTimezone`).

Observable result matches Rails for the single-connection case (what the
base_test tests exercise), but diverges with multiple connections: the last
`establish_connection` with a `default_timezone` wins for ALL subsequent casts
across ALL connections, instead of being scoped to that adapter.

This is the broader codebase pattern — date/time casting is global-zone
throughout (see the many "Respects ActiveRecord.default_timezone" comments).
Converging requires threading the adapter's `default_timezone` into the type
resolution path so casts read the per-connection value, not the global.

## Acceptance criteria

- [ ] Date/time casting reads the connection's `default_timezone` (per-adapter)
      rather than the process-wide singleton, matching Rails
      `AbstractAdapter#default_timezone` semantics.
- [ ] Two connections established with different `default_timezone` cast
      independently (regression test).
- [ ] `validateConfigDefaultTimezone`'s global-mutation note in
      `connection-handling.ts` removed once the per-connection path lands.
