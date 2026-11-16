---
title: "ruby-compat-secure-random-alphanumeric"
status: draft
updated: 2026-11-16
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

`packages/ruby-compat/lib/secure-random.ts` ports `Random::Formatter`'s `random_bytes`, `hex`, `urlsafe_base64` and `uuid`. It has no `alphanumeric` (`vendor/ruby/v3.3.11/lib/random/formatter.rb:369-372`), no private `choose` (`:314-341`), no `ALPHANUMERIC` (`:344`), and no `random_number` (C, `random.c`). So `packages/solid-cache/test/delete-matched.test.ts` writes `SecureRandom.hex()` where solid_cache's `test/unit/delete_matched_test.rb:18` writes `SecureRandom.alphanumeric` (trails#10202).

## Acceptance criteria

- `SecureRandom.alphanumeric(n = null, { chars = ALPHANUMERIC })`, `choose` and `random_number` are ported at their Ruby names and control flow.
- `delete-matched.test.ts` calls `SecureRandom.alphanumeric()`.
