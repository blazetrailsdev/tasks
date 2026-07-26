---
rfc: "0076-execute-primitive-convergence"
title: "execute/raw_execute/perform_query primitive convergence"
status: draft
created: 2026-07-26
updated: 2026-07-26
owner: "@your-handle"
packages:
  - "activerecord"
clusters:
  - "adapters"
---

Extracted from RFC 0023 (surfaced-deviations) triage, 2026-07-26.

Rails funnels every statement through one spine: `execute` -> `raw_execute` -> `perform_query`, with `log` as the single sql.active_record emitter and the query-cache dirties set keyed off `execute`, not `raw_execute`. trails' equivalents (execute/executeMutation split, vestigial per-adapter performQuery ports, inline payload literals, hand-rolled batch/DDL paths) each deviate individually; this RFC collects the open convergence stories so the spine is rebuilt once, in dependency order, instead of story-by-story against a moving target.
