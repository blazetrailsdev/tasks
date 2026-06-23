---
title: "am-arity-convergence"
status: ready
updated: 2026-06-23
rfc: "0045-data-layer-api-compare-100"
cluster: activemodel
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`api:compare`'s advisory arity dimension flags **13 activemodel** signature
mismatches (`output/arity-mismatches.json`, regenerate with
`pnpm api:compare --package activemodel --arity`). These files are already at
100% method-name match; only the signatures diverge:

- `attribute_methods.ts`: `missing_attribute(attr_name, stack)` vs TS
  `(attrName)`; `define_proxy_call` and `define_call` drop the
  `code_generator`/`parameters`/keyword args; (`attributes.ts`, `dirty.ts` share
  the `missing_attribute` arity gap via inclusion).
- `model.ts`/`api.ts`/`validations.ts`/`validations/absence.ts`:
  `validates_size_of()` (0-arg Rails alias of `validates_length_of`) vs TS
  `(attribute, options)`.
- `attribute_registration.ts`: `apply_pending_attribute_modifications` and
  `reset_default_attributes` take an extra leading `cls` in TS (static-host
  pattern) vs Rails instance arity.
- `naming.ts`: `match?()` vs TS `match(attribute, type?, options?)`.
- `validations/numericality.ts`: `parse_float(raw_value, precision, scale)` vs
  TS `()`.

Some are real signature bugs (e.g. `missing_attribute` dropping `stack`); some
are artifacts of the static-host porting pattern (the leading `cls`) that the
arity comparator can't model and should be excluded with a reason rather than
"fixed."

## Acceptance criteria

- Each of the 13 entries triaged: real signature gaps converge to the Rails
  signature (with a test if behavior changes); static-host/`cls`-prefix
  artifacts get an arity-exclusion entry with reason (mirror the existing
  api-compare exclude convention).
- `pnpm api:compare --package activemodel --arity` reports 0 unexplained
  activemodel arity mismatches.
- No method-name regressions (activemodel stays at its post-port match count).
