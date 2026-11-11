---
title: "mail-check-delivery-params-gem-deprecate-wrappers"
status: ready
updated: 2026-11-10
rfc: "0226-mail-stack-to-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/mail/2.8.1/lib/mail/check_delivery_params.rb:8,16,22,30,36,51,62` declares `extend Gem::Deprecate`, and after each of the six singleton methods calls `deprecate :check, 'Mail::SmtpEnvelope.new created in commit c106beb…', 2023, 6` (or `deprecate :<name>, :none, 2023, 6`). RubyGems' `Gem::Deprecate#deprecate` (`vendor/ruby/v3.3.11/lib/rubygems/deprecate.rb:73-…`) wraps the method so each call warns `NOTE: <target>.<name> is deprecated; use <repl> instead. It will be removed on or after 2023-06-01.` unless `Gem::Deprecate.skip`.

trails#9945 ported `packages/mail/lib/check-delivery-params.ts` without the wrappers: ruby-compat's `Deprecate` (`packages/ruby-compat/lib/gem/deprecate.ts`) answers only `skip`.

## Acceptance criteria

- [ ] ruby-compat's `Gem::Deprecate` gains `deprecate(name, repl, year, month)` mirroring rubygems' `deprecate.rb`, including the `skip` guard and message text.
- [ ] `CheckDeliveryParams` applies it to all six methods with the gem's replacement strings, at the gem's positions.
- [ ] A test asserts the warning for one method and its absence under `Deprecate.skip`.
