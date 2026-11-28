---
rfc: "0000-typed-json-openapi"
title: "Typed as_json and render json:, and an OpenAPI spec generated from them"
status: draft
created: 2026-11-27
updated: 2026-11-27
owner: "@deanmarano"
packages:
  - activemodel
  - activerecord
  - actionpack
  - trails-tsc
  - stimulus
  - trailties
clusters:
  - typed-serialization
  - openapi
  - follow-ons
---

<!-- Unnumbered until merge. -->

# RFC — Typed as_json and render json:, and an OpenAPI spec generated from them

## Summary

The JSON a trails controller renders should have a static type: the type a
model's `declare` fields, a literal `only` / `except` / `methods` / `include`,
and the `render({ json })` call site already give it. Once that type exists, a
`trails-tsc` plugin can read it at every action, pair it with `config/routes.ts`,
and write an OpenAPI 3.1 document. A Vite frontend then gets a typed client
(`openapi-typescript` + `openapi-fetch`) with nothing written by hand.

Rails can't do this. `render json: @post` calls `as_json` at runtime, and the
response shape is never declared, which is why rswag and rspec-openapi either
make you write the schema or record it from test traffic. trails' TypeScript
types make it derivable, and runtime behaviour doesn't change at all: every
change here is to types, plus one build plugin.

## Motivation

The type information exists today but is erased at three points:

- **Model attributes are typed.** Models carry `declare` fields
  (`examples/electron-writebook/app/models/edit.ts:10`:
  `declare action: "revision" | "trash"`, `declare leaf: Promise<Leaf>`;
  has-many is `CollectionProxy<T>`, which is `PromiseLike<T[]>`).
  `activerecord-cli`'s type virtualization produces them from the schema.
- **Serialization erases them.** `SerializeOptions`
  (`packages/activemodel/lib/serialization.ts:118`) types `only` / `except` /
  `methods` / `include` as `string | string[]`, and `asJson` returns
  `Record<string, unknown>` (`packages/activemodel/lib/serializers/json.ts`).
  A typo in `only:` silently drops a key; the result is `unknown` to every
  caller.
- **Rendering erases the rest.** `RenderOptions.json` is `unknown`
  (`packages/actionpack/lib/action-controller/base.ts:223`), so the
  response body type is gone at the one place a tool could read it.

A frontend that consumes a trails API today hand-writes its response types and
finds drift at runtime. trailmap (RFC 0136, the proving ground) is the first
consumer.

## Design

### 1. `Serialized<M, O, B>`: the type of `serializable_hash(options)`

Types only, in `activemodel/lib/serialization.ts`, beside `SerializeOptions`:

- `AttributeKeys<M, B>` is `M`'s non-function, non-thenable members, minus those of the
  base class `B`. activemodel can't name `ActiveRecord::Base`, so `B` is a
  parameter that activerecord supplies.
- `AssociationKeys<M, B>` is `M`'s thenable members. `Awaited<M[A]>` covers both
  `Promise<Leaf | null>` (belongs_to / has_one, nullable kept) and
  `CollectionProxy<Leaf>` (has_many, becomes an array), so one rule covers every
  association kind without activemodel importing activerecord.
- `TypedSerializeOptions<M, B>` is `SerializeOptions` with `only` / `except` checked
  against `AttributeKeys` and `include` against `AssociationKeys`, recursively
  with the target model's options.
- `Serialized<M, O, B>` is the **raw** hash `serializable_hash` returns,
  mirroring its branches
  (`vendor/rails/v8.0.5.2/activemodel/lib/active_model/serialization.rb:125-149`).
  Values aren't encoded, so a `Date` stays a `Date`. `only` wins over `except`.
  `methods` adds keys under their Rails name, typed by whatever the member the
  runtime `send`s returns: a reader's value, or a method's return _unawaited_,
  since the runtime stores it as-is. `include` adds each association serialized
  recursively with its own options.
- `JsonValue<V>` mirrors the encoder's dispatch order
  (`packages/activesupport/lib/core-ext/object/json.ts`): primitives pass
  through, `undefined` becomes `null`, `bigint` becomes `string`
  (`Numeric.asJson`), then an own `asJson()` wins _before_ `toJSON()`, arrays
  map element-wise, and a `PromiseLike` (an unawaited async method) encodes as
  `Object#as_json`'s `{}`.
