---
title: "include() links the module method table so post-include alias/remove propagates"
status: ready
updated: 2026-09-16
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `Module#include` links the module into the ancestry, so a later
`remove_method` / `alias_method` on the module is visible to every class that
already included it. `ActiveRecord::Marshalling.format_version=`
(`vendor/rails/activerecord/lib/active_record/marshalling.rb:10-20`) depends on
that: it aliases or removes `Methods#marshal_dump` after `Base` has done
`include Marshalling::Methods` (`activerecord/lib/active_record/base.rb:332`).

trails' `include()` (`packages/ruby-compat/src/include.ts`, `export function include`)
copies the module's members onto the class, and `Module#include` copies into a
carrier (its own JSDoc: "`include()` copies into rather than links behind").
So a later method-table change on the module never reaches the including
class. This blocked `port-active-record-marshalling-format-version` in trails#7779.

## Acceptance criteria

- A method defined, aliased or removed on an included module after `include()`
  is visible (or gone) on the including class's instances, as Ruby's ancestry
  link makes it.
- `Module` gains `aliasMethod` / `removeMethod` (Ruby core `rb_mod_alias_method`,
  `rb_mod_remove_method`) if the marshalling port needs them.
- ruby-compat include tests cover the post-include mutation arms.
