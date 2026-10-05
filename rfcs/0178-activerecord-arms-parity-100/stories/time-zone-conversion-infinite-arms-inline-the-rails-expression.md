---
title: "activerecord: TimeZoneConverter's infinite? arms inline value.respond_to?(:infinite?) && value.infinite?"
status: ready
updated: 2026-10-05
rfc: "0178-activerecord-arms-parity-100"
cluster: arms
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::AttributeMethods::TimeZoneConversion::TimeZoneConverter` tests infinity inline, twice
(`vendor/rails/v8.0.2/activerecord/lib/active_record/attribute_methods/time_zone_conversion.rb:28,45`):

```ruby
elsif value.respond_to?(:infinite?) && value.infinite?
```

`packages/activerecord/src/attribute-methods/time-zone-conversion.ts` routes both through a
file-level `isInfinite(value)` helper Rails does not have, which probes `typeof fn === "function"`
and falls back to `value === Infinity || value === -Infinity`.

That fallback existed because a JS number answered no `isInfinite`. Since #8403 ruby-compat answers
`Float#infinite?` (`rb_flo_is_infinite_p`, `vendor/ruby/v3.3.11/numeric.c:1992`):
`rbObjRespondTo(Infinity, "isInfinite")` is true and `rbFSend(value, "isInfinite")` answers
`1` / `-1` / `nil`. #8403 converged the six `infinity?` helpers onto that; this file was outside its
story.

## Converged shape

Both arms are the Rails expression inline,
`rbObjRespondTo(value, "isInfinite") && rtest(rbFSend(value, "isInfinite"))`, and the file-level
helper is deleted (Rails inlines it; CLAUDE.md § "Decomposition").

## Acceptance criteria

- [ ] No `isInfinite` helper and no `=== Infinity` in `attribute-methods/time-zone-conversion.ts`.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:arms:report --package=activerecord` show no new
      row for the two converter methods.
