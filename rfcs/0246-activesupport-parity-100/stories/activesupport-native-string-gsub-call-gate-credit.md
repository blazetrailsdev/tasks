---
title: "activesupport-native-string-gsub-call-gate-credit"
status: draft
updated: 2026-11-19
rfc: "0246-activesupport-parity-100"
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

Porting `SafeBuffer#gsub` / `#sub` / `#gsub!` / `#sub!`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/string/output_safety.rb:165-189`)
put `gsub` / `sub` names into activesupport, so `parity:api:calls` began
comparing Rails' String `gsub` / `sub` / `sub!` calls in seven bodies the
port writes with native `String.prototype.replace` / `replaceAll`:

- `multibyte/chars.ts` `titleize` (gsub)
- `number-helper/number-to-{currency,human,human-size,percentage}-converter.ts` `convert` (gsub)
- `number-helper/number-to-rounded-converter.ts` `format_number` (sub)
- `testing/constant-lookup.ts` `determine_constant_from_test_name` (sub!)

They are baselined in `scripts/api-compare/call-mismatches-exclude/activesupport/`.

## Acceptance criteria

- [ ] Either credit a native `replace` / `replaceAll` on a `string` receiver as
      Ruby `gsub` / `sub` in the call gate (as the native-first rule credits
      other String calls), or call ruby-compat `strGsub` / `rbStrSub` where
      Ruby semantics differ (string-pattern literalness, `\1` backrefs).
- [ ] The seven baseline rows are deleted and the mark tightened.
