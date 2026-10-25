---
title: "date-zone-abbreviations-read-tzdata-not-intl-locale"
status: draft
updated: 2026-10-25
rfc: "0207-fugit-gem-family-port"
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

`tzdataAbbreviation` in `packages/date/src/time.ts` answers a zone's
abbreviation from the tzdata table it carries, and otherwise falls back to
`Intl`. trails#9299 (et-orbi) added a second fallback at
`packages/date/src/time.ts:175`: for `Europe/*` zones only, it takes the
`en-GB` short name unless it matches `/^(GMT|UTC)/`. That is a locale
heuristic with no tzdata source. Other European zones, and any non-Europe zone
with a real letter abbreviation (Ruby's `Time#zone` reads the tzdata `%z` /
letter abbreviation), still fall through to `+HH`.

## Acceptance criteria

- [ ] `tzdataAbbreviation` answers every zone's abbreviation from tzdata (the zic `FORMAT` / letter data), not from an `Intl` locale.
- [ ] The `en-GB` / `Europe/*` fallback is deleted.
- [ ] `packages/et-orbi/src/*.test.ts` and `packages/date` time tests stay green.
