---
title: "Add Enumerator#map and Singleton for Mail::Encodings and Configuration"
status: draft
updated: 2026-10-30
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Mail::Encodings.b_value_encode` (`vendor/mail/2.8.1/lib/mail/encodings.rb:186-196`) calls `.map` on the Enumerator from `each_base64_chunk_byterange`. ruby-compat's `Enumerator` (`packages/ruby-compat/src/enumerator.ts`) has no `map` member, so `packages/mail/src/encodings.ts` spreads it into an array with a cast.

`Mail::Configuration` (`vendor/mail/2.8.1/lib/mail/configuration.rb:11`) does `include Singleton`; ruby-compat has no `Singleton`, so `packages/mail/src/configuration.ts` hand-writes `instance()`.

## Acceptance criteria

- [ ] `Enumerator` answers `map` (`enum_collect`, `vendor/ruby/v3.3.11/enum.c`), and `bValueEncode` calls it directly.
- [ ] ruby-compat ports `Singleton`, and `Configuration` includes it.
