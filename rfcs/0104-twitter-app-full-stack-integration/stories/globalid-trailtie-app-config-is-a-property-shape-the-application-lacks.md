---
title: "globalid's TrailtieApp declares a config property shape trailties' Configuration does not have"
status: done
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: 20
pr: 7488
claim: "2026-09-04T17:50:45Z"
assignee: "type-registry-key-replaces-per-adapter-overrides"
blocked-by: null
closed-reason: null
---

## Context

`packages/globalid/src/trailtie.ts`'s exported `TrailtieApp` declares the app's
config as a plain object with a named property:

```ts
export interface TrailtieApp {
  railtieName: string;
  config: { globalId?: GlobalIdConfig };
  ...
}
```

and `Trailtie.initialize` reads `app.config.globalId ??= ...`
(`trailtie.ts`, mirroring `global_id/railtie.rb:16-42`).

The object a real boot actually yields is trailties' `Application`, whose
`config` is a `Configuration` exposing a `get(key)` / `set(key, value)` /
`respondTo(key)` option bag (`packages/trailties/src/trailtie/configuration.ts:117-125`)
— it has no `globalId` own property. So `app.config.globalId` is `undefined` for
every real application, the `??=` writes a property nothing else reads, and the
initializer silently always takes the railtie-seed default. Only the test's
hand-built literal satisfies the declared shape.

Ruby has no such split: `app.config.global_id` goes through
`Railtie::Configuration#method_missing`, which resolves against the shared
`@@options` (`railties/lib/rails/railtie/configuration.rb:96-108`) — the very
hash `global_id/railtie.rb:13` seeded — so the reader and the seed are one store.

PR #7387 hit the same split in `trailties/src/trailties/active-support.ts` and
converged that initializer onto `app.config.get("activeSupport")` with the
railtie seed as fallback. globalid was left alone because it was outside that
story.

## Converged shape

`TrailtieApp.config` is typed as the option-bag accessor trailties' `Configuration`
actually has, and `Trailtie.initialize` reads
`app.config.get("globalId")` falling back to `BaseTrailtie.config["globalId"]`,
writing back through `app.config.set` where Ruby's `??=` writes — the shape
`active-support.ts` now uses. Alternatively give `Configuration` real accessors
for the seeded namespaces, which would let both files keep the property read; the
point is that one store backs both the seed and the app-level write.

`trailtie.test.ts`'s `buildApp` helper moves to the same accessor shape; its test
names do not change.

## Acceptance criteria

- [ ] `global_id`'s initializer reads the config a real `Application` carries, not
      a property that only a test literal has.
- [ ] A test boots an `Application`, sets `globalId.app` on its config, and pins
      that the initializer honours it rather than the dasherized default — it must
      fail on the current shape.
- [ ] `packages/globalid` and `packages/trailties` read the trailtie config the
      same way.
