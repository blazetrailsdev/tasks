---
title: "call-args-ar-autosave-around-save-method-name"
status: done
updated: 2026-08-11
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6377
claim: "2026-08-11T20:50:30Z"
assignee: "arel-append-escape-inline-convergence"
blocked-by: null
closed-reason: null
---

## Context

Split out of `call-args-ar-dropped-argument` (RFC 0099).
`add_autosave_association_callbacks`
(`vendor/rails/activerecord/lib/active_record/autosave_association.rb:193`)
registers the callback by METHOD NAME:

```ruby
around_save :around_save_collection_association
```

The Symbol is load-bearing — `Callback#duplicates?`
(`activesupport/lib/active_support/callbacks.rb`) dedups by it, which is how
Rails registers the hook once no matter how many collection associations a
model declares, and across the inheritance chain.

trails cannot pass a name: `packages/activesupport/src/callbacks.ts:671-675`
explicitly REJECTS a string filter (`"Passing string to define a callback is
not supported"`), leaving only a JS `Symbol` — which cannot spell a real
method name — or a closure. So
`packages/activerecord/src/autosave-association.ts:1323` registers a closure
and hand-rolls the dedup with an `_AUTOSAVE_AROUND_SAVE_KEY` own-property
marker. `aroundSaveCollectionAssociation` IS already mixed onto `Base`
(`autosave-association.ts:241`, `base.ts:4941`), so the target method exists.

Per CLAUDE.md a Ruby Symbol is a JS string, so a method-name filter should be
a plain string; `callbacks.ts` predates that rule.

## Acceptance criteria

1. `ActiveSupport::Callbacks` accepts a method-NAME filter spelled as a string
   (`CallTemplate.build` → `MethodCall`), and `Callback#isDuplicates` dedups on
   it — mirroring `activesupport/lib/active_support/callbacks.rb`.
2. `addAutosaveAssociationCallbacks` registers
   `aroundSave("aroundSaveCollectionAssociation")` and the bespoke
   `_AUTOSAVE_AROUND_SAVE_KEY` marker is deleted.
3. The `autosave-association.ts` `add_autosave_association_callbacks` →
   `around_save` `kind: "args"` baseline row is deleted (only-shrink).
4. `pnpm parity:api:calls:args` stays green.
