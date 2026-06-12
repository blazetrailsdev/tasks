---
title: "ESLint: flag trivial method bodies whose Rails counterpart is substantive (no-behavioral-stub)"
status: draft
updated: 2026-06-12
rfc: "0000-fidelity-verification-tooling"
cluster: lint
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

CONTRIBUTING.md: "Never commit a method that matches a Rails API surface but
returns null/undefined or only mutates in-memory state when Rails hits the
DB. A missing method is better than a misleading one." Unenforced today. This
rule flags the statically detectable subset: trivial TS bodies whose Rails
counterpart body is substantive.

Implementation plan:

1. **Manifest data** — the privates-manifest builder
   (`scripts/build-rails-privates-manifest.ts`, run via `prelint`) walks the
   vendored Ruby methods already. Extend it (or add a sibling pass in the
   same script) to also emit
   `eslint/rails-method-body-lines.json`:
   `{rubyFile: {methodName: bodyLineCount}}` for ALL methods (public +
   private) across the api-compared packages, where bodyLineCount excludes
   the `def`/`end` lines and blank/comment-only lines.
2. **Rule** — new `eslint/no-behavioral-stub.mjs` + `.test.mjs`, registered
   under the `blazetrails` plugin scoped to the Rails-mirroring packages'
   `src/**/*.ts` (same glob set as `rails-private-jsdoc`, see
   `eslint.config.mjs` ~L196), excluding `*.test.ts`. For each
   method/function declaration:
   - Compute "trivial": body is empty, or a single statement that is
     `return` / `return null|undefined|[]|{}|this|false|true` / a lone
     `void 0`-style no-op.
   - Map the TS file back to its Ruby file using
     `eslint/rails-file-structure-method-order.json` (it already keys TS
     files to ordered Rails method names — reuse its file mapping; do not
     invent a new path convention) and the method name via the same
     camelCase→snake_case inversion that file's rule uses.
   - Flag when trivial AND the Ruby counterpart's bodyLineCount ≥ 4.
   - Methods with an explicit JSDoc `@stub-ok <reason>` tag are skipped —
     this is the documented escape hatch for genuinely-trivial-in-TS cases
     (e.g. Ruby body is all comments/requires); the tag requires a reason
     string (flag a bare tag).
3. **Baseline** — generated `eslint/no-behavioral-stub-exclude.json`
   (file-path array, `require-canonical-schema-exclude.json` consumption
   pattern), committed; severity `error`.

## Acceptance criteria

- [ ] `pnpm prelint` regenerates `eslint/rails-method-body-lines.json`
      (committed).
- [ ] `no-behavioral-stub.test.mjs` covers: empty body flagged, `return null`
      flagged, substantive body not flagged, trivial body with trivial Ruby
      counterpart (< 4 lines) not flagged, `@stub-ok reason` skipped, bare
      `@stub-ok` flagged.
- [ ] `pnpm lint` green with committed baseline; baseline count + the top 10
      flagged methods listed in the PR description (this is the audit
      payload).
- [ ] Lint-only PR; ≤500 LOC excluding generated JSON.

## Notes

Precision over recall: it is fine to miss stubs (mutate-memory-only bodies
are undetectable statically); it is NOT fine to nag on legitimate one-liners
— hence the Ruby-side ≥4-line threshold and the reasoned escape hatch.
