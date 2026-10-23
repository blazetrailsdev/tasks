---
title: "CoreQueries builds ClassMethods through Concern#class_methods"
status: draft
updated: 2026-09-24
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `Concern#class_methods` (`vendor/rails/v8.0.2/activesupport/lib/active_support/concern.rb:209-215`)
builds `ClassMethods` and `module_eval`s the block into it.

The story first asked for `ClassMethods` to be a ruby-compat `Module` so a
`class_methods` method could call `super`. RFC 0197 settled the other way: a
module is a plain object, and a `super` from a module included by an open set
of classes is `rbCallSuper` (CLAUDE.md § "A module included by an open set of
classes binds `super` at include time"). trails' `Concern.classMethods`
(`packages/activesupport/src/concern.ts:130-136`) already builds a plain-object
`ClassMethods` and runs the definition block against it, and `extend()` seats
the shadowed method for `rbCallSuper`.

What is left is the one site that bypasses `class_methods`.
`ExtendedDeterministicQueries::CoreQueries`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/encryption/extended_deterministic_queries.rb:124-131`)
is

```ruby
module CoreQueries
  extend ActiveSupport::Concern

  class_methods do
    def find_by(*args)
      super(*EncryptedQuery.process_arguments(self, args, false))
    end
  end
end
```

`packages/activerecord/src/encryption/extended-deterministic-queries.ts:146-152`
extends `Concern` and then assigns `CoreQueries.ClassMethods = { findBy }` by
hand, where Rails calls `class_methods`.

## Acceptance criteria

- [ ] `CoreQueries` builds its `ClassMethods` through
      `CoreQueries.classMethods((mod) => { mod.findBy = findBy; })` (or the
      equivalent definition-block shape `concern.ts` takes), with no direct
      `ClassMethods` assignment.
- [ ] `findBy` keeps its `rbCallSuper` body, and the encryption
      deterministic-query tests stay green.
