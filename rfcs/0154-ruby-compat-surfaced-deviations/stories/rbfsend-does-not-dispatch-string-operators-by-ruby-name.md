---
title: "rbFSend does not dispatch a String operator sent by its Ruby name (`+`)"
status: draft
updated: 2026-10-05
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

`rbFSend` (`packages/ruby-compat/src/object.ts`, `sendInternal`) dispatches a String receiver's methods through `STRING_METHOD_TABLE` by their TS spelling, so `rbFSend("a", "plus", "b")` answers `"ab"`. The Ruby name does not dispatch: `rbFSend("a", "+", "b")` raises `NoMethodError: undefined method '+' for an instance of String`. `sendInternal` maps only `==`, `!=` and the four ordering operators (`RELOPS`) from their Ruby names.

MRI sends an operator by its own name (`rb_f_send`, `vendor/ruby/v3.3.11/vm_eval.c:1330`; `String#+` is `rb_str_plus`, `vendor/ruby/v3.3.11/string.c:2313`).

Surfaced by trails#8551. `Thor::Actions::InjectIntoFile#invoke!` (`vendor/thor/v1.3.2/lib/thor/actions/inject_into_file.rb:53-57`) is `'\0' + replacement` / `replacement + '\0'`. The port (`packages/trailties/src/thor/actions/inject-into-file.ts`, `invokeBang`) spells both `rbFSend(..., "plus", ...)`. With a nil replacement before a flag, the error reads `undefined method 'plus' for an instance of NilClass` where Ruby's reads `undefined method '+' for nil`.

## Acceptance criteria

- [ ] `rbFSend(str, "+", other)` dispatches `String#+` (and the other operator names `STRING_METHOD_TABLE` carries under a TS spelling, e.g. `*`, `%`, `<<`, `=~`, `[]`), with a ruby-compat test per operator.
- [ ] `rbFSend(null, "+", "x")` keeps raising `NoMethodError` naming `+`.
- [ ] `InjectIntoFile#invokeBang` sends `"+"`, and its trails twin test (`inject-into-file.trails.test.ts`, "raises for a nil replacement") asserts the message.
