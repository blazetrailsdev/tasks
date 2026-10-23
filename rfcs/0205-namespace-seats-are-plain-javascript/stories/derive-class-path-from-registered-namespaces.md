---
title: "Generate each package's Ruby class-path table from rails-api.json instead of registering it at 790 seats"
status: draft
updated: 2026-10-22
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps:
  - seat-rule-is-plain-assignment-in-claude-md
deps-rfc: []
est-loc: 320
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`rbModName` is `classpaths.get(klass)?.path ?? klass.name ?? null`
(`packages/ruby-compat/src/object.ts:474`; `rbModToS` at `:444`, `rbObjClass`'s
path read at `:460`, `Exception`'s at `exception.ts:43`, `Module#name` at
`include.ts:245`). The JavaScript fallback is already there; the `classpaths`
WeakMap (`packages/ruby-compat/src/classpath.ts:8`) supplies only the `::`
prefix, and `rbModConstSet` fills it at 790 declarations.

Once the reads become plain ES imports, most classes are not seated on a
namespace at all, so there is nothing for a runtime derivation to walk. The
answer is already built: `scripts/api-compare/output/rails-api.json` holds
every Ruby class's fully-qualified name and defining file —
`"Arel::Nodes::NotEqual": { name: "NotEqual", fqn: "Arel::Nodes::NotEqual",
superclass: "Binary", file: "nodes/binary.rb", … }` — and `parity:api` already
matches each TS class to that counterpart, using the name and file-path
translations in `docs/ruby-ts-conventions.md`.

So the path becomes a generated, checked-in table per package: verified by
`parity:api` rather than by hand, a wrong or missing path is a CI red rather
than a silently unqualified name, and a new class costs nothing at its
declaration.

This story lands the table and the `rbModName` read before any conversion, so
every per-package conversion can assert paths are unchanged.

## Acceptance criteria

- [ ] A generator, beside the existing api-compare manifest tooling, writes one
      checked-in module per package mapping each exported class to its Ruby
      `fqn`, built from `rails-api.json` and the `parity:api` TS↔Ruby match.
- [ ] `rbModName` resolves in order: a `const_set`-bound path; a module-eval
      seat's path; the generated table; `klass.name`; `null`. `rbModToS`,
      `rbObjClass`'s path read, `Module#name`, `Exception`'s class-name read and
      `rbPathToClass` all go through it.
- [ ] `classpaths` keeps only the `const_set` and module-eval-seat writes and
      is documented as such; no package outside ruby-compat writes it.
- [ ] A CI check fails when a class in a Rails-matched file has no generated
      path, or when the generated path disagrees with a `const_set`-bound one.
- [ ] Every path `rbModName` answers today is answered identically after this
      story, proven by a snapshot taken on `main` before it — arel, whose 144
      seats are all helper-bound, is the reference.
- [ ] A ruby-compat test covers a class with a generated path, one with a
      `const_set`-bound path, an unseated class (`klass.name`), and an
      anonymous class (`null`).
- [ ] No regeneration is required to run the suite: the table is committed, and
      a stale one is a CI red, not a local build step.
