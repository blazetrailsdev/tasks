---
title: "thor-template-raises-name-error-at-source-mapped-line"
status: ready
updated: 2026-10-31
rfc: "0171-thor-port"
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

`vendor/thor/v1.3.2/spec/actions/file_manipulation_spec.rb:241-252` ("has proper ERB stacktraces")
expects `template "template/bad_config.yaml.tt"` to raise `NameError` with a backtrace naming
`bad_config.yaml.tt:2`. In trails the precompiled fixture
(`packages/thor/src/test-helpers/fixtures/template/bad_config.yaml.tt.js`, built by
`test-helpers/build-templates.ts` through `buildTemplates` in `@blazetrails/trails-tsc`) does an
unresolved-name lookup through the generated `__lookup`, which throws a JS `ReferenceError`, and the
stack names the emitted `.tt.js` line (12:33) with no source map back to the template.

The case is parked as `it.skip` in `packages/thor/src/actions/file-manipulation.test.ts`.

## Acceptance criteria

- [ ] The generated `__lookup` miss raises ruby-compat `NameError` (Ruby's `undefined local variable or method`).
- [ ] The emitted template carries a source map, so the error's stack names `bad_config.yaml.tt:2`.
- [ ] "has proper TSE stacktraces" is un-skipped and passes.
