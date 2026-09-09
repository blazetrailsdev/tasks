---
title: "ruby-compat-errors-bypass-standarderror"
status: ready
updated: 2026-09-09
rfc: "0111-error-class-message-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 110
priority: 10
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's rescuable exception tree is rooted at `StandardError`
(`vendor/ruby/error.c:3319` `rb_eStandardError`), and every ordinary error is a
descendant of it:

```text
StandardError
  ArgumentError, RuntimeError, TypeError, IOError, IndexError (< KeyError),
  NameError (< NoMethodError), NotImplementedError (< ScriptError in <3.0,
  StandardError-rescuable in practice), FrozenError (< RuntimeError), ...
```

`rescue => e` with no class named rescues `StandardError`, so in Ruby a bare
`rescue` catches all of these. trails#7587 added
`packages/ruby-compat/src/standard-error.ts` for the one raise site that needs
it (`sqlite3/database_statements.rb:68`), but every other ruby-compat error
class still extends `Error` directly:

- `argument-error.ts:10` — Ruby `ArgumentError < StandardError`
- `runtime-error.ts:10` — Ruby `RuntimeError < StandardError`
- `type-error.ts` — Ruby `TypeError < StandardError`
- `key-error.ts:15` — Ruby `KeyError < IndexError < StandardError`
- `name-error.ts` — Ruby `NameError < StandardError` (and
  `no-method-error.ts:12` inherits through it, already correct relative to
  `NameError`)
- `io-error.ts`, `eof-error.ts`, `encoding-error.ts`, `float-domain-error.ts`,
  `frozen-error.ts`, `not-implemented-error.ts`

So `catch (e) { if (e instanceof StandardError) }` — the JS spelling of Ruby's
bare `rescue` — matches only the one class that PR added, and a port of a Ruby
body that rescues `StandardError` cannot be written faithfully. This is the
same fragmentation `one-shared-nomethoderror-class` retired one level down: it
is fixed there for `NoMethodError < NameError` and unfixed for everything
under `StandardError`.

`FrozenError < RuntimeError` and `KeyError < IndexError` are two intermediate
links the tree also currently flattens; `IndexError` has no ruby-compat class
yet, so `KeyError` either gains one or extends `StandardError` directly with
the gap noted.

## Converged shape

`StandardError` becomes the parent every ruby-compat error class named above
extends, with the intermediate Ruby links (`FrozenError < RuntimeError`,
`KeyError < IndexError`) restored where the intermediate class exists or is
worth adding. Nothing about the classes' own names, messages or `name`
assignments changes; only the `extends` clause does.

Two mechanical constraints from #7587 apply:

- `eslint/rails-error-parity.mjs`'s `ROOT_BASES` set already names
  `StandardError`, and its root check requires a manifest root class to extend
  a `NATIVE_ERRORS` name — re-parenting a Rails-side root onto `StandardError`
  may need that check taught the new base.
- `parity:api:extra:gate` pins ruby-compat's `total` at 58 and its `novel` at 0.
  Adding an `IndexError` class costs nothing only if it carries no explicit
  constructor (assign `name` via `.prototype.name`, as `standard-error.ts`
  does); a constructor adds a counted name and reds the gate.

## Acceptance criteria

- [ ] Every ruby-compat error class listed above extends `StandardError`
      (directly or through its Ruby intermediate), so
      `e instanceof StandardError` is true for all of them.
- [ ] Each `extends` clause cites the Ruby hierarchy it mirrors.
- [ ] `pnpm parity:api:extra:gate` stays green — no ruby-compat `total`/`novel`
      growth.
- [ ] `pnpm lint` stays green, including `blazetrails/rails-error-parity`'s
      root-class check.
