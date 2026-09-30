---
title: "I18n Backend::Base#load_yml through YAML.unsafe_load_file; drop i18n's own yaml resolution"
status: draft
updated: 2026-09-30
rfc: "0170-psych-in-ruby-compat"
cluster: fidelity
packages: ["i18n"]
deps: ["psych-libyaml-seam-without-top-level-await", "psych-load-file-family"]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/i18n/v1.14.8/lib/i18n/backend/base.rb:261-272`:
`[YAML.unsafe_load_file(filename, symbolize_names: true, freeze: true), true]`
on the Psych 4 arm, and `rescue TypeError, ScriptError, StandardError => e` →
`InvalidLocaleData`. trails (`packages/i18n/src/backend/base.ts:46-106,526-536`)
resolves `yaml` itself (`await import("yaml")` inside
`preloadTranslationFiles`, with its own error message), and `loadYml` throws
unless preload ran first. `packages/i18n/package.json:24-26` declares `yaml`
as an optional dependency.

Note that `rescue … ScriptError` **does** catch `LoadError` here (unlike the
debug helper), so a missing backend surfaces as `InvalidLocaleData`, as in Ruby.

## Acceptance criteria

- [ ] `loadYml` calls `YAML.unsafeLoad`, with `symbolizeNames` and `freeze`,
      over the preloaded file contents. If `unsafeLoadFile` can read through
      the registered file reader, it calls that instead. Otherwise it carries
      `@missingRailsCall unsafe_load_file — PERMANENT` citing the async file
      reader, which is the existing `load_file` receipt's reason.
- [ ] i18n's module-level `yamlParse`, its `import("yaml")` and both invented
      error strings are deleted. `preloadTranslationFiles` no longer resolves
      YAML, because the seam is synchronous.
- [ ] i18n's `optionalDependencies` on `yaml` is removed (ruby-compat carries it).
- [ ] `base.file-loading.trails.test.ts` and `simple.test.ts` stay green,
      plus a case where a missing backend raises `InvalidLocaleData`.

## Verification

`pnpm vitest run packages/i18n/src/backend/`.
