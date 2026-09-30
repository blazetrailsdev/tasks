---
title: "CI smoke: a YAML-free trails app boots with the yaml package unresolvable"
status: draft
updated: 2026-09-29
rfc: "0170-psych-in-ruby-compat"
cluster: fidelity
packages: ["ruby-compat", "activerecord", "trailties", "i18n"]
deps: ["psych-libyaml-seam-without-top-level-await"]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC Verification. The static guard
(`scripts/test-deps/yaml-optional-dependency.test.ts`) proves no eager edge,
but not that a YAML-free app actually runs. Rails has no counterpart: Psych is
stdlib, so `require "yaml"` never fails (`vendor/rails/v8.0.2/activerecord/lib/active_record.rb:31`).

## Acceptance criteria

- [ ] A script under `scripts/test-deps/` runs Node on the **built** `dist`
      with a module-resolution hook that makes `yaml` unresolvable. It:
      imports every `@blazetrails/*` package root; boots AR on SQLite
      `:memory:` from a `config/database.ts`; saves and reloads a model with
      `serialize :x, coder: JSON` (`vendor/rails/v8.0.2/activerecord/lib/active_record/attribute_methods/serialization.rb:210`);
      loads a `.ts` fixture; loads an i18n `.json` locale; and asserts that
      `YAML.load("a: 1")` raises `LoadError` "cannot load such file -- yaml".
- [ ] It runs in an existing CI job (the Unit Tests job has no `vendor/rails`,
      so it must not need it).
- [ ] With `yaml` resolvable, the same script's YAML assertion flips to
      `{ a: 1 }`, which proves the hook is what made it fail.

## Verification

The script exits 0 locally and in CI; with the hook removed, the LoadError assertion fails.
