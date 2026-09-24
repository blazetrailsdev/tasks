---
title: "Deprecation proxy warn renders called via underscore, not the Ruby method name"
status: draft
updated: 2026-09-24
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
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

Rails' `DeprecatedInstanceVariableProxy#warn`
(`vendor/rails/activesupport/lib/active_support/deprecation/proxy_wrappers.rb:101`)
interpolates `called`, which is the Ruby Symbol `method_missing` received
(`:to_s`, `:empty?`, `:save!`). In trails, `called` is the TS property name
(`toS`, `isEmpty`, `saveBang`). trails#8063 renders it back as
`underscore(called)` (`packages/activesupport/src/deprecation/proxy-wrappers.ts`,
`DeprecatedInstanceVariableProxy#warn`).

`underscore` only undoes camelCasing. It does not invert the rest of
`docs/ruby-ts-conventions.md`: `isEmpty` renders as `is_empty`, not `empty?`;
`saveBang` renders as `save_bang`, not `save!`; operator spellings (`plus`,
`equals`) stay as they are. So the warning text is wrong for every predicate,
bang and operator method.

## Converged shape

Map the TS member name back to its Ruby method name by inverting the
convention rules in `scripts/parity/conventions.ts` (predicate `isX` → `x?`,
`xBang` → `x!`, operator table → `+` / `==` / …). The inverse should live in
ruby-compat and be receipted, so `#warn` renders exactly the Symbol Rails would.

## Acceptance criteria

- [ ] `DeprecatedInstanceVariableProxy#warn` renders `empty?`, `save!` and `+`
      for `isEmpty`, `saveBang` and `plus`.
- [ ] Each case has a test that asserts the warning text.
