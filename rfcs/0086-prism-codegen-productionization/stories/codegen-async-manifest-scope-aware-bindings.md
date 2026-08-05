---
title: "Scope async-manifest binding inference to module-level declarations"
status: closed
updated: 2026-08-05
rfc: "0086-prism-codegen-productionization"
cluster: null
deps: []
deps-rfc: []
est-loc: 130
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded by the 2026-08-05 prism-codegen coverage audit: the generator is being retired (0084-wide-call-set-burndown/retire-prism-codegen-tooling), so improving its output is work on a deleted directory. Evidence: 0 shipped lines from codegen:apply, 963 tsc errors across all 10 emitted files, 81.8% whole-corpus node coverage that does not translate to usability."
---

## Context

`extractAsyncNames` in `scripts/prism-codegen/async-source.ts` starts from real
`async` declarations (`ASYNC_DECL`, `ASYNC_ARROW`) and then runs a fixpoint over
two textual patterns to pull in more names:

- `CONST_BIND` — `/\b(?:export\s+)?const\s+(NAME)\s*=\s*(RHS)/g`
- `MAP_ENTRY` — `/(?:^|[{,])\s*(NAME)\s*:\s*(VALUE)/g`

Any `NAME` whose right-hand side mentions an already-async identifier is added
as an async **method name**. Neither pattern is anchored to module scope, so a
function-local `const` is indistinguishable from an exported binding.

Live example: `packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:1830`
holds `const dup = { ...options };` inside a helper body. `options` reaches an
async name through the fixpoint, so **`dup` enters the whole-program manifest as
an async method name** — it is not a method at all. It then flows through
`buildAsyncManifest` → `crossFileAsyncNames` (it survives the `railsCorpusDefs`
intersection because Rails does define `Object#dup` in the target corpus) and
marked `Relation#values` async on the strength of `@values.dup`.

This was diagnosed while building #5826. Confirmed by probing
`defaultAsyncManifest().byName.get("dup")` → `["connection-adapters/abstract/schema-statements.ts"]`.
It was not fixed there: the two obvious repairs each cost a real await
elsewhere, and #5826's scope was the `async` keyword, not the manifest.

Measured on the tree at the time:

- Anchoring `CONST_BIND` at column 0 (`/^...$/gm`) drops `dup`, but also drops
  genuinely awaitable names that only ever appear as an indented
  `const x = await ...` inside a twin method — `selectRows` in
  `relation/calculations.ts` lost its await that way.
- Restricting the manifest to declared-async names only drops `dup` **and**
  `findBy`, which `core.ts:1109` declares as `findBy(...): Promise<any>` — a
  non-`async` function that is genuinely awaitable. Adding
  `Promise`-returning return-type annotations back in over-corrected hard:
  `limit`, `records`, `find` and ~60 others gained `async`.

So the fix is not a regex tweak. The binding-inference pass needs to
distinguish a module-level export from a function-local binding, which means
parsing the TS rather than matching it — the same conclusion
`codegen-async-body-scan-ast-backed` reaches for the Ruby side.

## Acceptance criteria

- A function-local `const` no longer contributes a name to the async manifest.
  `defaultAsyncManifest().byName.has("dup")` is false.
- A module-level `export const x = <async expr>` still contributes, and a
  `Promise`-returning declaration like `core.ts`'s `findBy` still counts as
  awaitable.
- No golden call site loses an `await` it earns through a real async
  declaration; the goldens are regenerated and the diff is reviewed name by
  name.
- `pnpm vitest run scripts/prism-codegen` passes, 0-parse-errors invariant holds.

## Verification

Probe the manifest for the known false positives (`dup`) and the known true
positives (`findBy`, `selectRows`) before and after; then `pnpm codegen:snapshot`
and inspect the diff.
