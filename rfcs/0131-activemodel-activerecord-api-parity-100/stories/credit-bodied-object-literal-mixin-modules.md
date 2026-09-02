---
title: "Let a bodied object-literal mixin module supersede a same-named bodyless interface in the TS extractor, and export the one module that hides behind one"
status: in-progress
updated: 2026-09-02
rfc: "0131-activemodel-activerecord-api-parity-100"
cluster: null
packages:
  - activemodel
  - activerecord
deps: []
deps-rfc: []
est-loc: 130
priority: 1
pr: 7405
claim: "2026-09-02T20:12:42Z"
assignee: "credit-bodied-object-literal-mixin-modules"
blocked-by: null
closed-reason: null
---

## Context

`extract-ts-api.ts:827-850` harvests `export const X = { method() {…} }` as a
module — the shape CLAUDE.md names as the settled port of a Ruby mixin. Two
guards make it miss the one file in activemodel that uses it:

- `:838` — `if (info.modules[modKey] || info.classes[modKey]) continue;`.
  Interfaces are harvested earlier (`:631`), so a same-named bodyless
  `interface` wins and the bodied const is dropped.
- `:827` — `isExported(node)`, so a module-private const is never considered.

`packages/activemodel/src/type/helpers/accepts-multiparameter-time.ts` hits
both: `interface InstanceMethods` at `:5-12` is bodyless, and
`const InstanceMethods` at `:32` carries the five real bodies and is not
exported. Rails' counterpart
(`vendor/rails/activemodel/lib/active_model/type/helpers/accepts_multiparameter_time.rb:6`)
is a public `module InstanceMethods`, so the missing `export` is a fidelity
miss in its own right.

The file therefore scores 1/6 with all five in the artifact's
`declarationOnly` column (`compare.ts:1374-1382` — a name whose only
declaration in the mirroring file is a bodyless signature is not a port).

**Prototyped before this story was written.** Relaxing `:838` to let a bodied
object literal supersede an all-bodyless same-named module, plus exporting the
const, took activemodel 737 → 742 and the file 1/6 → 6/6. Reverting either half
alone returned it to 737: both are load-bearing. This is the credit mechanism
the rest of RFC 0000 is measured against, which is why it lands first.

## Acceptance criteria

- `extract-ts-api.ts`'s object-literal arm supersedes an already-registered
  module whose members are ALL bodyless, and continues to skip one that has any
  bodied member (a real merge target) and any registered class. A test in
  `scripts/api-compare/` pins both the positive and the negative case — a
  too-generous supersede would let a bodyless declaration displace a real class.
- `InstanceMethods` in `accepts-multiparameter-time.ts` is exported, matching
  the Ruby module's visibility.
- activemodel `type/helpers/accepts_multiparameter_time.rb` reaches **6/6**;
  activemodel package total ≥ **742/754**.
- The measured effect on every other package is reported in the PR body; no
  package's total falls. Marks move only via `:tighten`.
- No `declare`, no baseline row, no `@noRailsEquivalent` anywhere in the diff.

## Definition of done

Widening the arm until the number moves does not close this story. The arm must refuse a bodyless declaration displacing a real class, and a passing negative test is what proves it. Nor does it close by hand-writing the five bodies into the interface.

## Verification

```sh
pnpm build
API_COMPARE_FORCE=1 pnpm parity:api
pnpm vitest run scripts/api-compare/
```

Read the `type/helpers/accepts_multiparameter_time.rb` row and the activemodel
total line. Run the full compare, not `--package`, so the effect on every
other package is visible in the same output.
