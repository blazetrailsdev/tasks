---
title: "Port the Arguments GlobalID arm over @blazetrails/globalid, with gid_job and rescue_test.rb"
status: draft
updated: 2026-09-29
rfc: "0000-activejob-package-port"
cluster: null
packages: ["activejob", "globalid"]
deps: ["port-activejob-arguments", "port-activejob-exceptions-retry-and-discard"]
deps-rfc: []
est-loc: 350
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

This finishes `vendor/rails/v8.0.2/activejob/lib/active_job/arguments.rb` (RFC
"GlobalID arguments"). `port-activejob-arguments` left out these four members,
and no receipt stands in for them:

- `serialize_argument`'s `when GlobalID::Identification` →
  `convert_to_global_id_hash(argument)` (`:85-86`), which sits **before**
  `when Array` / `when Hash`. Keep that order;
- `deserialize_argument`'s `if serialized_global_id?(argument)` →
  `deserialize_global_id argument` (`:117-118`);
- `serialized_global_id?` (`:129-131`: `hash.size == 1 &&
hash.include?(GLOBALID_KEY)`) and `deserialize_global_id` (`:133-135`),
  which does `GlobalID::Locator.locate hash[GLOBALID_KEY]` and is **awaited**
  (`packages/globalid/src/locator.ts:161`);
- `convert_to_global_id_hash` (`:190-196`), which rescues
  `URI::GID::MissingModelIdError` into `SerializationError, "Unable to
serialize #{argument.class} without an id. (Maybe you forgot to call
save?)"`. The rescue class is globalid's
  `MissingModelIdError` (`packages/globalid/src/uri/gid.ts:44`).

`when GlobalID::Identification` is a module-inclusion test. globalid ports
`Identification` as a mixin object
(`packages/globalid/src/identification.ts:27`). Use whatever membership
check globalid already exposes for "includes Identification", or add one there
under that package's rules, and not a duck-typed `toGlobalId` probe in
activejob. `DeserializationError#initialize` (`:11-14`) reads `$!` for its
message and backtrace. Port it through the error that
`deserialize_global_id` rescued, so that `e.cause` is the locator's
`Person::RecordNotFound`, as `rescue_test.rb:28` asserts.

Fixtures (RFC "Canonical job fixtures"): `models/person.ts`
(`test/models/person.rb`, 22 lines, `include GlobalID::Identification`, with
`Person::RecordNotFound` on id 404), `jobs/gid-job.ts`, `jobs/rescue-job.ts`
(37 lines, including `retry_job`, hence the exceptions dep), and
`jobs/raising-job.ts`. `GlobalID.app = "aj"` is already set in the lane setup
(`test/helper.rb:7`).

Tests:

- `test/cases/argument_serialization_test.rb`: `"does not serialize #{arg.class}"`
  (`:83-93`, over `Object.new`, a `GlobalID` and `Class.new`), `"should convert
records to Global IDs"` (`:95-97`), `"should keep Global IDs strings as they
are"` (`:99-101`), and `"raises a friendly SerializationError for records
without ids"` (`:256-261`);
- `test/cases/job_serialization_test.rb` `"serialize job with gid"` (`:15-18`);
- `test/cases/rescue_test.rb`: all 5;
- `test/cases/exceptions_test.rb` `"successfully retry job throwing
DeserializationError"` (`:308-311`), which the exceptions story left for here.

## Acceptance criteria

- [ ] `arguments.rb` reads complete in `parity:api`, with no
      `@missingRailsCall` for the GlobalID members.
- [ ] The 10 Rails cases above pass under their Rails names.
