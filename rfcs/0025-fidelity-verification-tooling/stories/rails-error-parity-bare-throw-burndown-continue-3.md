---
title: "rails-error-parity bare-throw burndown (continue 3): remaining activemodel non-validator files"
status: claimed
updated: 2026-07-13
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: "2026-07-13T21:12:40Z"
assignee: "rails-error-parity-bare-throw-burndown-continue-3"
blocked-by: null
---

## Context

Continues the `blazetrails/rails-error-parity` bare-throw burndown (RFC 0025),
following PR #3250, #3374, and #3916. PR #3916 converted the remaining
`activemodel/src/validations/` files (`clusivity.ts`, `numericality.ts`,
`with.ts`), porting the Ruby root classes `NameError`, `NoMethodError`
(extends NameError), and `TypeError` into
`packages/activemodel/src/attribute-assignment.ts` alongside the existing
`ArgumentError`.

After PR #3916 the ratchet baseline
`eslint/rails-error-parity-exclude.json` still lists **168 files** across
`activemodel`, `activerecord`, and `activesupport`. Each bare
`throw new Error(...)` / `throw new TypeError(...)` in those files must be
replaced with the correct ported Rails error class, then the file removed from
the exclude list (the ratchet only shrinks).

The next coherent slice is the remaining `activemodel/src/` non-validator
files still excluded: `attribute.ts`, `errors.ts`, `i18n.ts`, `lint.ts`,
`model.ts`, `serialization.ts`, `serializers/json.ts`, `type/registry.ts`,
`type/value.ts`, `validator.ts`. Read the Rails source for each throw site
and pick the manifest-correct ported error class — do not invent classes or
pick a near-miss. Port any missing Ruby base class into the appropriate
`errors.ts` with the manifest-correct parent and regenerate the manifest
(`pnpm tsx scripts/build-rails-error-manifest.ts`).

Implementation note from PR #3916: the rule bans the bare-throw keyed on the
_constructor identifier_, so a ported class literally named `TypeError` (or
`Error`) must be import-aliased at the throw site (e.g.
`import { TypeError as RubyTypeError }`) while its runtime `.name` stays
`"TypeError"`.

## Acceptance criteria

- [ ] A coherent slice of files removed from
      `eslint/rails-error-parity-exclude.json`, with every banned bare throw
      replaced by the correct ported error class.
- [ ] Any missing Ruby base class ported with the manifest-correct parent and
      the manifest regenerated.
- [ ] `pnpm lint` passes with the shrunken baseline (rule stays `error`); the
      baseline is strictly smaller and never grew.
- [ ] Touched packages' affected test files stay green; api:compare /
      test:compare delta non-negative.
- [ ] PR diff under the 500 LOC ceiling; remaining files registered as a
      further continuation story.
