---
title: "api-compare: class owners and shared bodies pair skeletons by owner"
status: draft
updated: 2026-10-03
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`skeletonsOfOwner` (`scripts/api-compare/compare.ts`) reads a pair's skeleton by owner only where one
file holds the name as several module or top-level bodies (`validations/with.ts`'s `ClassMethods` and
instance `validatesWith`). Two populations still read by (file, name), so `tsSkeletons.length === 1`
fails and the pair is not compared at all:

- **Class owners.** Several classes of one file declaring the name: the six `expand`s and three
  `build`s in `activesupport/src/callbacks.ts`, the constructors in
  `actionpack/src/action-controller/metal/strong-parameters.ts`, a class static beside the top-level
  function (`globalid/src/uri/gid.ts` `validateApp`).
- **Shared bodies.** A namespace entity re-lists the file's top-level functions, so one declaration
  arrives under two owners (`Inflector` and `""` for `activesupport/src/inflector.ts` `camelize`,
  `Transliterate` and `""` for `transliterate.ts` `transliterate`). `tsSkeletonBodies` keeps the body
  once in the owner map, but the by-name list still holds it twice.

Measured with both read by owner: 7353 to 8735 compared pairs, 1759 to 2094 mismatched, and
`parity:api:arms:throws` reds on six rows:

- `activesupport/callbacks.ts#build`: `Callback.build`'s String-filter `ArgumentError`
  (`vendor/rails/v8.0.2/activesupport/lib/active_support/callbacks.rb:231-237`) is raised from
  `CallTemplate.build` instead.
- `activesupport/callbacks.ts#expand`: one Rails `expand` carries `if`, `throw:ArgumentError`.
- `actioncontroller/metal/strong-parameters.ts#constructor`: `Parameters#initialize`'s
  `InvalidParameterKey` loop
  (`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/strong_parameters.rb:287-290`).
- `globalid/uri/gid.ts#validateApp`: the class static is a one-step delegate to the top-level
  function, which holds the `rescue` (`vendor/globalid/*/lib/global_id/uri/gid.rb:50`).
- `activesupport/transliterate.ts#transliterate`: the encoding guard
  (`vendor/rails/v8.0.2/activesupport/lib/active_support/inflector/transliterate.rb:66`). A JS string
  carries no encoding tag.
- `activesupport/inflector.ts#camelize`: `String#camelize`'s
  `raise ArgumentError, "Invalid option, use either :upper or :lower."`
  (`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/string/inflections.rb:101-110`),
  folded onto `Inflector.camelize`'s body by `RUBY_FILE_TS_OVERRIDES`.

## Acceptance criteria

- [ ] A class owner and a shared body each pair by owner, with tests in `compare.test.ts`.
- [ ] Each missing-throw row above is converged at its raise site, or shown to be a pairing artefact
      and separated in the comparer, before the widening lands. `arm-throw-mark.json` is not raised.
- [ ] The newly measured invented-arm rows are filed against their package's parity RFC.
