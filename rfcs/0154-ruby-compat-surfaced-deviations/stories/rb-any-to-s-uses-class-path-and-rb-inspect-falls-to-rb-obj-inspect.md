---
title: "Serialized and NullPool inspect tests assert the Rails constant path"
status: draft
updated: 2026-10-10
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Both ruby-compat halves this story (and the duplicate
`rb-inspect-renders-a-plain-object-through-to-string-and-bare-class-name`,
closed into it) asked for have landed:

- `rbAnyToS` names the class through `rbModToS(obj.constructor)`
  (`packages/ruby-compat/src/object.ts:1448-1454`, trails#9019), which answers
  the constant path a class is seated under (`rb_any_to_s`,
  `vendor/ruby/v3.3.11/object.c:693-701`).
- `inspectValue` falls through to `rbObjInspect` for a plain object with no
  `inspect` (`object.ts:1571`, trails#9026; `rb_inspect` → `rb_obj_inspect`,
  `object.c:704,783-795`).

What is left is the two tests that were written to tolerate the old answers,
and the seats they need:

- `packages/activerecord/src/type/serialized.trails.test.ts:112` matches
  `/^#<(ActiveRecord::Type::)?Serialized:0x…/`, accepting the bare name.
  Ruby prints `#<ActiveRecord::Type::Serialized:0x…` for
  `Type::Serialized#inspect` (`vendor/rails/v8.0.2/activerecord/lib/active_record/type/serialized.rb:33`).
- `packages/activerecord/src/connection-pool.trails.test.ts:1118` asserts
  `rbObjInspect(pool)` against `/^#<NullPool:0x…/`, where Ruby prints
  `#<ActiveRecord::ConnectionAdapters::NullPool:0x…`, and reads `rbObjInspect`
  where the test means `rbInspect`.

## Acceptance criteria

- [ ] `Type::Serialized` and `ConnectionAdapters::NullPool` answer their Rails
      constant path from `rbModToS` (seated through `rbModConstSet` on their
      namespace, CLAUDE.md § "Call-time constant resolution", if they are not).
- [ ] The Serialized test asserts `#<ActiveRecord::Type::Serialized:0x` only,
      with no `[object Object]` in the output.
- [ ] The NullPool test asserts `rbInspect(pool)` matches
      `/^#<ActiveRecord::ConnectionAdapters::NullPool:0x/`.

## RFC 0205 note

Do not add a namespace seat to give a class its Ruby path. Since
`derive-class-path-from-registered-namespaces`, `rbModName` / `rbModToS` /
`rbObjClassname` answer a class's path from its package's generated table,
`packages/<pkg>/src/class-paths.generated.ts` (`pnpm parity:class-paths`, gated
in CI), whenever the package entry is loaded. A class missing from it is fixed
by pairing it in `parity:api` (or exporting it), not by a seat. Reach a class
from a method body with a plain ES import; the seat helper is kept only at the
Rails bodies that call `const_set` (CLAUDE.md § "Call-time constant
resolution"). Acceptance criteria below that ask for a seat are read through
this note.
