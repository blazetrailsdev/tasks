---
title: "ESLint: require @deprecated JSDoc where Rails deprecates (deprecation parity)"
status: ready
updated: 2026-06-12
rfc: "0025-fidelity-verification-tooling"
cluster: lint
deps: []
deps-rfc: []
est-loc: 250
priority: 16
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Rails marks methods deprecated via `deprecate :foo, deprecator: …` /
`ActiveRecord.deprecator.warn` inside bodies; our TypeDoc-published API should
carry `@deprecated` on the same methods, and currently nothing checks it.
This is the same generated-manifest + autofixable-JSDoc shape as
`eslint/rails-private-jsdoc.mjs` — clone that rule and its test wholesale.

Implementation plan:

1. **Manifest** — new pass in (or sibling script next to)
   `scripts/build-rails-privates-manifest.ts`, wired into `prelint`: scan the
   vendored api-compared packages for
   - `deprecate :method_a, :method_b` / `deprecate method_a: "msg"` class-body
     calls (capture the symbols/keys), and
   - method bodies containing `deprecator.warn` (capture the enclosing method
     name from the extractor's existing method walk).
     Emit `eslint/rails-deprecated-methods.json`:
     `{rubyFile: ["method_name", …]}`.
2. **Rule** — new `eslint/rails-deprecated-jsdoc.mjs` + `.test.mjs`,
   registered like `rails-private-jsdoc` (`eslint.config.mjs` ~L196 block),
   same package scope. For each TS method whose (file, snake_cased name)
   appears in the manifest: require a JSDoc block containing `@deprecated`.
   **Autofixable** — insert/extend the JSDoc exactly the way
   `rails-private-jsdoc.mjs` autofixes `@internal` (reuse its fixer helper;
   `pnpm lint --fix` must work).
3. No baseline expected — run `pnpm lint --fix` in the same PR to add the
   missing `@deprecated` tags (these are doc-comment-only diffs, allowed in a
   lint PR). If a flagged method genuinely shouldn't be deprecated in trails,
   add it to a small in-rule skip list with a reason comment, mirroring how
   `scripts/api-compare/conventions.ts` documents skips.

## Acceptance criteria

- [ ] `pnpm prelint` regenerates `eslint/rails-deprecated-methods.json`
      (committed; non-empty — Rails 8.0.2 activerecord has deprecations).
- [ ] `rails-deprecated-jsdoc.test.mjs` covers: missing tag flagged +
      autofixed (both no-JSDoc and existing-JSDoc-without-tag cases), tagged
      method passes, non-manifest method ignored.
- [ ] `pnpm lint` green; the `--fix` JSDoc additions are included and the
      count of newly-tagged methods is stated in the PR description.
- [ ] TypeDoc semantics unchanged otherwise (`@deprecated` does not hide a
      method the way `excludeInternal` hides `@internal` — confirm in the
      website TypeDoc config and note it in the PR). ≤500 LOC excluding
      generated JSON.

## Notes

This story adds an emit pass to `scripts/build-rails-privates-manifest.ts`;
if a future story also extends that script, serialize via `deps` rather than
running both concurrently (same-file conflict between parallel agents).
