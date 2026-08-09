---
title: "countryZones diverges from Rails on link-backed zone identifiers (Europe/Vatican vs Europe/Rome)"
status: done
updated: 2026-08-09
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6276
claim: "2026-08-09T02:45:47Z"
assignee: "migration-context-collaborator-readers-cast-away-the-null-object"
blocked-by: null
closed-reason: null
---

## Context

`TimeZone.countryZones` (`packages/activesupport/src/values/time-zone.ts`,
added by PR 6250) resolves its zone identifiers from
`Intl.Locale#getTimeZones`, standing in for
`TZInfo::Country.get(code).zone_identifiers` in `load_country_zones`
(`vendor/rails/activesupport/lib/active_support/values/time_zone.rb:283-296`).
The two read different databases and disagree on zones that are tzdata LINKS
rather than ZONES: TZInfo answers the canonical target, `Intl` answers the
link name.

Measured on ruby 3.3.11 / tzinfo vs node:

```text
TZInfo::Country.get("VA").zone_identifiers  # => ["Europe/Rome"]
new Intl.Locale("und-VA").getTimeZones()    # => ["Europe/Vatican"]
```

`aq` shows the same mechanism four times over — TZInfo reports the canonical
targets `Pacific/Auckland`, `Pacific/Port_Moresby`, `Asia/Riyadh` and
`Asia/Singapore` where `Intl` reports the links `Antarctica/McMurdo`,
`Antarctica/DumontDUrville`, `Antarctica/Syowa` and `Antarctica/Vostok`, so
the two lists differ in length (11 vs 10) as well as in membership.

So `TimeZone.countryZones("va")` answers a zone named `Europe/Vatican` where
Rails answers `Europe/Rome` — and `Europe/Rome` is a `MAPPING` value
(`Rome`), so Rails takes the mapped-name branch and answers the Rails-named
`Rome` zone, while trails takes the `create(tz_id)` branch and answers an
IANA-named one. Same instant, different `name`, different `to_s`, and a
different member of `all()`.

No Rails test covers a link-backed country, which is why
`test_country_zones*` pass either way. `us`, `ru`, `au`, `gb` and `sv` — the
codes Rails does test — are all ZONE-backed and agree.

## Converged shape

The link→canonical direction is the whole of the gap: resolving each
identifier `Intl` reports through tzdata's backward-compatibility links before
the `MAPPING.value?` test would make both branches agree with Rails. The
runtime does not expose that table (`Intl.supportedValuesOf("timeZone")` lists
link names alongside canonical ones without distinguishing them), so it has to
come from somewhere — the smallest option is the `backward` link pairs for the
codes `MAPPING` covers, generated into a table under `values/`, NOT a runtime
dependency (CLAUDE.md forbids new third-party runtime deps).

Worth confirming first whether `Intl.DateTimeFormat#resolvedOptions().timeZone`
canonicalizes links on the target runtimes — if it does, the table is
unnecessary and this is a two-line fix.

## Acceptance criteria

- [ ] `TimeZone.countryZones("va")` answers the Rails-named `Rome` zone, as
      Rails does.
- [ ] A test pins a link-backed country code alongside the ZONE-backed ones
      Rails already covers.
- [ ] `test_country_zones` and its three siblings still pass.
