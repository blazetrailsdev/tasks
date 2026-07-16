---
title: "AR error .name should be the fully-qualified Rails class name"
status: ready
updated: 2026-07-16
rfc: "0023-surfaced-deviations"
cluster: null
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

Ruby's `e.class.name` on an AR error is fully qualified —
`"ActiveRecord::StatementInvalid"`, `"ActiveRecord::RecordNotFound"`. trails' AR
error classes carry only the **bare** constructor name on `.name`:
`new StatementInvalid("x").name === "StatementInvalid"`
(`packages/activerecord/src/errors.ts`, verified at runtime while reviewing PR
4897). No AR error assigns `this.name` — a `git grep` for
`this.name = "ActiveRecord::` over `packages/activerecord/src` returns nothing.

actionpack, by contrast, DOES set the namespaced name where it ports Rails
errors: `ActionDispatch::ParamError` (`action-dispatch/http/param-error.ts:28`),
`ActionDispatch::Http::MimeNegotiation::InvalidType` (`mime-negotiation.ts:38`).
The canonical reader convention is `classNameOf`
(`actionpack/src/action-dispatch/middleware/exception-wrapper.ts:75`): prefer
`e.name` when set and not the inherited `"Error"`, else the constructor.

This is load-bearing, not cosmetic. `rescue_responses` keys off fully-qualified
names, and `action_controller/log_subscriber.rb:32` feeds
`payload[:exception]&.first` (the class-name half of the notification tuple)
into `status_code_for_exception`. Since PR 4897, `_recordException` emits
`e.name`-first via a local `_classNameOf`, so the moment an AR error reaches
that path it contributes a bare name that misses the qualified-name lookup.

## Acceptance criteria

- [ ] AR error classes expose the fully-qualified Rails name via `.name`
      (`"ActiveRecord::StatementInvalid"`, etc.), matching Ruby's
      `e.class.name`, rather than the bare constructor name.
- [ ] The scheme is applied consistently across the `ActiveRecord::*` hierarchy
      in `packages/activerecord/src/errors.ts` (and any error defined outside
      it), not one-off per class.
- [ ] A test pins at least one representative (e.g. StatementInvalid) so a
      subclass that forgets the assignment can't silently regress to the bare
      name.
- [ ] `instrumentation.trails.test.ts` — currently asserts `"StatementInvalid"`
      — is updated to the qualified name once the source changes, keeping the
      `sql.active_record` exception-tuple coverage honest.

## Notes

Mind existing readers of `.name`: `error-class-hierarchy-parity-gaps` and any
`instanceof` / name-based dispatch. Grep the AR tree for `.name ===` comparisons
before flipping the value. Surfaced by PR 4897 (notifications rescue arm).
