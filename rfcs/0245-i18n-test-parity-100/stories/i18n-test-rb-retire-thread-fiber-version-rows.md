---
title: "i18n: port i18n_test.rb's VERSION, Thread.current and Fiber tests and retire their baseline rows"
status: claimed
updated: 2026-11-18
rfc: "0245-i18n-test-parity-100"
cluster: residuals
packages: [i18n]
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: "2026-11-18T01:21:32Z"
assignee: "i18n-port-backend-lazy-loadable"
blocked-by: null
closed-reason: null
---

## Context

`scripts/parity/unported-files/baseline.json` has two `i18n_test.rb`
test-level rows, and `scripts/parity/unported-files/unscoped.ts:521` holds the
VERSION one:

- `exposes its VERSION constant`: "trails carries the version in
  package.json". This is not a ratified limit. Ten packages port their
  `version.rb` / `gem_version.rb` (`packages/activemodel/lib/gem-version.ts`
  and siblings). Port `vendor/i18n/v1.14.8/lib/i18n/version.rb` (`VERSION = "1.14.8"`) as
  `packages/i18n/lib/version.ts` and retire the `version.rb` exclusion.
- `sets the current locale to Thread.current` (`vendor/i18n/v1.14.8/test/i18n_test.rb:59-64`)
  and `I18n.locale is preserved in Fiber context` (`:552-563`): "Node has
  neither thread-local storage of this shape nor Fibers". Both premises are
  now false. `config()` reads `Thread.current().threadVariableGet(":i18n_config")`
  (`packages/i18n/lib/i18n.ts:50-56`), as `vendor/i18n/v1.14.8/lib/i18n.rb:57-64` does, and
  ruby-compat ships `Fiber` (`packages/ruby-compat/lib/fiber.ts:41`).

## Acceptance criteria

- [ ] The three tests are ported in `packages/i18n/test/i18n.test.ts` under the
      Rails names.
- [ ] Their exclusion rows and the `version.rb` file exclusion are deleted.
- [ ] `pnpm parity:test -- --package i18n` shows `i18n_test.rb` at 82/82.
