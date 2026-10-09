---
title: "rb-f-send-answers-a-string-receiver-with-the-native-method-not-the-ruby-one"
status: done
updated: 2026-10-09
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8709
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`rbFSend` (`packages/ruby-compat/src/object.ts:822`, `sendInternal` at `:873`)
walks the receiver's JS prototype chain before anything else, so for a String
receiver a name `String.prototype` defines is answered by the native method,
not by the Ruby port in `packages/ruby-compat/src/string/method-table.ts`
(`split: rbStrSplitM`, `:151`). `rbFSend("a  b", "split", " ", -1)` returns
`["a", "", "b"]`; Ruby's `String#split` (`vendor/ruby/v3.3.11/string.c:8757`
`rb_str_split_m`) is awk mode for `" "` and returns `["a", "b"]`.

Surfaced on trails#8709: `ActionController::Parameters#extract_value`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/strong_parameters.rb:1110-1112`)
is `@parameters[key]&.split(delimiter, -1)`. Its port
(`packages/actionpack/src/action-controller/metal/strong-parameters.ts`,
`extractValue`) calls `stringSplit(value as string, delimiter, -1)` directly, so
a non-String value raises a JS `TypeError` where Ruby raises `NoMethodError`.

## Acceptance criteria

- [ ] `rbFSend` on a String receiver dispatches a name the Ruby String method
      table defines to that entry ahead of `String.prototype`, with a test for
      `split` in awk mode.
- [ ] `Parameters#extractValue` sends `split` through `rbFSend`, and a numeric
      value raises `NoMethodError`, with a trails test.
