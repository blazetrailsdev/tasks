---
title: "active_support.set_hash_digest_class reads the static railtie config, not the yielded app's"
status: ready
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: 20
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `active_support.set_hash_digest_class` reads the yielded application's
config:

```ruby
initializer "active_support.set_hash_digest_class" do |app|
  config.after_initialize do
    if klass = app.config.active_support.hash_digest_class
      ActiveSupport::Digest.hash_digest_class = klass
    end
  end
end
```

(`activesupport/lib/active_support/railtie.rb`.)

trails reads the static railtie config instead
(`packages/trailties/src/trailties/active-support.ts:112`):

```ts
this.initializer("active_support.set_hash_digest_class", () => {
  const klass = (this.config["activeSupport"] as ActiveSupportConfig | undefined)
    ?.hashDigestClass;
  ...
});
```

so an application-level `config.activeSupport.hashDigestClass` — including the
one `loadDefaults` writes (`application/configuration.ts:151`, `:267`) — is
ignored unless the static Trailtie config is also mutated.

This is the same defect a reviewer caught in the neighbouring
`active_support.deprecation_behavior` on PR #7387, fixed there and left here
because it was outside that story. The two initializers now read their config
two different ways in one file.

The same file's `active_support.deprecator` initializer shows the fixed shape:
read the app's option bag first, fall back to the railtie seed — which mirrors
Ruby's `Railtie::Configuration#method_missing` resolving through the shared
`@@options` (`railties/lib/rails/railtie/configuration.rb:96-108`) back to the
hash `railtie.rb:10` seeded.

## Converged shape

`set_hash_digest_class` takes the yielded `app` and reads
`app.config.get("activeSupport")`, falling back to `this.config["activeSupport"]`,
exactly as `deprecation_behavior` does after #7387. Ruby's `if klass = ...`
truthiness guard is kept.

`config.after_initialize` (the `after_initialize` load hook) is the other half of
this initializer that trails does not have; port it or leave it out of scope, but
do not let the config read stay static.

## Acceptance criteria

- [ ] `active_support.set_hash_digest_class` reads the yielded app's
      `activeSupport` config, falling back to the railtie seed.
- [ ] A test pins that an app-level `hashDigestClass` reaches
      `Digest.hashDigestClass` with an empty railtie config — it must fail on the
      current shape.
- [ ] No initializer in `active-support.ts` reads `this.config` where Rails reads
      `app.config`.
