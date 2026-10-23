---
title: "Callback macros refuse the method name their types accept: no spelling for after_save :method"
status: closed
updated: 2026-10-22
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: ["activesupport", "activerecord"]
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "FALSIFIED: the Symbol arm has a spelling. CallTemplate.build (activesupport callbacks.ts:289-299, since trails#6585) dispatches a ':name' string as MethodCall, the Ruby-Symbol-as-colon-string form CLAUDE.md § 'A Ruby Symbol is a JS string' prescribes, so afterSave(':closeRfcIfComplete') is after_save :close_rfc_if_complete. A bare string raising ArgumentError is Rails' own String arm (callbacks.rb CallTemplate.build), so the type admitting string is faithful."
---

## Context

Found by trailmap#64. Rails declares a callback by method name —
`after_save :close_rfc_if_complete` — and trails cannot. The TYPE says it can
and the runtime refuses:

- `packages/activerecord/src/callbacks.ts:76` types `afterSave`'s first
  argument as `((record) => …) | CallbackObject | string`.
- `packages/activesupport/src/callbacks.ts:267` raises `ArgumentError: Passing
string to define a callback is not supported` when it gets one.

That raise is a faithful port of `CallTemplate.build`'s `when String` arm
(`activesupport/lib/active_support/callbacks.rb`), which exists because Rails
once `eval`ed strings. But the arm it sits beside, `when Symbol`
(`MethodCall.new(filter)`), has no spelling in trails at all: there are no
symbols, and everywhere else a string stands in for one (`belongsTo("rfc")`,
`validate`'s string filter in `packages/activemodel/src/validations.ts`).

trailmap's workaround is `this.afterSave((story: Story) => story.closeRfcIfComplete())`
in `app/models/story.ts`, with a comment naming this gap.

## Expected shape

`this.afterSave("closeRfcIfComplete")` calls the instance method of that name,
as `after_save :close_rfc_if_complete` does — for every callback macro, and
for `if:` / `unless:` conditions, which take symbols in Rails too. If a string
must stay refused, the type must stop advertising it.

## Acceptance criteria

- [ ] A string passed to a callback macro is dispatched as a method name
      (Rails' Symbol arm), with a test in trails.
- [ ] Or the `string` member is removed from the callback macros' types, and
      the decision is recorded where the raise is.
- [ ] trailmap's `Story` declares its auto-close by name once re-vendored.
