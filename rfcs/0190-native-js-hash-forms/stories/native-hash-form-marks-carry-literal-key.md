---
title: "Native hash form marks carry a literal key, and the argument gate compares it"
status: in-progress
updated: 2026-10-11
rfc: "0190-native-js-hash-forms"
cluster: gate
packages: []
deps: [native-hash-forms-credit-key-delete-merge]
deps-rfc: []
est-loc: 300
priority: null
pr: trails#8782
claim: "2026-10-11T15:39:43Z"
assignee: "native-hash-form-marks-carry-literal-key"
blocked-by: null
closed-reason: null
---

## Context

`NATIVE_FORM_ANALOGUES`' own doc says "A row drops the Ruby call from
significance, so nothing pairs its argument list by name"
(`scripts/api-compare/enumerable-idioms.ts:254-260`). For the existing rows
that costs little: `.length` has no argument. For the hash forms it costs the
key. Today `hashDelete(options, "public")` is paired with
`options.delete(:public)` by `parity:api:calls:args` (`refKeysEqual`,
`scripts/api-compare/call-args.ts:256-263`), so a port that deletes the wrong
key is red. After `native-hash-forms-credit-key-delete-merge`,
`delete options.public` credits the call and the key is unchecked.

The table already has a precedent for carrying one argument through a form:
`sleep`'s `argument: { tsCall, rubyIndex, tsIndex, factor }`
(`enumerable-idioms.ts:275-282`, read at `call-args.ts:982` and `:1431`).

This is the main risk the RFC names under § "Risks". It should land before
the bulk of the substitution stories, though they do not depend on it.

## Acceptance criteria

- [ ] The TS extractor records each `in` / `Object.hasOwn` / `delete` form as
      a site of its own in the call-argument stream (`@in`, `@delete`), with
      the key as argument 1 and the receiver's trailing name as `recv`
      (`"public" in options`, `delete options.public`, `delete options["x"]`).
      The argument gate reads that stream and not the call set, so the
      call-set marks (`@in:<recv>`, `@delete:<recv>`) stay as they are.
- [ ] `parity:api:calls:args` compares that key with the Ruby call's first
      argument when it is a Symbol or String literal, using the camelCase
      translation the gate already applies to kwarg keys
      (`:only_path` ≡ `onlyPath`).
- [ ] A String literal key is compared verbatim; only a Symbol is camelized,
      and a Symbol also matches its colon spelling (`":params"`).
- [ ] A Ruby site on a local receiver (`weak`) is compared where the body has
      a form site on that receiver.
- [ ] A mismatch is a `shape` row, baselined and gated like any other; a
      computed key on either side is not compared.
- [ ] Tests: `options.delete(:public)` with `delete options.public` passes;
      with `delete options.private` is a `shape` row;
      `options.key?(:only_path)` with `"onlyPath" in options` passes.
- [ ] The doc paragraph at `enumerable-idioms.ts:254-260` is updated.
- [ ] No row added to cover an existing body: any new row is a real key
      mismatch, and is fixed in the port or filed.
