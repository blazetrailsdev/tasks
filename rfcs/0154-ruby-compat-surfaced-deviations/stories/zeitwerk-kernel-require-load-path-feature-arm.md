---
title: "zeitwerk-kernel-require-load-path-feature-arm"
status: draft
updated: 2026-11-07
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Zeitwerk's `Kernel#require` decoration
(`vendor/zeitwerk/v2.7.2/lib/zeitwerk/core_ext/kernel.rb:23-43`) has two arms.
trailties-mailer-previews-test-port ported the first one:
`packages/zeitwerk/src/core-ext/kernel.ts` reassigns ruby-compat's
`Kernel.require` seat, and a path `Registry.loaderFor` answers goes through
Zeitwerk's own `require`.

The second arm is still missing. When the feature is not an absolute managed
path (it was resolved through `$LOAD_PATH`), Ruby calls
`zeitwerk_original_require(path)`, reads `$LOADED_FEATURES.last`, and calls
`loader.__on_file_autoloaded(abspath)` if a loader manages that path
(`kernel.rb:34-41`). trails' `onFileAutoloaded(file, exports)`
(`packages/zeitwerk/src/loader/callbacks.ts:11`) needs the file's exports, and
`rbFLoad` (`packages/ruby-compat/lib/load.ts`) throws them away after it seats
them on `TopLevel`. So the port calls the original and stops there. That
omission carries
`@missingRailsCall __on_file_autoloaded — CONVERGEABLE zeitwerk-kernel-require-load-path-feature-arm`.

## Acceptance criteria

- `Kernel.require` of a feature that resolves through `LOAD_PATH` to a
  Zeitwerk-managed file runs that loader's `onFileAutoloaded` (and so its
  `on_load` callbacks) exactly once, without importing the file twice.
- The `@missingRailsCall` receipt in `core-ext/kernel.ts` is removed.
- A zeitwerk test covers the arm, citing `kernel.rb:34-41`.
