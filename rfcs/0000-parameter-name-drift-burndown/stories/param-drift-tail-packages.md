---
title: "Parameter-name drift: globalid, abstractcontroller, did-you-mean and test-support"
status: draft
updated: 2026-08-28
rfc: "0000-parameter-name-drift-burndown"
cluster: fidelity
packages:
  - abstractcontroller
  - globalid
deps:
  - parity-api-compares-parameter-names-beside-arity
deps-rfc: []
est-loc: 60
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The four packages whose whole parameter-name population is a handful of rows.
Cheap, and each one ends with a package enrolled in the only-shrink gate, which
is the point: an enrolled package can never regress.

```text
globalid            locator.rb#find_allowed?            @0  model_class → klass
abstractcontroller  base.rb#available_action?           @0  action_name → action
abstractcontroller  helpers.rb#define_helpers_module    @0  klass → cls
abstractcontroller  helpers.rb#all_helpers_from_path    @0  path → paths
did-you-mean        spell_checker.rb#normalize          @0  str_or_symbol → input
```

`activerecord-test-support`'s two rows are a SWAP, not a rename, and belong to
`param-drift-positional-misalignment-is-a-dropped-parameter`; that package
enrols there, not here.

Note `globalid`'s row runs the opposite way to the usual drift: Rails spells it
`model_class` (`vendor/globalid/lib/global_id/locator.rb`) and the port
shortened it to `klass`. The Rails identifier wins either way.

## Acceptance criteria

- The five parameters carry the Rails identifier, camelCased, verified against
  `vendor/`.
- `globalid`, `abstractcontroller` and `did-you-mean` each read 0 rows and enrol
  in the gate in this PR: added to `GATED_PACKAGES` in
  `scripts/api-compare/param-name-mark.ts` with a `{ "total": 0, "byFile": {} }`
  mark. `pnpm parity:api:params` reports each OK.
- No behaviour change, no test renamed, no new baseline row anywhere.
