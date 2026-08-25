---
title: "Sweep tests that storeTranslations before the Simple backend's lazy init"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6050
claim: "2026-08-04T13:49:21Z"
assignee: "i18n-test-stores-before-lazy-init"
blocked-by: null
closed-reason: null
---

## Context

Since #6017 registered Active Support's `en` on `I18n.load_path`, any test that
calls `I18n.backend().storeTranslations(...)` **before** the first lookup in that
worker has its stored values silently overwritten by `locale/en.yml`.

`Simple#store_translations` does not initialize
(`vendor/i18n/lib/i18n/backend/simple.rb:36-45`); `#lookup` runs
`init_translations` lazily (`simple.rb:83-95`), and `load_translations`
deep-merges the file **over** whatever was stored. The file wins.

This is faithful gem behavior — Rails' own tests dodge it by reading a default
first (`vendor/rails/activesupport/test/i18n_test.rb:90-100`). It is a silent
failure mode: the test does not error, it just asserts against the `en.yml`
value. It already produced one red main (`red-7c1e478d` / #6050,
`packages/actionview/src/template/output-safety-helper.trails.test.ts`).

~20 test files call `storeTranslations`. Only those storing a key that also
exists in Active Support's `en` (`support.*`, `number.*`, `date.*`, `time.*`)
are exposed; the rest store bespoke keys and are unaffected.

## Acceptance criteria

- Audit every `storeTranslations` caller under `packages/*/src/**/*.test.ts` for
  a store that precedes the first lookup in its file AND targets a key present
  in `packages/activesupport/src/locale/en`.
- Converge each exposed one onto the gem's own ordering — read the default
  first, as `i18n_test.rb:90-100` does — rather than hardcoding expected values.
- Restore via `I18n.reloadBang()`, which is faithful now that `en` is on the
  load path.
- No behavior change to `packages/i18n` source: the lazy-init ordering is the
  gem's and stays as-is.

## Verification

`pnpm vitest run` on each touched package. Each converged test must still fail
if the store is moved back before the first lookup.
