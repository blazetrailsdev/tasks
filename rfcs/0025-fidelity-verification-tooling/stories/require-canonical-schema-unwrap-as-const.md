---
title: "require-canonical-schema rule must unwrap as const / satisfies to close ratchet evasion"
status: ready
updated: 2026-06-30
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The `blazetrails/require-canonical-schema` lint rule
(`eslint/require-canonical-schema.mjs`) is the ratchet that forces tables
passed to `defineSchema(...)` to reference the canonical `TEST_SCHEMA`. RFC
0019 burned its exclude list (`require-canonical-schema-exclude.json`) to `[]`.

Despite that, `attribute-methods.test.ts` and `finder.test.ts` still declare a
fully bespoke `const TEST_SCHEMA = {…} as const` (divergent `topics` without
`last_read`, bespoke `posts`/`items`/`people`/etc.) and call
`defineSchema(TEST_SCHEMA)` — and lint clean, with no exclude entry and no
`eslint-disable`. These bespoke `topics`/`posts` shapes are exactly the
shared-table contaminators behind the `date_attrmethods_pg_flake` that PR #4298
had to band-aid with `dropExisting` shields.

Root cause: the rule's `resolveObject` (require-canonical-schema.mjs:142) only
treats a `const X = {…}` as a schema when the declaration's `init` is an
`ObjectExpression`:

```js
if (def.type === "Variable" && def.node.init?.type === "ObjectExpression") {
  return def.node.init;
}
return null;
```

With a trailing `as const` the `init` is a `TSAsExpression` wrapping the
object, so `resolveObject` returns `null` and the rule reports nothing. Any
bespoke `const X = {…} as const; defineSchema(X)` (or `… satisfies Schema`)
evades the ratchet. Verified by isolated eslint probes: identical code lints
clean only with `as const` present; without it the rule fires `Table topics is
declared inline`. This is the same TSAsExpression-AST blind spot already noted
for the sibling `test-fixture-parity` rule in
`0019/persistence-test-canonical-wave2`, but `require-canonical-schema` was
never fixed.

(The actual convergence of the two leaked files is already tracked under RFC
0048: `converge-core-attribute-methods-one-schema` and
`converge-finder-enum-relation-one-schema`. This story is only the rule hole.)

## Acceptance criteria

- [ ] `resolveObject` (and any other init-type check in the rule) unwraps
      `TSAsExpression` and `TSSatisfiesExpression` to reach the inner
      `ObjectExpression` before deciding canonicality, so `const X = {…} as
const; defineSchema(X)` is analyzed identically to the bare-object form.
- [ ] Add `require-canonical-schema.test.mjs` cases covering `as const` and
      `satisfies` on both the whole-schema identifier form and per-table
      values; assert they report inline tables.
- [ ] Run the rule across the AR test tree and confirm it now flags
      `attribute-methods.test.ts` / `finder.test.ts` (expected — they are the
      leaked contaminators); add them to
      `require-canonical-schema-exclude.json` as the ratchet baseline ONLY if
      they are not converged first under their RFC 0048 stories (prefer
      convergence; do not silently re-grandfather without a tracked entry).
- [ ] No new lint violations elsewhere unless they are genuine evasions of the
      same kind.
