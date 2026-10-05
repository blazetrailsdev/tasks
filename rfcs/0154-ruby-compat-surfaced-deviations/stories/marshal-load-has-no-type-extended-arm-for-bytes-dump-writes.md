---
title: "Marshal.load has no TYPE_EXTENDED arm, so it cannot load an extended object Marshal.dump writes"
status: draft
updated: 2026-10-05
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8520, which ported `w_extended`
(`vendor/ruby/v3.3.11/marshal.c:550-569`) into
`packages/ruby-compat/src/marshal.ts`. `Marshal.dump` of an object `extend`ed
with a named module now writes `TYPE_EXTENDED` (`e`) plus the module path
before the object, as MRI does. `Marshal.load` has no `TYPE_EXTENDED` arm
(`r_object_for`, `marshal.c:1899-1933`), so trails cannot load bytes it writes:
the `e` byte falls to the format-error default.

MRI's arm reads the path, `rb_path_to_class`, pushes the module on `extmod`,
loads the inner object with `extmod` threaded through `r_object0`
(`marshal.c:1861-1865`), and then `rb_extend_object`s each module; the
`TYPE_USRMARSHAL` arm applies `append_extmod` (`marshal.c:1841-1850,2225-2228,2242-2245`).
The prepended-class half (`RB_TYPE_P(m, T_CLASS)`, `marshal.c:1905-1920`) has no
trails seat: nothing is prepended to a singleton class.

Fixture bytes Ruby dumped for `Geo::Shape.new(:circle).extend(Geo::Kind)`:
`0408653a0e47656f3a3a4b696e646f3a0f47656f3a3a5368617065063a0a406b696e643a0b636972636c65`
(already asserted on the dump side in `marshal.trails.test.ts`).

## Acceptance criteria

- [ ] `rObjectFor` has the `TYPE_EXTENDED` arm with `extmod` threaded through
      `rObject0` / `rObjectFor` as MRI threads it, and `appendExtmod` ported at
      its MRI name.
- [ ] The fixture above moves into `marshal.fixtures.rb` / `.json`, loads to an
      object `extend`ed with `Kind`, and round-trips.
- [ ] `Marshal.load`'s JSDoc drops `TYPE_EXTENDED` from its "not ported" list.

## Verification

`pnpm vitest run packages/ruby-compat/src/marshal.trails.test.ts`.
