---
title: "Bare-raise scan: enroll the remaining packages and classify class-level raises"
status: done
updated: 2026-10-07
rfc: "0182-activerecord-error-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#8628
claim: "2026-10-07T13:33:13Z"
assignee: "bare-raise-scan-remaining-packages-and-class-level-raises"
blocked-by: null
closed-reason: null
---

## Context

trails#8625 moved the bare-raise scan onto Ripper
(`scripts/parity/rails-bare-raises.rb`) and enrolled actionpack, actionview,
rack and trailties beside activerecord, activemodel, activesupport and arel
(`BARE_RAISE_LIBS` in `scripts/build-rails-error-manifest.ts`, the package
regex in `eslint/rails-error-parity.mjs#repoRel`, and the `files` block in
`eslint.config.mjs`).

Not scanned: activejob, rack-session, rack-test, thor, globalid, i18n and the
other vendored-gem packages. Two shapes inside a scanned file are still
skipped:

- A raise in a class-level block that is not a `def` or a literal-named
  `define_method` has no method to key on and is dropped.
- A `define_method` whose name is computed (`define_method("#{name}=")`) is
  keyed under the `def` around it only, so one at class level is dropped.

## Acceptance criteria

- [ ] Each remaining package with a vendored Ruby source is enrolled for the
      `inventedMessage` arm, with its hits converged to a bare throw.
- [ ] The two skipped shapes are classified, or each is shown to have no bare
      raise in any scanned file.
