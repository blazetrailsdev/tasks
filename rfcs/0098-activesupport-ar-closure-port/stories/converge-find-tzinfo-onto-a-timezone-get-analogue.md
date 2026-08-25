---
title: "findTzinfo probes Intl where Rails calls TZInfo::Timezone.get"
status: done
updated: 2026-08-19
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6733
claim: "2026-08-19T00:11:25Z"
assignee: "wave-4c-ar-core-residue-model-c"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #6730, which converged `TimeZone.create`/`initialize` onto Rails'
`(name, utc_offset = nil, tzinfo = nil)` allocator
(`vendor/rails/activesupport/lib/active_support/values/time_zone.rb:309-313`,
`alias_method :create, :new` at :211) and extracted `find_tzinfo` at the Rails
name (:207-209).

That extraction made the body of `find_tzinfo` visible to the call-set gate for
the first time, and it flagged one omission — Rails' `find_tzinfo` calls
`TZInfo::Timezone.get(MAPPING[name] || name)` (:208) where trails' `findTzinfo`
(`packages/activesupport/src/values/time-zone.ts`) probes
`new Intl.DateTimeFormat("en-US", { timeZone: ianaName })` and returns the IANA
name string. It is baselined as the `find_tzinfo` -> `get` row in
`scripts/api-compare/call-mismatches-exclude/activesupport/values/time-zone.json`;
that row is the debt this story retires.

The cause is the same seam `time-with-zone-residue-structural-blockers` is
blocked on: trails has no `TZInfo::Timezone` object, so a zone IS its IANA
identifier string and there is no `Timezone.get` to call. The `Intl` probe is
the resolve-or-raise (it throws `InvalidTimezoneIdentifier` for a name the
runtime does not know), so behaviour matches; only the callee does not.

## Converged shape

Once trails grows a zone object (the `time-with-zone-residue-structural-blockers`
seam), `findTzinfo` resolves through it — `Timezone.get(MAPPING[name] ?? name)`
— and `tzinfo` carries that object rather than a string. Sequence behind that
seam, or land the two together.

## Acceptance criteria

- [ ] `findTzinfo` calls a `Timezone.get` analogue rather than probing `Intl`
      directly, or the seam story establishes there is nothing to call.
- [ ] The `find_tzinfo` -> `get` row is DELETED from
      `call-mismatches-exclude/activesupport/values/time-zone.json` (the
      baseline only shrinks) and `parity:api:calls` is green without it.
- [ ] `TimeZoneTest` stays green on all lanes.