- `SerializedJson<M, O, B>` = `JsonValue<Serialized<M, O, B>>` is the shape
  `as_json` returns, because `as_json` is `serializable_hash(options).as_json`
  (`serializers/json.rb:103`).

The draft prototype, blazetrailsdev/trails#10860, lands this with type tests
and changes no runtime code. It follows `serializable_hash` branch for branch:
a nil `only:` falls through to `except:`; a nil singular association is an
_optional_ key, not `| null`, because `serializable_add_includes` skips it
(`if records = send(association)`); and `methods:` accepts a member's Rails
spelling, including the `foo?` → `isFoo()` predicate rule that trails' runtime
applies.

### 2. `serializableHash` returns `Serialized`, `asJson` returns `SerializedJson`

`ActiveRecord::Base#asJson` gains the signature below, and `serializableHash` the
same with `Serialized`:

```ts
asJson<const O extends TypedSerializeOptions<this, Base>>(options?: O): SerializedJson<this, O, Base>;
```

The TS 5 `const` type parameter keeps `{ only: ["id", "title"] }` literal
without `as const` at the call site. The `SerializableHash` dual sync/thenable
shape (activemodel CLAUDE.md, "Serialization's dual sync/async hash") is kept:
the return becomes `T & PromiseLike<T>`. `root:`
wraps the result in `{ [root]: … }` when it's a string literal and is otherwise
left untyped.

### 3. `render({ json })` carries the body type

`RenderOptions` gets a `json` overload whose type parameter is the body, and
`status` stays the typed `SYMBOL_TO_STATUS_CODE` key. This changes types only.
A model or relation passed as `json:` (Rails calls `to_json` on it) is typed as
`Serialized<M>`, its no-option `asJson`.

### 4. `trails-tsc` `openapi` plugin

The plugin lands in three stories: extraction (steps 1, 2 and 4, with inline
schemas), the converter (step 3), and `--check`. It runs over the program `trails-tsc` already builds, beside `tse`:

1. Evaluate `config/routes.ts` through the route set's inspector (the same data
   `trails routes` prints) to get each route's verb, path, and `controller#action`.
2. Find each action method's `render({ json, status })` calls and ask the checker
   for the `json` argument's type. Each distinct `status` becomes a response.
   An action with no JSON render gets no `application/json` response.
3. Convert each type to JSON Schema 2020-12. String-literal unions become `enum`
   (so `action` comes out as `enum: [revision, trash]`), `T | null` becomes
   `type: [..., "null"]`, and named model shapes become `components.schemas`
   refs, keyed by model name plus an options hash so two different `only:`
   shapes of `Post` don't collide.
4. Write `tmp/openapi.json` (configurable). A `--check` mode diffs it against a
   committed copy, so CI catches API changes.

The converter is `ts-json-schema-generator`'s type formatter, wrapped in our
own `$ref` naming (Open question 3).

### 5. Request bodies from strong params

`params.require("post").permit("title", "body")` gets a literal-typed return
the same way, and the plugin emits it as the action's `requestBody`. Path
params come from the route pattern.

### 6. Dev-mode drift check

In development, an opt-in middleware validates each JSON response against the
generated schema and logs the mismatches. It catches what the static type can't
see: an `asJson` override without a return annotation, or a hand-built hash
typed as `Record<string, unknown>`.

### Follow-ons

These build on the generated document and don't block the core rollout:

- **Typed fetch helpers for Stimulus** (`typed-fetch-helpers-for-stimulus`).
  Apps without an SPA get one typed function per operation, carrying the CSRF
  token, in place of hand-written `fetch`.
- **API docs on `/rails/info`** (`api-docs-in-rails-info`). A development-only
  API view beside Rails' route table, plus the raw document for external tools.

## Non-goals

- **No runtime change to serialization or rendering.** This doesn't restate
  `as_json`, and Rails fidelity is untouched.
- **No serializer DSL** (ActiveModel::Serializers, Blueprinter, zod schemas).
  The model and the call site are the source of truth.
