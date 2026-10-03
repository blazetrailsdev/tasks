---
title: "activerecord: Base.allocate is Class#allocate from ruby-compat, not a constructor run under suppress flags"
status: draft
updated: 2026-10-02
rfc: "0174-activerecord-api-parity-100"
cluster: receipts
packages: ["activerecord", "ruby-compat"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-root-a-m` audit: the receipt below was `PERMANENT`, no CLAUDE.md section ratifies it, and it is re-tagged `CONVERGEABLE` onto this story.

Rails calls `Class#allocate` (`rb_obj_alloc`, `vendor/ruby/v3.3.11/object.c:2117`) to get an
instance without running `initialize`:

- `vendor/rails/v8.0.2/activerecord/lib/active_record/persistence.rb:313` `instantiate_instance_of`: `klass.allocate.init_with_attributes(attributes, &block)`
- `vendor/rails/v8.0.2/activerecord/lib/active_record/persistence.rb:488` `becomes`: `became = klass.allocate`
- `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/schema_cache.rb:101`: `SchemaCache.allocate`

`allocate` is MRI's, so `base.rb` defines none. `packages/activerecord/src/base.ts` defines
`static allocate` (`@noRailsEquivalent`) as `new this()` run under three class-level flags it sets
and restores, `_suppressInitializeCallback`, `_suppressAbstractCheck` and `_allocating`, because a JS
class's field initializers run only inside its constructor. `_allocating` (trails#8428) is read by
`Core#initInternals` and by the constructor's STI dispatch, so that the constructor run builds no
default attribute set and takes no `new` dispatch — the two things `Class#allocate` never does.

Related: `becomes-constructs-via-new-instead-of-allocate` (the `becomes` caller and its own two
flags), `adopt-rbobjdup-rbobjclone-at-remaining-copy-sites` (`rbObjClone` / `rbObjDup` already
allocate through `Object.create(prototype)`).

## Converged shape

ruby-compat exports the port of `rb_obj_alloc`, and `instantiate_instance_of`, `becomes` and the
schema-cache site call it. `Base` defines no `allocate`, and the three flags are gone. The
obstacle to measure first: which `Base` instance fields have a class-field initializer that
`init_with_attributes` (`vendor/rails/v8.0.2/activerecord/lib/active_record/core.rb:508-520`) does not itself assign, since those are what an
`Object.create` instance would be missing.

## Acceptance criteria

- [ ] `Base.allocate` and its `@noRailsEquivalent` receipt are deleted; callers go through the ruby-compat export.
- [ ] `_suppressInitializeCallback`, `_suppressAbstractCheck` and `_allocating` are no longer set by an allocation path, and nothing reads `_allocating`.
- [ ] `pnpm parity:api:extra:gate` and `pnpm parity:api:receipts:gate` stay green.
