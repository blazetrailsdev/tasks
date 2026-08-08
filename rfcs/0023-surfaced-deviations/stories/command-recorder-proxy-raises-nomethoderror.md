---
title: "CommandRecorder's method_missing stand-in raises NoMethodError instead of returning undefined"
status: done
updated: 2026-08-08
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6252
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #6175 while porting `test_send_calls_super`
(`vendor/rails/activerecord/test/cases/migration/command_recorder_test.rb:20-24`):

```ruby
def test_send_calls_super
  assert_raises(NoMethodError) do
    @recorder.send(:non_existing_method, :horses)
  end
end
```

Rails' `CommandRecorder#method_missing`
(`vendor/rails/activerecord/lib/active_record/migration/command_recorder.rb:395-406`)
forwards to the delegate only when the delegate responds, and otherwise falls
through to `super` — which raises `NoMethodError`:

```ruby
def method_missing(method, ...)
  if @delegate.respond_to?(method)
    @delegate.public_send(method, ...)
  else
    super
  end
end
```

The trails stand-in is a Proxy `get` trap
(`packages/activerecord/src/migration/command-recorder.ts:25-37`) that returns
`undefined` for a name neither the recorder nor the delegate has. There is no
`super` arm, so the failure surfaces one call frame later as a generic
`TypeError: recorder.nonExistingMethod is not a function` rather than at the
lookup, and the ported test has to assert `TypeError` instead of the Rails
error class.

This is the same class of divergence as
[[aggregate-mapping-miss-typeerror-vs-nomethoderror]].

## Converged shape

The `get` trap's else arm raises the `NoMethodError` analogue with Rails'
message shape instead of returning `undefined`, so the raise happens at the
lookup as `super` does. Check what the repo already uses for `NoMethodError`
before adding anything — do not invent a second error class for it. Note the
trap must keep returning `undefined` for the probes JS itself performs
(`then`, `Symbol.*`, `toJSON`, …) or every `await` on a recorder breaks; Ruby
has no equivalent probe, so that guard is language-forced and belongs at the
call site with a comment.

## Acceptance criteria

- `Migration > CommandRecorderTest > send calls super` in
  `packages/activerecord/src/migration/command-recorder.test.ts` asserts the
  `NoMethodError` analogue, not `TypeError`.
- `respond to delegates` and `unknown commands delegate` still pass, and
  awaiting a recorder still works.
- Green on sqlite3, PostgreSQL and MySQL.
