---
title: "base-declared-members-overridable-as-methods"
status: draft
updated: 2026-10-22
rfc: "0198-activerecord-mixin-host-typing"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`included-mixins-overridable-beyond-conversion` gave method-signature interfaces to the `Included<>` mixins `Model` extends (`Model#runCallbacks`, `API#validatesWith`, `Serializers::JSON#serializableHash` / `#readAttributeForSerialization`, `ToJsonWithActiveSupportEncoder#toJSON`, `Attributes`' public `AttributeMethods` members). `ActiveRecord::Base` declares many instance members as class properties instead (`packages/activerecord/src/base.ts`, e.g. `declare isPersisted: typeof _Persistence.isPersisted` at ~:1419, `declare isReadonly`, `declare cacheKey`, `declare toParam`, `declare inspect`, `declare touch`). A class property cannot be overridden by a method (TS2425), so `class Post extends Base { override toParam() { … } }` does not compile, where Rails lets a model override `to_param` (`activerecord/lib/active_record/integration.rb`), `inspect` (`core.rb`) and `cache_key`.

## Acceptance criteria

- Every `declare x: typeof fn` / `declare x: () => T` instance member on `Base` that Rails exposes as a public instance method becomes a method signature on the `Base` interface, derived from the function (`Parameters<typeof f>` / `ReturnType<typeof f>`).
- A trails type-level test overrides `toParam`, `inspect`, `cacheKey`, `isPersisted`, `isReadonly` and `touch` from a `Base` subclass.
