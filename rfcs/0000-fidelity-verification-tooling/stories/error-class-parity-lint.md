---
title: "ESLint: Rails error-class manifest parity + ban bare throw new Error in Rails-mirroring source"
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

Error classes are observable API — users write
`catch (e) { if (e instanceof RecordNotFound) … }` — but nothing verifies our
hierarchy matches Rails or that Rails-mirroring code throws ported classes.
Two deliverables, one PR:

1. **Manifest generator** — new `scripts/build-rails-error-manifest.ts`,
   cloned from `scripts/build-rails-privates-manifest.ts` (same vendored-
   source walk, same output style): scan
   `vendor/rails/activerecord/lib/active_record/errors.rb` plus any
   `class FooError < Bar` declarations across
   `vendor/rails/{activerecord,activemodel,activesupport}/lib/**/*.rb`
   (regex over source lines is sufficient — Rails declares errors with
   single-line `class X < Y` headers; capture name, parent, defining file).
   Write `eslint/rails-error-classes.json`:
   `{generatedAt, packages: {activerecord: [{name, parent, rubyFile}], …}}`.
   Wire into the root `prelint` script (package.json) next to the existing
   manifest builders.
2. **ESLint rule** — new `eslint/rails-error-parity.mjs` +
   `rails-error-parity.test.mjs` (clone the structure of
   `eslint/rails-private-jsdoc.mjs` + its test; register in
   `eslint.config.mjs` under the `blazetrails` plugin, see L106–130, scoped
   to `packages/{activerecord,activemodel}/src/**/*.ts` excluding `*.test.ts`).
   Two checks:
   - On files named `errors.ts`: every manifest class for that package must
     have an exported class whose name matches (Rails `ActiveRecord::Foo` →
     TS `Foo`) and whose `extends` clause names the manifest parent (root
     classes extending `Error`/`StandardError`-equivalents pass). Missing or
     wrong-parent → report on the file's first line with the class name.
   - Everywhere in scope: `throw new Error(` (exactly the global `Error`
     constructor) → report "throw a ported Rails error class instead".
     `new TypeError`/`RangeError` are also flagged; subclasses of ported
     errors are fine (rule checks the constructor identifier only).
   - Baseline: generate `eslint/rails-error-parity-exclude.json` (file-path
     array, same consumption pattern as
     `eslint/require-canonical-schema-exclude.json`) for current violators so
     `pnpm lint` stays green; the baseline only shrinks.

## Acceptance criteria

- [ ] `pnpm prelint` (or `pnpm lint` end-to-end) regenerates
      `eslint/rails-error-classes.json`; the file is committed and contains
      `RecordNotFound`, `RecordInvalid`, `StatementInvalid` with correct
      parents.
- [ ] `rails-error-parity.test.mjs` (run the same way the sibling rule tests
      run) covers: missing class, wrong parent, bare `throw new Error` flagged,
      ported-class throw allowed, excluded file skipped.
- [ ] `pnpm lint` passes on the full repo with the generated exclude
      baseline; the baseline file is committed and its entry count stated in
      the PR description.
- [ ] No changes to runtime source in this PR (lint-only; fixing violators is
      follow-up work via baseline burndown). ≤500 LOC excluding the generated
      JSON.

## Notes

Check how existing rules load their JSON manifests (e.g.
`rails-private-jsdoc.mjs` reads `rails-private-methods.json`) and use the
identical load-relative-to-rule-file mechanism. Don't hand-edit generated
JSON.
