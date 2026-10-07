---
title: "activerecord: port AttributeMethods#respond_to_missing? beside method_missing"
status: draft
updated: 2026-10-07
rfc: "0180-activerecord-receipt-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced landing trails#8663, which ported `ActiveRecord::AttributeMethods#method_missing`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/attribute_methods.rb:472-495`) as `methodMissing` in
`packages/activerecord/src/attribute-methods.ts`.

Its sibling is not ported. Rails' private `respond_to_missing?` (`attribute_methods.rb:464-471`) is:

```ruby
def respond_to_missing?(name, include_private = false)
  if self.class.define_attribute_methods
    # Some methods weren't defined yet.
    return true if self.class.method_defined?(name)
    return true if include_private && self.class.private_method_defined?(name)
  end

  super
end
```

trails has `isRespondTo` (`attribute_methods.rb:291-306`) in the same file and no `respondToMissing`
on a record, so `rbObjRespondTo(record, "title")` on a record built before its schema loaded does not
define the attribute methods and answers false where `send(:title)` now succeeds.

## Acceptance criteria

- [ ] `respondToMissing(name, includePrivate = false)` is ported in `packages/activerecord/src/attribute-methods.ts` with Rails' body and `super` arm, `@internal` as `attribute_methods.rb:463` has it private, and included on `Base` beside `methodMissing`.
- [ ] A `.trails.test.ts` case: after `Base.connectionPool().schemaCache.clearBang()`, a record built cold and then `await Klass.loadSchema()` answers `rbObjRespondTo(record, "title")` true.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:extra:gate` green with no new row.
