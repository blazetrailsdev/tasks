---
title: "Route a Proc message: through I18n's resolve, not a local call plus Error.interpolate"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6093
claim: "2026-08-04T21:11:10Z"
assignee: "i18n-date-parse-eu-us-gate-misses-have-digit"
blocked-by: null
closed-reason: null
---

# Route a Proc `message:` through I18n's `resolve`, not a local call plus `Error.interpolate`

## Context

`packages/activemodel/src/error.ts`'s `generateMessage` opens with an arm Rails
does not have:

```ts
if (typeof msgOpt === "function") {
  const result = msgOpt(base, options);
  if (typeof result === "string") return Error.interpolate(result, options);
}
```

Rails never calls the Proc there. `generate_message` puts
`options[:message]` into the defaults chain unchanged
(`vendor/rails/activemodel/lib/active_model/error.rb:96-101`) and the i18n gem
calls it: `Backend::Base#resolve` invokes a Proc default with
`(object, options)` — the lookup key and the options hash —
(`i18n/lib/i18n/backend/base.rb`, ported at
`packages/i18n/src/backend/base.ts:328-365`), then interpolates the result
through the backend. So trails calls the Proc with the wrong first argument
(the record instead of the key) and interpolates with a bespoke
`Error.interpolate` whose miss behaviour differs from the gem's
`MissingInterpolationArgument`.

`Error.interpolate` is itself extra surface with no Ruby counterpart; it exists
only to serve this arm and the pre-gem literal-message path that PR 6026
already removed.

Note the neighbouring Proc _type_ arm is fine and stays: Rails does call that
one itself, in `Errors#normalize_arguments`
(`activemodel/lib/active_model/errors.rb:489-493`), and
`packages/activemodel/src/errors.ts:337` mirrors it.

## Acceptance criteria

- The `typeof msgOpt === "function"` arm is deleted from `generateMessage`; a
  Proc `message:` flows into `options.default` like any other value and is
  invoked by the backend's `resolve`.
- `Error.interpolate` is deleted, or reduced to whatever still has a Ruby
  counterpart.
- `activemodel/test/cases/errors_test.rb`'s Proc-message cases pass unchanged —
  `packages/activemodel/src/errors.test.ts` "add, with options[:message] as
  Proc, which evaluates to String, where type is nil" and its siblings.