- **No SPA client codegen in trails.** SPA consumers use `openapi-typescript` /
  `openapi-fetch`. The one exception is the small Stimulus helper module in
  Follow-ons, for apps that have no SPA toolchain.

## Alternatives considered

- **Record from test traffic (rspec-openapi style).** It needs no type work, but
  it's only as complete as the tests, it gets nullability and optional keys
  wrong, and it misses enums. It survives here as the drift check (§6), not
  as the source.
- **Schema-first serializers (zod / TypeBox per resource).** Exact and simple to
  emit, but it duplicates what the model already declares and adds an API
  Rails doesn't have.
- **Share TS types directly, tRPC-style, skipping OpenAPI.** It's lighter within
  one monorepo, but it ties the client to the server's source tree and gives
  non-TS consumers nothing. The plugin can emit a `.d.ts` as well if this turns
  out to be wanted.

## Rollout

Stories in dependency order:

1. `typed-serialized-type-algebra`: the types and type tests (draft PR exists).
2. `activerecord-asjson-returns-serialized` → `render-json-option-carries-body-type`
   (it types a bare model as `Serialized<M>`, so it needs `Base` wired).
   `permit-returns-literal-typed-params` runs in parallel with both.
3. `openapi-extract-routes-and-render-types` → `openapi-json-schema-converter`
   → `openapi-check-mode`.
4. `openapi-request-bodies-from-permit`.
5. `dev-mode-json-drift-check`.
6. `trailmap-frontend-typed-client`, the proving-ground consumer.
7. Follow-ons, any time after `openapi-json-schema-converter`:
   `typed-fetch-helpers-for-stimulus` and `api-docs-in-rails-info`.

## Verification

- Type tests (`expectTypeOf`) for every option shape at each layer.
- The plugin's output for a fixture app is snapshot-tested, and validated with an
  OpenAPI 3.1 validator.
- trailmap's frontend compiles against the generated client, with zero
  hand-written response types left, and the drift check reports zero mismatches
  over its request suite.

## Open questions

Each one has a recommendation, and names the story that absorbs the answer.

1. **Compile-time cost of recursive `include`.** Options: no cap; a fixed depth
   cap; a cap only past a measured threshold. **Recommendation:** measure
   first. `activerecord-asjson-returns-serialized` benchmarks `tsc` on
   trailmap with 1-, 3- and 5-deep includes. If 5-deep adds more than 10% to
   check time, cap recursion at 4 (deeper levels become
   `Record<string, unknown>`). The cap is an AC of that story, not the
   type-algebra one.
2. **`methods:` names and the `?` predicate rule.** _Resolved in the
   prototype:_ `methods:` accepts the member name, its underscored Rails
   spelling, or `foo?` for an `isFoo()` member, matching trails' runtime
   `camelized(n.endsWith("?") ? is_… : n)`. Absorbed by
   `typed-serialized-type-algebra` (AC 3).
3. **Converter.** Options: `ts-json-schema-generator`'s formatter; our own
   walker on the checker. **Recommendation:** the formatter, since it already
   handles unions, literals, intersections and recursion, and is a dev-only
   dependency of `trails-tsc`. A walker of our own is ~400 lines that
   duplicates it. `openapi-json-schema-converter` is sized on that basis, and
   the walker becomes a follow-up story only if the formatter can't key
   `$ref`s by options hash.
4. **Where routes come from.** Options: evaluate `config/routes.ts`;
   statically parse `draw`. **Recommendation:** evaluate it. Routes are code
   (`concerns`, loops, `scope` helpers), and static parsing would only
   approximate the route set the app serves. The route set's inspector already
   gives verb, path and endpoint. Absorbed by
   `openapi-extract-routes-and-render-types` (step 1).
5. **`bigint` columns.** _Resolved in the prototype:_ `JsonValue<bigint>` is
   `string`, matching `Numeric.asJson`
   (`packages/activesupport/lib/core-ext/object/json.ts:101`). Absorbed by
   `typed-serialized-type-algebra`.

## Changelog

- 2026-11-27: Draft.
- 2026-11-27: Review round 1. Split the plugin story into three, fixed the
  render and trailmap dep edges, gave every open question a recommendation, and
  recorded the prototype's Rails-fidelity fixes.
