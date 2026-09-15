---
title: "Time#zone returns the abbreviation for a zone-object time, so change reads an invented isZoneObject"
status: draft
updated: 2026-09-15
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#7785 made `Time#change` (`activesupport/lib/active_support/core_ext/time/calculations.rb:146-172`) spell Rails' four arms, but its `zone.respond_to?(:utc_to_local)` arm reads `Time#isZoneObject` (`packages/date/src/time.ts`, `@noRailsEquivalent PERMANENT`), a getter MRI does not have. In MRI `Time#zone` (`vendor/ruby/time.c:5020-5037` `time_zone`) returns the timezone OBJECT for a time built with one, and a String only for the process-local zone. trails' `Time#zone` returns an abbreviation String for both.

## Converged shape

`Time#zone` returns a zone object (answering `utcToLocal`, plus whatever `%Z`/inspect need) for an `in:`/`getlocal(tz)` time, and the abbreviation String for a local one; `change` spells `rbObjRespondTo(this.zone, "utcToLocal")`; `isZoneObject` is deleted.

## Acceptance criteria

- [ ] `Time#isZoneObject` is removed and `calculations.ts` `change` reads `zone` as Rails does.
- [ ] Consumers of `Time#zone` (strftime `%Z`, inspect, TimeWithZone) keep MRI's output for zone-object times.
