---
title: "tzinfo-data-timezone-is-a-real-subclass"
status: done
updated: 2026-11-11
rfc: "0223-package-layout-mirrors-a-rails-gem"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10007
claim: "2026-11-11T21:11:38Z"
assignee: "tzinfo-data-timezone-is-a-real-subclass"
blocked-by: null
closed-reason: null
---

## Context

`packages/tzinfo/lib/tzinfo.ts` seats two stand-ins on the `TZInfo` namespace:

- `DataTimezone: Timezone`: an alias. In the gem, `TZInfo::DataTimezone` is its own class (`vendor/tzinfo/v2.0.6/lib/tzinfo/data_timezone.rb`), a subclass of `InfoTimezone` (`info_timezone.rb`), which subclasses `Timezone`. `Timezone.get` answers a `DataTimezone` (or `LinkedTimezone`) through the data source (`timezone.rb`, `data_source.rb#get_timezone`). et-orbi's tests assert `rbObjClass(EtOrbi.determineLocalTzone())` equals `TZInfo.DataTimezone` (`packages/et-orbi/test/module.test.ts:430,439`), which passes only because of the alias.
- `Data: { name: "TZInfo::Data" }`: a placeholder for the tzinfo-data gem's module. Its one reader is et-orbi's `defined?(TZInfo::Data)` (`vendor/et-orbi/v1.2.11/lib/et-orbi/time.rb:88`, ported at `packages/et-orbi/lib/time.ts:92`).

## Acceptance criteria

- `info-timezone.ts` and `data-timezone.ts` port `InfoTimezone` and `DataTimezone` as real subclasses, and `Timezone.get` answers a `DataTimezone` instance.
- The `DataTimezone: Timezone` alias is gone; the et-orbi assertions pass against the real class.
- `TZInfo.Data` is either seated by a tzinfo-data stand-in (the Intl/tzdata source) that answers what et-orbi reads, or removed together with et-orbi's `"Data" in TZInfo` arm, citing the decision.
