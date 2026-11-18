---
title: "psych: a :name plain scalar loads as a Symbol (to_yaml symbol keys)"
status: draft
updated: 2026-11-18
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `{ en: { alice: "bob" } }.to_yaml` emits `:en:` / `:alice:` keys, and Psych reads a `:name` plain scalar back as a Symbol (`vendor/ruby/v3.3.11/ext/psych/lib/psych/scalar_scanner.rb`, the `/^:./` arm of `tokenize`). So `YAML.unsafe_load_file(f, symbolize_names: true)` (`vendor/i18n/v1.14.8/lib/i18n/backend/base.rb:261-267`) answers `{ en: { alice: "bob" } }`.

In trails (`packages/i18n/lib/backend/base.ts#loadYml`), the same file loads with key `"::en"`: the scalar stays the String `":en"`, and `symbolizeNames` prefixes another colon. trails#10287 hit this porting `vendor/i18n/v1.14.8/test/backend/lazy_loadable_test.rb`, whose tempfiles are written with `to_yaml`. `packages/i18n/test/backend/lazy-loadable.test.ts` had to write plain `en:` keys instead.

## Acceptance criteria

- [ ] ruby-compat's Psych scalar scanner reads a `:name` plain scalar as the Symbol `":name"`, as `scalar_scanner.rb` does, and `symbolizeNames` leaves an already-Symbol key alone (`to_sym` is idempotent).
- [ ] `lazy-loadable.test.ts` writes its tempfile contents in Ruby's `to_yaml` form (`---\n:en:\n  :alice: bob\n`), as `lazy_loadable_test.rb:94,125,139,152,184` do, and still passes.
