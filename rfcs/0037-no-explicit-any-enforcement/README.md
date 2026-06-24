---
rfc: "0037-no-explicit-any-enforcement"
title: "no-explicit-any enforcement & burndown (activerecord)"
status: closed
created: 2026-06-18
updated: 2026-06-24
owner: "@deanmarano"
packages:
  - "activerecord"
clusters:
  - "lint"
related-rfcs:
  - "0019-canonical-schema-burndown"
  - "0025-fidelity-verification-tooling"
---

# RFC 0037 — `no-explicit-any` enforcement & burndown (activerecord)

## Summary

`@typescript-eslint/no-explicit-any` is set to **`warn`** for all
`packages/activerecord/src/**/*.ts` (src + tests, one block —
`eslint.config.mjs:445-454`). CI's `pnpm lint` (`eslint .`) runs with **no
`--max-warnings`**, so the rule is unenforceable today: it surfaces in output
but cannot fail CI, cannot gate regressions, and the count drifts. The
package carries ~3,900 `as any` sites (1,114 src + 2,803 in tests) plus bare
`any` annotations.

This RFC converts the `warn` placeholder into an **enforced, regression-proof
ratchet** — `no-explicit-any: "error"` as the default with a _shrinking_
`files:` allowlist of currently-dirty files — and drives the allowlist to
zero via a strip-and-recompile codemod plus targeted hand-fixes. When the
allowlist is empty the rule is already `error`; there is no separate "turn it
on" step and no window where CI suddenly breaks.

It also closes the obvious escape hatch: a custom rule **forbidding inline
`eslint-disable` of `no-explicit-any`**, so the ratchet cannot be defeated by
`// eslint-disable-next-line @typescript-eslint/no-explicit-any` instead of an
actual fix.

## Motivation

- `warn` with no `--max-warnings` is a no-op gate. New `as any` lands freely;
  the campaign comment in `eslint.config.mjs:438-444` ("ratchet warn → error
  per-area") has no mechanism behind it.
- The cast surface is dominated by _mechanically removable_ casts. Of 2,803
  `as any` in AR tests: ~2,043 are `(expr as any).member`, and the member is
  usually already typed (`.id`, `.name`, declared columns, `Base` methods) —
  the cast is gratuitous copy-paste. 434 reach genuine `_private` internals
  (narrow, don't delete); 269 are terminal/`as any[]` casts; 3 are `(q: any)`
  scope lambdas. 186 of 369 test files are already clean.
- A clean baseline exists: `pnpm typecheck` (`tsc --build`,
  project-references-aware) is green from zero, so a codemod can remove a cast,
  recompile, and keep the removal iff the error count stays 0.
- Without forbidding `eslint-disable`, an `error` rule just shifts the
  workaround from `as any` (visible, greppable) to inline disable comments
  (a worse, harder-to-audit escape).

## Approach

1. **Mechanism flip.** Split the single AR `no-explicit-any` block into
   `src/**/*.ts` (non-test) and `**/*.test.ts` so each ratchets
   independently. Default each to `error`; carry the currently-dirty files in
   a trailing override block (`files:` glob array, rule `off`). This mirrors
   the repo's exclude-list idiom (`require-canonical-schema-exclude.json`,
   `no-raw-sql-exclude.json`) — but `no-explicit-any` is a stock rule that
   can't read JSON, so the allowlist lives in the flat config. Clean files are
   enforced immediately and can't regress; CI stays green.

2. **Forbid disabling the rule.** Add a custom ESLint rule (with `.test.mjs`,
   matching the repo's rule convention) that flags any
   `eslint-disable`/`eslint-disable-next-line`/`eslint-disable-line` comment
   naming `@typescript-eslint/no-explicit-any` (and a bare
   `// eslint-disable` with no rule list). No allowlist — this one is `error`
   from day one.

3. **Codemod.** Strip-and-recompile tool: for each `as any`, remove it, run
   `tsc --build`, keep the removal iff errors stay 0. Run per-file so each PR
   is reviewable and under the 500-LOC ceiling; drop the cleaned files from the
   allowlist in the same PR.

4. **Hand-fix the residue** the codemod can't auto-clear: `_private` reaches
   (narrow to `as { _x: T }` or a typed test accessor), `association("x") as
any` (type the `association()` helper return — one fix, many callsites),
   and under-declared models (complete `declare` blocks — overlaps
   `0019/materialize-declares-strip-asany`).

5. **Burn to zero**, long-tail files first (cheap, list shrinks fast), then the
   concentrated top-15. When each area's allowlist is empty the flip is already
   done.

## Non-goals

- Other packages' `no-explicit-any` settings (out of scope; AR only).
- Removing _legitimate_ `any` in src where no concrete type exists yet — those
  stay in the allowlist with a tracked reason, not force-typed.

## Related

- `0019-canonical-schema-burndown / materialize-declares-strip-asany` — model
  `declare` completion + redundant-cast stripping (the model-declare slice of
  the hand-fix work).
- `0025-fidelity-verification-tooling` — sibling lint-rule/tooling campaign.
