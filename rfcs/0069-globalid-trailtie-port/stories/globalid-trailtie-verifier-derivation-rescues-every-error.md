---
title: "globalid Trailtie: verifier derivation rescues every error where Rails rescues ArgumentError"
status: done
updated: 2026-08-31
rfc: "0069-globalid-trailtie-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 7301
claim: "2026-08-31T15:51:54Z"
assignee: "activesupport-railtie-initializer-yields-no-app"
blocked-by: null
closed-reason: null
---

## Context

`packages/globalid/src/trailtie.ts`'s `after_initialize` arm derives the
verifier as:

```ts
config.verifier ??= (() => {
  try {
    return new Verifier(app.keyGenerator().generateKey("signed_global_ids"));
  } catch {
    return undefined;
  }
})();
```

Rails rescues exactly one class
(`vendor/globalid/lib/global_id/railtie.rb:29-33`):

```ruby
app.config.global_id.verifier ||= begin
  GlobalID::Verifier.new(app.key_generator.generate_key('signed_global_ids'))
rescue ArgumentError
  nil
end
```

The catch-all is forced by the callee, not by TypeScript:
`Application#keyGenerator` (`packages/trailties/src/application.ts`) throws a
plain `Error("Missing secret_key_base.")` where Rails raises `ArgumentError`
(`railties/lib/rails/application.rb`, `key_generator` → `secret_key_base`
validation). With no ArgumentError analogue to name, a narrow catch would have
to match on the message.

## Acceptance criteria

- [ ] `Application#keyGenerator` raises the `ArgumentError` analogue for a
      missing `secret_key_base`, matching Rails' class and message.
- [ ] globalid's Trailtie rescues only that class; every other error
      propagates, as `railtie.rb:31-32` does.
- [ ] A test covers a non-ArgumentError failure inside the derivation
      propagating rather than silently leaving the verifier unset.
