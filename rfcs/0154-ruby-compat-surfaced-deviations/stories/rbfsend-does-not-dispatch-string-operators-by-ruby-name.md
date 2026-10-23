---
title: 'InjectIntoFile#invoke! spells String#+ directly, not rbFSend(…, "plus")'
status: draft
updated: 2026-10-05
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Triaged under `triage-send-name-guessing-stories-against-the-direct-call-rule`:
this story asked `sendInternal` to dispatch a String receiver's operators by
their Ruby names (`rbFSend("a", "+", "b")`). CLAUDE.md § "A dispatch by name is
spelled directly" (ruled 2026-10-20) answers the motivating call site
differently: its name is a literal, so it is spelled directly, and
`sendInternal` learns nothing.

`Thor::Actions::InjectIntoFile#invoke!`
(`vendor/thor/v1.3.2/lib/thor/actions/inject_into_file.rb:53-57`) is
`'\0' + replacement` / `replacement + '\0'`, two direct `String#+` calls
(`rb_str_plus`, `vendor/ruby/v3.3.11/string.c:2313`). The port
(`packages/trailties/src/thor/actions/inject-into-file.ts:69-70`) spells them
`rbFSend("\\0", "plus", …)` / `rbFSend(…, "plus", "\\0")`, so a nil
replacement raises `undefined method 'plus' for … NilClass` where Ruby raises
`undefined method '+' for nil`.

## Acceptance criteria

- [ ] `invokeBang` calls ruby-compat's `String#+` port directly
      (`rbStrPlus`, `packages/ruby-compat/src/string/method-table.ts:281`, or
      its string overload) for both operands, with no `rbFSend`.
- [ ] A nil replacement raises what Ruby raises for each operand order:
      `NoMethodError` "undefined method '+' for nil" for `replacement + '\0'`,
      and `TypeError` "no implicit conversion of nil into String" for
      `'\0' + replacement`, checked against `ruby` 3.3.11 and pinned in
      `inject-into-file.trails.test.ts`.
- [ ] `pnpm parity:api:sends` drops for `inject-into-file.ts`;
      `parity:api:calls` stays green.
