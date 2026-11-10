---
title: "The build entry registers the yaml Psych adapter statically"
status: draft
updated: 2026-11-10
rfc: "0224-aot-boot-files"
cluster: null
packages: ["ruby-compat", "trails-tsc"]
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Why

Psych resolves its yaml backend on first use through `createRequire(import.meta.url)("yaml")`. A natively compiled application has no `createRequire`, so the perry-native rung 08 binary raised `LoadError: cannot load such file -- yaml` when loading credentials at boot (`EncryptedConfiguration.deserialize` → `Psych.unsafeLoad`).

## What

- `@blazetrails/ruby-compat/psych-yaml` imports `yaml` and registers it as the `yaml` Psych adapter, as the website's browser runtime already does by hand.
- The install module that `trails build` generates imports it, so every built application has the backend without a runtime require.

## Acceptance

- [ ] With `getBuiltinModule` unavailable, importing `psych-yaml` is enough for `Psych` parsing to work (ruby-compat test).
- [ ] `.trails/autoload/install.generated.js` imports `@blazetrails/ruby-compat/psych-yaml` (trails-tsc test).
