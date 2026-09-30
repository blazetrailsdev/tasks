---
title: "TimeWithZone: YAML load/dump tags and init_with / encode_with"
status: draft
updated: 2026-09-30
rfc: "0170-psych-in-ruby-compat"
cluster: fidelity
packages: ["activesupport"]
deps: ["psych-load-tags-dump-tags-and-domain-types"]
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activesupport/lib/active_support/time_with_zone.rb:174-181`
(`init_with`: `initialize(coder["utc"], coder["zone"], coder["time"])`;
`encode_with`: `coder.map = { "utc" => utc, "zone" => time_zone, "time" => time }`)
and `:608-609` (`load_tags` / `dump_tags` for
`!ruby/object:ActiveSupport::TimeWithZone`). trails'
`packages/activesupport/src/time-with-zone.ts` has neither. A TimeWithZone
today dumps its internal fields through `visit_Object`
(`psych-scalar-and-tag-visitors`' second criterion).

## Acceptance criteria

- [ ] `initWith` / `encodeWith` are ported, and the two tag registrations run
      at module load.
- [ ] The `time_with_zone_test.rb` YAML cases (`test_to_yaml`,
      `test_ruby_to_yaml`, `test_yaml_load`, `test_ruby_yaml_load`,
      `vendor/rails/v8.0.2/activesupport/test/core_ext/time_with_zone_test.rb:185-240`) run unskipped
      in `core-ext/time-with-zone.test.ts`, or are `BLOCKED:` on
      `psych-scalar-and-tag-visitors` for the `Time` / `TimeZone` scalar arms.

## Verification

`pnpm vitest run packages/activesupport/src/core-ext/time-with-zone.test.ts`.
