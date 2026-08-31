---
title: "activesupport Railtie: initializer blocks take no arguments, so railties read the app off config"
status: claimed
updated: 2026-08-31
rfc: "0069-globalid-trailtie-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-08-31T15:51:54Z"
assignee: "activesupport-railtie-initializer-yields-no-app"
blocked-by: null
closed-reason: null
---

## Context

Rails yields the application to the initializer block
(`vendor/globalid/lib/global_id/railtie.rb:16`):

```ruby
initializer 'global_id' do |app|
```

activesupport's `Railtie.initializer(name, block)`
(`packages/activesupport/src/railtie.ts`) takes a zero-argument block, so
`packages/globalid/src/trailtie.ts` reads the app out of the shared config bag
instead:

```ts
this.initializer("global_id", () => {
  Trailtie.initialize(Trailtie.config["app"] as TrailtieApp);
});
```

activemodel's Trailtie has the same shape, so the deviation is the
activesupport Railtie's signature, not this port. Rails' `Initializable::Initializer#run`
(`railties/lib/rails/initializable.rb:31-33`) is
`@block.call(*args)` with the application passed by
`run_initializers(group = :default, *args)` (`initializable.rb:60-63`) —
trailties' own `Initializable` (`packages/trailties/src/initializable.ts`)
already ports that arg-passing form, so only the activesupport base lacks it.

## Acceptance criteria

- [ ] `Railtie.initializer`'s block receives the arguments
      `runInitializers`/`runAllInitializers` are called with, mirroring
      `initializable.rb:31-33` and `:60-63`.
- [ ] globalid's Trailtie takes its `app` from the block parameter, and the
      `Trailtie.config["app"]` read is deleted.
- [ ] activemodel's Trailtie is left working (it reads `Trailtie.config`
      directly and needs no app), and `trailtie.test.ts` in both packages stays
      green with names unchanged.
