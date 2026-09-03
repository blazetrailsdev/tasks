---
title: "Credit a mixin object-literal property by its key so relation.rb's with, excluding and without stop scoring declaration-only"
status: done
updated: 2026-09-03
rfc: "0131-activemodel-activerecord-api-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 260
priority: 2
pr: 7452
claim: "2026-09-03T18:34:33Z"
assignee: "unify-instrumenter-instrument-sync-and-async-arms"
blocked-by: null
closed-reason: null
---

## Context

Measured on `origin/main` `8f2de0daf` after a clean `pnpm build`, with
`API_COMPARE_FORCE=1 pnpm parity:api --package activerecord`:

```text
relation.rb  ->  relation.ts   398   3   (declOnly 3)   401   99%
```

The three are `with`, `excluding` and `without` — all three
`ActiveRecord::Relation` members that reach `relation.rb` through the
`QueryMethods` mixin. Their bodies exist, ship and are tested in
`packages/activerecord/src/relation/query-methods.ts`; the mixin-credit arm
(`mixinMethodCreditedToOwnFile`, `compare.ts:2349-2366`) cannot see them,
because in each case the name that carries the body is not a `function`
declaration spelled with the Rails name:

- **`with`** — `query_methods.rb:493`, `def with(*args)`. The body is
  `function withCte(...)` (`query-methods.ts:339`) and the mixin entry is
  `with: withCte` (`:1797`). `function with()` is not writable in TypeScript:
  `with` is a reserved word in strict mode and every module is strict, so the
  rename bucket-B stories used for `performFind` -> `find` is not available
  here. The property key is the only place the Rails name can appear.
- **`excluding` / `without`** — `query_methods.rb:1574`, `def excluding(*records)`,
  with `alias without excluding` alongside. trails ports the shared body once
  as a factory, `excludingWithCallee(callee)` (`query-methods.ts:1281`), and
  binds the two names from it: `const excluding = excludingWithCallee("excluding")`
  (`:1313`) and `const without = excludingWithCallee("without")` (`:1315`),
  both listed in the mixin object at `:1868-1869`. The factory is itself
  faithful — Rails raises `"...objects to #{callee}."` with the calling name,
  which is exactly what the parameter carries. The extractor harvests
  `function` declarations, not a `const` initialised from a call.

Both shapes are the same defect class as bucket A: the extractor charges trails
for a construct the language forced, or for factoring a shared Ruby body once
instead of twice. The counter-example is in the same object — every neighbour
spelled `function excludingBang()` credits today.

## Converged shape

Teach `extract-ts-api.ts` to credit a **mixin object-literal property** by its
key when the value is an identifier that resolves, in the same file, to a
function declaration or to a `const` bound to a function-valued expression.
`with: withCte` credits `with`; `excluding,` / `without,` (shorthand keys)
credit `excluding` and `without`.

This is a credit arm, not a rename, and it must be narrow. As with RFC 0131's
four landed arms:

- The value must resolve locally to something function-valued. An arbitrary
  identifier, an imported binding, or a non-function const must credit
  nothing.
- The arm must not re-credit a name already credited by the existing
  `mixinMethodCreditedToOwnFile` path, so totals cannot double-count.
- Ship negative tests: a shape the arm must **not** credit, asserted to credit
  nothing. A too-generous arm invents coverage silently across every package.

Do not "fix" this by renaming `withCte`, by adding a second copy of the
`excluding` body under the `without` name, or by a `declare` — all three are
out of bounds per the RFC.

## Acceptance criteria

- `relation.rb` reads **401/401** with `DeclOnly 0`.
- No `packages/` source change is required beyond, at most, a comment; the
  three bodies are already faithful ports.
- Report the per-package delta the arm produces everywhere else — it is a
  general recognizer and will move rows outside activerecord.
- Negative tests as above.
- No baseline row, no allowlist widening, no `@noRailsEquivalent` receipt;
  `pnpm parity:api:extra:gate` stays green and no mark is raised.
