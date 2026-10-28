---
title: "Seat every intermediate namespace so rbPathToClass drops its whole-path table read"
status: closed
updated: 2026-10-28
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "FALSIFIED: owner ruling 2026-10-28 (closed trails#9397): rbPathToClass is not refined into a per-segment const walk; it resolves through explicit registries and the table is deleted by delete-register-constant-and-the-top-level-constant-table."
---

## Context

Surfaced by trails PR 8350. `rbPathToClass`
(`packages/ruby-compat/src/variable.ts`) ports `rb_path_to_class`
(`vendor/ruby/v3.3.11/variable.c:432-474`), whose loop resolves one `::` segment
at a time with `rb_const_search(c, id, TRUE, FALSE, FALSE)` (`variable.c:445-466`).
The port carries one line MRI does not have, `if (_constants.has(pathname)) p = pend;`,
which reads a seated path whole.

It is there because the `registerConstant` table is flat and has holes. It seats
`"ActiveRecord::Type::String"`, `"ActiveRecord::Coders::YAMLColumn"`,
`"ActiveRecord::ConnectionAdapters::PostgreSQL::OID::Uuid"` and
`"MyApplication::Business::Prefixed::Nested"` without seating
`"ActiveRecord::Type"`, `"ActiveRecord::Coders"`, `"…::PostgreSQL::OID"` or
`"MyApplication::Business::Prefixed"`, and those namespaces are not own
properties of the namespace before them either. A strict per-segment walk
raises `ArgumentError: undefined class/module ActiveRecord::Type::` and nine
`packages/activerecord/src/yaml-serialization.test.ts` cases fail.
activesupport's `constantize` (`packages/activesupport/src/inflector.ts`) has
the same whole-path read first, for the same reason.

Related: `autoload-namespaces-resolve-through-constantize` (RFC 0151) covers the
framework namespaces missing from the table entirely.

## Acceptance criteria

- [ ] Every registered path's prefixes resolve segment by segment: each
      intermediate namespace is either seated in the table or an own property
      of the namespace before it (`Type` on `ActiveRecord`, `OID` on
      `PostgreSQL`, and so on), as `const_set` leaves them in Ruby.
- [ ] `rbPathToClass` drops the whole-path read and is the `variable.c:445-466`
      loop alone; `variable.trails.test.ts`'s "reads a full path the table seats
      before walking its prefixes" is replaced by a per-segment case.
- [ ] `constantize` drops its own whole-path read
      (`if (isRegisteredConstant(path)) return registeredConstant(path)`).
- [ ] `packages/activerecord/src/yaml-serialization.test.ts` and
      `packages/activesupport/src/yaml.trails.test.ts` stay green.

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
