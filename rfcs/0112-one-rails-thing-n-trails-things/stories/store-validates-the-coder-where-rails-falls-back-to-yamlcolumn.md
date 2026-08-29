---
title: "store() raises on a non-coder where Rails falls back to YAMLColumn"
status: claimed
updated: 2026-08-29
rfc: "0112-one-rails-thing-n-trails-things"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: "2026-08-29T11:52:35Z"
assignee: "association-helpers-extracted-for-the-collection-proxy"
blocked-by: null
closed-reason: null
---

## Context

trails' `store()` (`packages/activerecord/src/store.ts`) validates the resolved
coder before wrapping it:

```ts
if (
  coder != null &&
  (typeof (coder as any).dump !== "function" || typeof (coder as any).load !== "function")
) {
  throw new ConfigurationError(
    `store coder for '${storeAttribute}' must implement dump() and load(), but got ${typeof coder}.`,
  );
}
```

Rails has no such guard. `ClassMethods#store` (`store.rb:105-109`) is three
lines — `build_column_serializer`, then `serialize store_attribute, coder:
IndifferentCoder.new(store_attribute, coder)` — and the respond*to? test lives
inside `IndifferentCoder#initialize` (`store.rb:265-271`) as a \_fallback*, not a
raise:

```ruby
def initialize(attr_name, coder_or_class_name)
  @coder =
    if coder_or_class_name.respond_to?(:load) && coder_or_class_name.respond_to?(:dump)
      coder_or_class_name
    else
      ActiveRecord::Coders::YAMLColumn.new(attr_name, coder_or_class_name || Object)
    end
end
```

So Rails treats a non-coder argument as a _class name for YAMLColumn_ —
`store :settings, coder: SomeClass` is a supported spelling — where trails
raises `ConfigurationError` on the same input. The invented raise both adds
surface Rails does not have and rejects a working Rails API.

Noticed while collapsing `storeAccessorFor` onto the attribute type in PR #7098;
out of scope there because it changes what `store()` accepts, not how the
accessor resolves.

## Converged shape

Delete the validation block from `store()` so the method is Rails' three lines,
and let `IndifferentCoder`'s constructor make the respond_to?(:load)/(:dump)
decision — falling back to `YAMLColumn.new(attrName, coderOrClassName ?? Object)`
for anything that is not a coder, exactly as `store.rb:265-271` does. Check
trails' `IndifferentCoder` constructor already carries that fallback arm; if it
short-circuits on a null coder instead, port the `|| Object` default too.

## Acceptance criteria

- `store()` has no coder-shape validation and raises no `ConfigurationError` of
  its own for a non-coder `coder:` option.
- trails' `IndifferentCoder` constructor mirrors `store.rb:265-271`, including
  the `coder_or_class_name || Object` default.
- A test covers `store(Model, "settings", { coder: SomeClass })` — a class that
  implements neither `load` nor `dump` — resolving through YAMLColumn rather
  than raising.
- `store.test.ts` stays green, including the JSON and YAML coder arms.
