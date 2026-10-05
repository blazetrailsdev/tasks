---
title: "Port Array#join to ruby-compat (rbAryJoin) and converge Thor's flat(Infinity).join sites"
status: draft
updated: 2026-10-05
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `Array#join` (`vendor/ruby/v3.3.11/array.c:2806` `rb_ary_join`, entered from
`rb_ary_join_m`, `array.c:2873`) is not JS `Array.prototype.join`:

- it recurses into a nested Array with the same separator (`ary_join_1_ary`, `array.c:2760`),
  where JS joins the inner array with `,`;
- it raises `ArgumentError` "recursive array join" for a self-containing array
  (`recursive_join`, `array.c:2715`);
- it converts each element with `to_str` / `to_ary` / `to_s` (`ary_join_1`, `array.c:2778`),
  so a Symbol element renders as its name, where a trails Symbol value is the string `":name"`.

ruby-compat has no port of it. trails#8533 hit this in `Thor::Actions#thor`
(`vendor/thor/v1.3.2/lib/thor/actions.rb:316`, `command = args.join(" ").strip`) and shipped
the workaround already used twice in the Thor port:

- `packages/trailties/src/thor/actions.ts`, `thor`: `strip(args.flat(Infinity).join(" "))`;
- `packages/trailties/src/thor/parser/argument.ts:98`: `[...this.enum].flat(Infinity).join(", ")`;
- `packages/trailties/src/thor/shell/basic.ts:259`: `answerSet.flat(Infinity).join(", ")`.

`flat(Infinity)` covers the recursion only. It loops forever on a self-containing array and
does not apply Ruby's element conversion, so `thor :list, :all` would join `":all"` where
Ruby joins `all`.

## Converged shape

A ruby-compat `rbAryJoin(ary, sep)` ported from `rb_ary_join` with its helpers at their MRI
names, carrying the `@noRailsEquivalent PERMANENT` receipt and MRI citation the package
requires, and registered in `scripts/parity/ruby-compat.ts` so the call gates credit it as
the port of `Array#join`. The three Thor sites call it in place of `flat(Infinity).join`.

## Acceptance criteria

- [ ] `rbAryJoin` is ported from `vendor/ruby/v3.3.11/array.c:2715-2873`: nested arrays
      recurse with the same separator, a recursive array raises `ArgumentError`
      "recursive array join", and elements convert as `ary_join_1` does.
- [ ] The three Thor sites above call `rbAryJoin`; no `flat(Infinity).join` remains in
      `packages/trailties/src/thor`.
- [ ] `Thor::Actions#thor` joins a Symbol argument by its name (`thor :list, :all` builds
      `thor list all`), covered in a `.trails.test.ts`.
- [ ] `parity:api:calls`, `parity:api:calls:args` and `parity:api:extra:gate` stay green.
