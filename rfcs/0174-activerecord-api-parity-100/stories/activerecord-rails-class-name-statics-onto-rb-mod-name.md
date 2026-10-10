---
title: "activerecord: _railsClassName statics and Core.inspect's Base literal read the classpath from rb_mod_name"
status: in-progress
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8764
claim: "2026-10-10T19:09:47Z"
assignee: "activerecord-pg-uuid-primary-key-default-lives-in-schema-creation"
blocked-by: null
closed-reason: null
---

## Context

trails#8313 taught `rbModConstSet` (`packages/ruby-compat/src/include.ts`) to name a CLASS the way it
already named a module — MRI's `const_set` names any `rb_namespace_p` value
(`vendor/ruby/v3.3.11/variable.c:3648-3668`) — and added `rbModName`
(`packages/ruby-compat/src/object.ts`, `rb_mod_name`, `variable.c:122-127`), which `rbModToS` now
agrees with. `ActiveModel::Error`, `Errors` and `NestedError` are bound through it, so their
`inspect` interpolates `self.class.name` with no literal.

activerecord still carries the qualified name in an invented static, read where Rails reads
`self.class.name` / `self.class`:

- `packages/activerecord/src/relation.ts:274` `static _railsClassName = "ActiveRecord::Relation"`, read at `:400` — `vendor/rails/v8.0.2/activerecord/lib/active_record/relation.rb` `inspect` (`"#<#{self.class.name} [#{entries.join(', ')}]>"`)
- `packages/activerecord/src/association-relation.ts:11`, `disable-joins-association-relation.ts:15`, `associations/collection-proxy.ts:74` (read at `:394`) — the same `inspect`, inherited
- `packages/activerecord/src/encryption/cipher/aes256-gcm.ts:20`, read at `:92` — `encryption/cipher/aes256_gcm.rb` `inspect` (`"#<#{self.class.name}:#{'%#016x' % (object_id << 1)}>"`)
- `packages/activerecord/src/core.ts:100-104` — `Core::ClassMethods#inspect` hardcodes `"ActiveRecord::Base"` for `self == Base` and reads the unqualified JS `this.name` otherwise (`core.rb` `inspect` reads `super` / `name`)

Each of these classes is already seated on its Autoload namespace in
`packages/activerecord/src/namespaces.ts` by a plain assignment (`ActiveRecord.Relation = Relation`),
which is where Ruby's `class Relation` inside `module ActiveRecord` names it.

Related, not duplicates: `core-inspect-namespaced-qualified-class-name` (the user-model half of
`Core.inspect`), `activemodel-ruby-classpath-carriers-onto-rb-mod-name` (activemodel's carriers),
`date-inspect-class-name-survives-bundler-rename` (date's `_railsClassName`).

## Acceptance criteria

- [ ] The five classes above are bound on their namespace through `rbModConstSet`, and every `_railsClassName` read becomes `rbModName(this.constructor)`.
- [ ] No `_railsClassName` static remains in `packages/activerecord/src`; `Core.inspect`'s `"ActiveRecord::Base"` literal is gone.
- [ ] A subclass of `Relation` defined by a test inspects under its own name, as Ruby's `self.class.name` does.
- [ ] `pnpm parity:api:extra:gate` and `pnpm parity:api:calls` stay green; plain-node import of the built `dist/relation.js` and `dist/base.js` as entry modules shows no TDZ.
