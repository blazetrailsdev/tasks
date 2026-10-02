---
title: "activerecord: Builder::BelongsTo.define_callbacks calls super; Association.extensions is the base class's list"
status: draft
updated: 2026-10-02
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
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

`Builder::BelongsTo.define_callbacks` (`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/builder/belongs_to.rb:20-25`) is:

```ruby
def self.define_callbacks(model, reflection)
  super
  add_counter_cache_callbacks(model, reflection) if reflection.options[:counter_cache]
  add_touch_callbacks(model, reflection)         if reflection.options[:touch]
  add_default_callbacks(model, reflection)       if reflection.options[:default]
end
```

`packages/activerecord/src/associations/builder/belongs-to.ts` `defineCallbacks` does not call `super`.
It repeats the base body in line: the `dependent` arm (`checkDependentOptions`, `addDestroyCallbacks`,
`addAfterCommitJobsCallback`) and the `for (const extension of this.extensions)` loop
(`associations/builder/association.rb:77-87`). `HasOne` and `CollectionAssociation` call `super`.

Also in `associations/builder/association.ts`: Rails iterates `Association.extensions` — the base class's
list (`association.rb:84`). The port reads `this.extensions`, whose getter copies the parent's list onto
each subclass on first access (`association.ts:35-40`), so an extension registered after a subclass first
read the list is missing from that subclass.

trails#8419 made the autosave extension's `build` register the autosave callbacks from this loop, so the
loop is now load-bearing.

## Acceptance criteria

- [ ] `BelongsTo.defineCallbacks` is `super.defineCallbacks(model, reflection)` followed by Rails' three guarded calls.
- [ ] `Association.defineCallbacks` iterates the base class's `extensions`, with no per-subclass copy.
- [ ] `pnpm parity:api:arms:report --package=activerecord` lists no `associations/builder/belongs-to.ts#defineCallbacks` row.
