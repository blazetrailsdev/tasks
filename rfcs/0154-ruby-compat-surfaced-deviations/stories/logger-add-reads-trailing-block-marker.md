---
title: "ruby-compat: Logger#add reads its block through block(), so LoggerDelivery passes only severity"
status: closed
updated: 2026-11-22
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
closed-reason: "FALSIFIED: CI's call-args gate does not flag LoggerDelivery#deliverBang's log call (trails#10536 run 44970200023 reported the receipt stale); the row was a local-run artefact."
---

## Context

Ruby's `Logger#add(severity, message = nil, progname = nil, &block)`
(`vendor/ruby/v3.3.11/lib/logger.rb`, `add` / `alias log add`) takes its block
outside the positional list. ruby-compat's `Logger#add`
(`packages/ruby-compat/lib/logger.ts:196`) takes it as a fourth positional, so
`Mail::LoggerDelivery#deliver!`'s `logger.log(severity) { ... }`
(`vendor/mail/2.8.1/lib/mail/network/delivery_methods/logger_delivery.rb:14`)
is ported as `this.logger.log(this.severity, null, null, block)`
(`packages/mail/lib/network/delivery-methods/logger-delivery.ts:20`), and
`parity:api:calls:args` reports `log(ref:severity)`.

## Acceptance criteria

- [ ] `Logger#add` / `#log` and the level writers read a trailing block with ruby-compat's `block()` marker, the way the rest of the repo reads a block after optional positionals.
- [ ] `LoggerDelivery#deliverBang` calls `this.logger.log(this.severity, block(...))`, and its `@missingRailsArgs log` receipt is removed.
