---
title: "i18nKeys carries a model_name-less fallback Rails does not have"
status: done
updated: 2026-08-05
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6110
claim: "2026-08-05T01:29:56Z"
assignee: "model-name-i18n-keys-drops-model-name-fallback"
blocked-by: null
closed-reason: null
---

# `i18nKeys` carries a `model_name`-less fallback Rails does not have

## Context

Found while converging `ModelName#human` in #6105.

`ActiveModel::Name#i18n_keys`
(vendor/rails/activemodel/lib/active_model/naming.rb:220-226) maps every lookup
ancestor through `model_name.i18n_key`, unconditionally:

```ruby
def i18n_keys
  @i18n_keys ||= if @klass.respond_to?(:lookup_ancestors)
    @klass.lookup_ancestors.map { |klass| klass.model_name.i18n_key }
  else
    []
  end
end
```

`packages/activemodel/src/naming.ts` adds a second arm Rails has no counterpart
for — an ancestor without a `modelName` falls back to `underscore(k.name)`:

```ts
? this._klass.lookupAncestors().map((k) => {
    if (k.modelName) return k.modelName.i18nKey;
    return underscore(k.name);
  })
: []
```

Rails would raise `NoMethodError` there rather than invent a key. The fallback
also produces a _different_ key shape: `i18n_key` is the path form
(`"blog/post"`), while `underscore(name)` on a bare TS class name has no
namespace segments, so a namespaced ancestor silently resolves to the wrong
translation key instead of failing loudly.

## Converged shape

- Drop the `underscore(k.name)` arm; map through `k.modelName.i18nKey` only, as
  naming.rb:222 does.
- Confirm `lookupAncestors()` can only yield model-like classes in trails (the
  Rails contract is `lookup_ancestors` returns classes that respond to
  `model_name`); if some caller genuinely passes a bare class, fix that caller
  rather than re-adding the fallback.

## Acceptance criteria

- [ ] `i18nKeys()` has exactly the two arms naming.rb:220-226 has.
- [ ] No `underscore`-based key synthesis on the translation path.
- [ ] naming_test.rb / translation_test.rb cases pass with names untouched.
