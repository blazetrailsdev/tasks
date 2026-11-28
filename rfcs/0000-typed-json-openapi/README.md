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
clusters:
  - typed-serialization
  - openapi
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
- `JsonValue<V>` mirrors the encoder's dispatch: primitives pass through,
  `undefined` becomes `null`, a `toJSON()` or `asJson()` return type wins
  (`Date` and `TimeWithZone` become `string`), arrays and plain objects map
  element-wise.
- `Serialized<M, O, B>` mirrors `serializable_hash`'s branches
  (`vendor/rails/v8.0.5.2/activemodel/lib/active_model/serialization.rb`):
  `only` wins over `except`, `methods` adds keys under their Rails name with the
  camelized member's return type (`full_name` → `fullName()`, awaited), and
  `include` adds each association serialized recursively with its own options.

The draft prototype (trails PR linked from the first story) lands this with type
tests and changes no runtime code.

### 2. `asJson` / `serializableHash` return `Serialized`

`ActiveRecord::Base#asJson` and `serializableHash` gain the signature

```ts
asJson<const O extends TypedSerializeOptions<this, Base>>(options?: O): Serialized<this, O, Base>;
```

The TS 5 `const` type parameter keeps `{ only: ["id", "title"] }` literal
without `as const` at the call site. The `SerializableHash` dual sync/thenable
shape (activemodel CLAUDE.md, "Serialization's dual sync/async hash") is kept:
the return becomes `Serialized<…> & PromiseLike<Serialized<…>>`. `root:`
wraps the result in `{ [root]: … }` when it's a string literal and is otherwise
left untyped.

### 3. `render({ json })` carries the body type

`RenderOptions` gets a `json` overload whose type parameter is the body, and
`status` stays the typed `SYMBOL_TO_STATUS_CODE` key. This changes types only.
A model or relation passed as `json:` (Rails calls `to_json` on it) is typed as
`Serialized<M>`, its no-option `asJson`.

### 4. `trails-tsc` `openapi` plugin

The plugin runs over the program `trails-tsc` already builds, beside `tse`:

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

`ts-json-schema-generator`'s type formatter is the candidate converter. Using it
is an open question (dependency weight against writing ~400 lines of our own).

### 5. Request bodies from strong params

`params.require("post").permit("title", "body")` gets a literal-typed return
the same way, and the plugin emits it as the action's `requestBody`. Path
params come from the route pattern.

### 6. Dev-mode drift check

In development, an opt-in middleware validates each JSON response against the
generated schema and logs the mismatches. It catches what the static type can't
see: an `asJson` override without a return annotation, or a hand-built hash
typed as `Record<string, unknown>`.

## Non-goals

- **No runtime change to serialization or rendering.** This doesn't restate
  `as_json`, and Rails fidelity is untouched.
- **No serializer DSL** (ActiveModel::Serializers, Blueprinter, zod schemas).
  The model and the call site are the source of truth.
- **No client codegen in trails.** Consumers use `openapi-typescript` /
  `openapi-fetch`. trails only emits the document.

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
2. `activerecord-asjson-returns-serialized` and
   `render-json-option-carries-body-type`, in parallel.
3. `trails-tsc-openapi-plugin`.
4. `permit-returns-literal-typed-params` → `openapi-request-bodies-from-permit`.
5. `dev-mode-json-drift-check`.
6. `trailmap-frontend-typed-client`, the proving-ground consumer.

## Verification

- Type tests (`expectTypeOf`) for every option shape at each layer.
- The plugin's output for a fixture app is snapshot-tested, and validated with an
  OpenAPI 3.1 validator.
- trailmap's frontend compiles against the generated client, and the drift check
  is clean on its request suite.

## Open questions

1. **Compile-time cost.** Recursive `Serialized` over deep `include` trees may
   slow the checker. Should depth be capped (e.g. 4), and at what measured cost?
2. **`methods:` names.** The prototype maps Rails names by camelizing them, and
   doesn't handle the `?` → `is_` predicate rule yet. Should it?
3. **Converter.** Use `ts-json-schema-generator`, or write our own on the checker?
4. **Where routes come from.** Evaluate `config/routes.ts` at build time
   (it's code), or statically parse the `draw` block?
5. **Large integer columns.** A `bigint` JSON-encodes as a string in Rails
   (`ActiveSupport::JSON`); should `JsonValue` map it to `string`?

## Changelog

- 2026-11-27: Draft.
