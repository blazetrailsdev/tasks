---
title: "converge Pirate.catchphrase declare: fix dirty.test.ts accessor pattern to drop skip-columns annotation"
status: ready
updated: 2026-07-05
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`packages/activerecord/src/test-helpers/models/pirate.ts:13-21` — Pirate carries a
`/** @trails-typegen skip-columns: catchphrase */` annotation added in PR #4222
to suppress `declare catchphrase: string`. The annotation was necessary because
`packages/activerecord/src/dirty.test.ts` (around the "attribute_changed? with
custom attribute_reader" test) creates an anonymous subclass of Pirate and
overrides `catchphrase` as a get/set accessor pair:

```ts
const Foo = class extends Pirate {
  get catchphrase(): string | null { ... }
  set catchphrase(v: string | null) { ... }
};
```

TypeScript TS2611 forbids overriding a `declare` (field) property as an accessor
even with `override`. Suppressing the declare is the workaround; the real fix is
to change the test to a pattern compatible with the materialized declare so that
`Pirate.catchphrase` can be typed.

In Rails (`vendor/rails/activerecord/test/cases/dirty_test.rb` — the
`test_attribute_changed_with_custom_attribute_reader` group), the subclass uses
a plain method override (`def catchphrase; readAttribute("catchphrase").upcase; end`)
which Ruby allows freely. The test is testing that `changes` reads the raw
attribute value, not the public reader — the accessor pattern in TS is the
closest approximation, but it conflicts with typed declares.

## Acceptance criteria

- `skip-columns: catchphrase` annotation is removed from `Pirate`.
- `declare catchphrase: string` is materialized on `Pirate` (re-run
  `pnpm tsx packages/activerecord/scripts/materialize-model-declares.ts pirate.ts`).
- `dirty.test.ts` accessor-override test compiles and passes without `as any` casts
  and without TS2611. Acceptable approaches: shadow the property via
  `Object.defineProperty` in the test subclass body, or restructure the test to
  avoid needing a get/set override.
- `node scripts/typecheck.mjs` clean.
