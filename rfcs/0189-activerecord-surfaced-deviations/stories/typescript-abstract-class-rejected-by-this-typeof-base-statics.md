---
title: "An AR abstract class cannot be a TypeScript abstract class: statics are typed this: typeof Base"
status: draft
updated: 2026-10-11
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

Surfaced by trailmap#53 (`/graphs/parity`).

`CompareRun`, `Stats` and `Hub` in trailmap are abstract in both senses — no
table, never instantiated — but none can be written `abstract class`.
TypeScript's `abstract` makes the constructor type abstract, and ActiveRecord's
statics are typed against a concrete one:

- `packages/activerecord/src/base.ts:722` — `static async loadSchema(this: typeof Base)`
- `packages/activerecord/src/base.ts:1202-1218` — `static where<T extends typeof Base>(this: T, ...)`
- `packages/activerecord/src/base.ts:1268` — `static async create<T extends typeof Base>(...)`
- `packages/activerecord/src/model-schema.ts:166` — `columnNames(this: typeof Base)`

So `abstract class CompareRun extends Stats` fails to typecheck at every static
call on it or its subclasses, and the application falls back to a comment
explaining why the keyword is missing (trailmap app/models/compare-run.ts:26-33).

## Expected shape

`abstract class X extends Base { static { this.abstractClass = true } }`
typechecks, and its concrete subclasses call `where`, `create`, `from`,
`columnNames`, `establishConnection` with no cast. Likely
`this: abstract new (...args: any[]) => Base`-style receivers on the statics
that do not construct, with the constructing ones (`create`, `new`) keeping the
concrete bound so instantiating an abstract class stays a compile error — which
is the point of allowing the keyword.

## Acceptance

- [ ] a type-level test: an `abstract class` AR model with `abstractClass = true`, and a concrete subclass querying through inherited statics
- [ ] `create` / `new` on the abstract class itself is a type error
- [ ] trailmap's three abstract bases can take the keyword
