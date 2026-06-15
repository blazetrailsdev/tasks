---
title: "Remove defineEnum; route all enum call sites through Base.enum"
status: in-progress
updated: 2026-06-15
rfc: "0023-surfaced-deviations"
cluster: null
deps:
  [
    "converge-define-enum-onto-rails-faithful-enum",
    "defineenum-bang-uses-update-column-not-update-bang",
  ]
deps-rfc: []
est-loc: 450
priority: null
pr: 3395
claim: "2026-06-15T17:42:27Z"
assignee: "remove-define-enum-route-all-through-base-enum"
blocked-by: null
---

## Context

PR #3269 (`converge-define-enum-onto-rails-faithful-enum`) converged the
**storage and validation** semantics of the standalone `defineEnum(modelClass,
…)` function onto the Rails-faithful `_enum` path: both now register an
`EnumType` via the shared `installEnumAttribute` helper, store the label
string, and enforce `assertValidValue` on every write path. But it deliberately
kept `defineEnum` as a **separate function** to stay under the LOC ceiling.

We do not want to support two enum entry points long-term. This story removes
`defineEnum` entirely and routes every call site through `Base.enum` / `_enum`.

## Remaining gaps that block a straight deletion

`_enum` does not yet generate the surface `defineEnum` does, and ~96 call sites
(73 in `enum.test.ts`) plus the `declare`/synthesize emitter depend on it:

1. **Plain in-memory setters** — `record.draft()` (returns void). `_enum` only
   exposes `draft` as a static scope; it has no instance plain setter.
2. **`not*` scopes** — `Model.notDraft()`. `_enum` does not generate negative
   scopes (only the dormant `EnumMethods.defineEnumMethods` mirror does).
3. **Friendly-name variants** for special-char labels — `americanBobtail`
   scope, `"isAmerican Bobtail"()` predicate, `"American BobtailBang"`.
4. **Bang setter semantics** — `defineEnum` uses `updateColumn`; `_enum` uses
   `updateBang`. Converges once
   `defineenum-bang-uses-update-column-not-update-bang` lands.
5. **Registry split** — `defineEnum` records mappings in `getEnumDefinitions`;
   `_enum` uses `_enums`. `readEnumValue` / `castEnumValue` / dirty-tracking
   read from one or the other and must be unified.
6. **`declare` synthesize/walker** emit `defineEnum(this, …)`
   (`type-virtualization/synthesize.ts` `case "defineEnum"`, fixtures
   07/14/18/19) — these must emit `this.enum(...)` instead, or `defineEnum`
   must remain as a thin re-export alias.

## Open decision

Items 1–3 are **not** Rails-faithful either (Rails enum has no plain setter,
no auto `not_*` scope, and friendly-name predicates only via `method_missing`).
Decide per item whether to (a) port it into `_enum`/`EnumMethods` so call sites
keep working, or (b) drop it as non-Rails and rewrite the dependent tests.

## Likely phasing (split into separate PRs from main; do NOT stack)

- **A.** Port the agreed-upon extras into `_enum` / `EnumMethods` behind the
  existing macro (no call-site changes yet).
- **B.** Migrate all `defineEnum(Klass, …)` call sites + the synthesize emitter
  to `Base.enum`, unify the registry, then delete `defineEnum` (or reduce it to
  a one-line re-export of `enumMethod` for source-compat).

## Acceptance criteria

- `defineEnum` is removed from `enum.ts` (or reduced to a thin re-export alias),
  with no second EnumType-registration code path.
- All former `defineEnum` call sites and the `declare` enum form route through
  `Base.enum` / `_enum`.
- `readEnumValue` / `castEnumValue` / dirty-tracking read a single enum
  registry.
- Test names continue to match Rails verbatim.
