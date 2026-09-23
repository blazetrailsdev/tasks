---
title: "make symbolize_keys an optional call in parity:api:calls (NO_JS_CALL_FORM)"
status: in-progress
updated: 2026-09-22
rfc: "0149-bare-keyed-option-hashes"
cluster: symbolize-keys-policy
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#7991
claim: "2026-09-22T23:45:17Z"
assignee: "routing-url-for-option-keys-camel-case"
blocked-by: null
closed-reason: null
---

## Context

Rails' `symbolize_keys` (`activesupport/lib/active_support/core_ext/hash/keys.rb:27-29`) collapses Ruby's String and
Symbol key types. A JS object has one key type, so trails ports option hashes bare-keyed and omits the call, except
where Symbol-ness is observable (RFC Design, rules 1-3). There are 58 Rails call sites; almost all are boundary
normalization (`abstract_adapter.rb:132,144,147`, `hash_config.rb:40`, `database_configurations.rb:257`,
`routing/url_for.rb:185,188`, `routing_url_for.rb:89`).

The gate treats the omission implicitly and inconsistently. trails#7750 dropped the calls at
`database_configurations.rb:257` and `routing_url_for.rb:89`, `parity:api:calls` did not flag them, and a
`@missingRailsCall` receipt at those sites reported STALE (RFC 0130 story `symbolize-keys-bare-key-callers-converge`).
`NO_JS_CALL_FORM` (`scripts/api-compare/compare.ts:265`) is the existing table for a Ruby call a faithful port may omit;
`call-args.ts:409` honors it in the argument gate too.

## Acceptance criteria

- Find out why the two dropped calls went unflagged, and record it in the PR body.
- Add `symbolize_keys` and `symbolize_keys!` to `NO_JS_CALL_FORM`, with a comment block stating the RFC rule and the observable exceptions, in the style of the `synchronize` note (`compare.ts:274-282`).
- Delete any `call-mismatches-exclude` row or `@missingRailsCall` / `@missingRailsArgs` tag for `symbolize_keys` that becomes stale, and tighten the marks.
- Add a CLAUDE.md "Ruby idioms that do not translate literally" bullet: option hashes stay bare-keyed, and `symbolizeKeys` is called only when Symbol-ness is observable.
- A `call-args.test.ts` / compare test covers the new entries.
