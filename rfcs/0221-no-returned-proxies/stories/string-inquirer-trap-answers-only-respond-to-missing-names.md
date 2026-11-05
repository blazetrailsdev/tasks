---
title: "StringInquirer trap answers only respond_to_missing? names (then/toJSON read undefined)"
status: in-progress
updated: 2026-11-05
rfc: "0221-no-returned-proxies"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#9755
claim: "2026-11-05T19:36:27Z"
assignee: "string-inquirer-trap-answers-only-respond-to-missing-names"
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/string-inquirer.ts` (after trails#9728) installs Rails'
`method_missing` (`vendor/rails/v8.0.2/activesupport/lib/active_support/string_inquirer.rb:19-25`)
as a `get` trap on a Proxy in `StringInquirer.prototype`'s chain. For any missed
string name that does not end in `?`, the trap returns a function that raises
`NoMethodError` — Rails' `super` arm. But JS runtime protocol probes read
properties Ruby never asks for: `then` (`await inquirer`, `Promise.resolve`) and
`toJSON` (`JSON.stringify`). Reading them returns a function, so `await
Rails.env` calls it and throws, and `JSON.stringify(Rails.env)` throws, where
Ruby's `respond_to?(:then)` is false and the probe would read `undefined`.

The trap should answer only names Rails' `respond_to_missing?` (`:15-17`) claims
(`end_with?("?")`), reading `undefined` for everything else, per CLAUDE.md
§ "Ruby protocol methods with a different JS mechanism" ("an unanswered name
reads `undefined`, and calling it is a `TypeError` where Ruby raises
`NoMethodError`"). Same check for `ArrayInquirer` (`array_inquirer.rb`).

## Acceptance criteria

- `await new StringInquirer("x")` resolves to the inquirer; `JSON.stringify` on it yields `"x"`.
- The trap forwards only `?`-suffixed / `isX`-spelled names; others read `undefined`.
- `ArrayInquirer` checked and converged the same way.
- A trails-only test covers `then` / `toJSON` and fails on the current trap.
