---
title: "activerecord: AbstractAdapter#warning_ignored? sends String#match? on both arms"
status: ready
updated: 2026-10-22
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages:
  - "activerecord"
  - "ruby-compat"
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`AbstractAdapter#warning_ignored?`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:1227-1231`)
is `warning.message.match?(warning_matcher) || warning.code.to_s.match?(warning_matcher)`.

trails spells both arms as sends
(`packages/activerecord/src/connection-adapters/abstract-adapter.ts:1967-1968`):
`rbFSend(warning.message, "isMatch", warningMatcher) || rbFSend(toS(warning.code), "isMatch", warningMatcher)`.
Both names are literals, so CLAUDE.md § "A dispatch by name is spelled directly" makes the
direct call the ported shape. `String#match?` has no JS member, so the direct spelling is
ruby-compat's named helper for it (the `stringDelete` precedent in trails#9143), not a dot-call.

Surfaced while building the literal-name send ratchet (trails#9143), which freezes the count
but does not converge this site.

## Converged shape

Both arms call ruby-compat's `String#match?` helper by name (adding it if it does not exist,
with its MRI citation), with `warningMatcher` passed through as Rails passes it, and no
`rbFSend` at either call site.

## Acceptance criteria

- [ ] Both arms of `isWarningIgnored` call the named helper, in Rails' order, with Rails' `||`.
- [ ] The helper answers a Regexp matcher and a String matcher, as `String#match?` does.
- [ ] `pnpm parity:api:sends` total drops by two; `pnpm parity:api:calls` stays green.
