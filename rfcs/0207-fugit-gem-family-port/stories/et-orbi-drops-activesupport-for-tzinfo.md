---
title: "et-orbi-drops-activesupport-for-tzinfo"
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

trails#9298 moved the TZInfo stand-in into `@blazetrails/tzinfo`
(`packages/tzinfo/src/tzinfo.ts`); activesupport now imports it. The et-orbi half
of `tzinfo-stand-in-becomes-its-own-package` waits on `port-et-orbi-package`.

Once et-orbi stops reaching the stand-in through `@blazetrails/activesupport`,
loading it no longer installs ActiveSupport's `Time#<=>` (`compare_with_coercion`,
`packages/activesupport/src/core-ext/time/calculations.ts:310`). MRI's `time_cmp`
(`vendor/ruby/v3.3.11/time.c:3951`) hands a non-Time to `rb_invcmp`
(`vendor/ruby/v3.3.11/compar.c:50`), and `Time#==` is `cmp_equal` (`compar.c:79`).
et-orbi's `TopLevel.Trails` read in `packages/et-orbi/src/info.ts`
(`et-orbi.rb:36`) becomes `registeredConstant("Rails")`.

## Acceptance criteria

- [ ] `@blazetrails/et-orbi` imports `Timezone` and the other stand-in names from `@blazetrails/tzinfo` and no longer depends on `@blazetrails/activesupport`.
- [ ] `@blazetrails/date` `Time#compare` hands a non-Time to `rb_invcmp`, and `Time` gains `equals` as `Comparable#==` (`cmp_equal`).
- [ ] `vendor/et-orbi/v1.2.11/spec/eo_time_spec.rb:781` "Time == EoTime > returns true when same sec" is unparked in `packages/et-orbi/src/eo-time.test.ts` and passes.
