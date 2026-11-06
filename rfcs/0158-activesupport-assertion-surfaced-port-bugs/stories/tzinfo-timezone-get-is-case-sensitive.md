---
title: "TZInfo Timezone.get rejects a non-exact (lowercase) identifier"
status: draft
updated: 2026-11-06
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

TZInfo looks identifiers up case-sensitively: `TZInfo::Timezone.get("america/new_york")` raises `TZInfo::InvalidTimezoneIdentifier` from `DataSource#load_timezone_info`. trails' `packages/tzinfo/src/index.ts` `Timezone.get` validates with `new Intl.DateTimeFormat(..., { timeZone })`, which is case-insensitive. Its tzdata check (`tzdataAbbreviation(identifier, 0) === undefined`, added in trails#9758) goes through `zoneRow` (`packages/date/src/tzdata-abbreviations.ts:653`), which also matches lowercase ids. So `Timezone.get("america/new_york")` succeeds, and its `identifier` is the lowercase string.

## Acceptance criteria

- `Timezone.get` raises `InvalidTimezoneIdentifier` for an identifier that is not an exact tzdata zone or link name (`america/new_york`), as TZInfo does.
- A trails test pins the raise next to the `+05:00` one in `packages/tzinfo/src/index.trails.test.ts`.
