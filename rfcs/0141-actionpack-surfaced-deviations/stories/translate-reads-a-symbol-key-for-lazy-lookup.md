---
title: "translate-reads-a-symbol-key-for-lazy-lookup"
status: done
updated: 2026-11-05
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9757
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`AbstractController::Translation#translate`
(`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/translation.rb:17-24`) tests
`key&.start_with?(".")`, which a Symbol key answers too, so `t(:'.foo')` is a lazy lookup.
trails spells a Symbol with its leading colon (`":.foo"`, CLAUDE.md "A Ruby Symbol is a JS
string"), and `packages/actionpack/src/abstract-controller/translation.ts` `translate` checks
`key?.startsWith(".")` on the raw string, so `":.foo"` misses the lazy arm and resolves
`en.foo`.

`translation_test.rb:67-77` ("lazy lookup with symbol", "lazy lookup fallback") are parked
`it.skip` in `packages/actionpack/src/abstract-controller/translation.test.ts` on this story.

## Acceptance criteria

- [ ] `translate` reads a colon-led Symbol key by its name for the `start_with?(".")` test and
      the key it builds, as `Symbol#start_with?` / `"#{…}#{key}"` do.
- [ ] Both parked tests are un-skipped and pass.
