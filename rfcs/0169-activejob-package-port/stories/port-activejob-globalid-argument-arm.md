---
title: "Port the Arguments GlobalID arm over @blazetrails/globalid"
status: draft
updated: 2026-09-29
rfc: "0169-activejob-package-port"
cluster: null
packages: ["activejob", "globalid"]
deps: ["port-activejob-arguments"]
deps-rfc: []
est-loc: 250
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

This finishes `vendor/rails/v8.0.2/activejob/lib/active_job/arguments.rb` (RFC "GlobalID arguments"):

- `serialize_argument`'s `when GlobalID::Identification` →
  `convert_to_global_id_hash(argument)` (`:85-86`), which sits **before**
  `when Array` / `when Hash`; keep the order;
- `deserialize_argument`'s `if serialized_global_id?(argument)` →
  `deserialize_global_id argument` (`:117-118`);
- `serialized_global_id?` (`:129-131`) and `deserialize_global_id` (`:133-135`),
  which awaits `GlobalID::Locator.locate` (`packages/globalid/src/locator.ts:161`);
- `convert_to_global_id_hash` (`:190-195`), which rescues
  `URI::GID::MissingModelIdError` (`packages/globalid/src/uri/gid.ts:44`) into
  `SerializationError, "Unable to serialize #{argument.class} without an id.
(Maybe you forgot to call save?)"`.

The fixture model `test/models/person.rb` lands with
`port-activejob-test-fixture-jobs`; the Rails cases that go through this arm
are listed in `port-activejob-argument-serialization-test`,
`port-activejob-serialization-tests` and `port-activejob-rescue-and-instrumentation-tests`.

## Fidelity traps (predicted at authoring)

- [ ] **Module inclusion test.** `when GlobalID::Identification` asks whether the class includes the module; globalid ports `Identification` as a mixin object (`packages/globalid/src/identification.ts:27`). Use (or add, in globalid) a membership check, not a probe.
- [ ] **`hash.size == 1 && hash.include?(GLOBALID_KEY)`** — exactly one key. A hash with `_aj_globalid` plus another key is a reserved-key error on the serialize side and a plain hash on this side.
- [ ] **`$!` → `cause`.** A locator failure (`Person::RecordNotFound`) becomes `DeserializationError` whose `cause` is the original; `rescue_test.rb:28` asserts `e.cause.class.name`.
- [ ] **`argument.class` in the message** is the Ruby name (`Person`), via the class-name reader.

## Acceptance criteria

- [ ] `arguments.rb` reads complete in `parity:api` with no `@missingRailsCall` for the GlobalID members.
- [ ] A `.trails.test.ts` round-trips an `Identification`-including object through `gid://…` and the locator.

## Definition of done

A duck-typed `typeof arg.toGlobalId === "function"` check in activejob does not close this story.
