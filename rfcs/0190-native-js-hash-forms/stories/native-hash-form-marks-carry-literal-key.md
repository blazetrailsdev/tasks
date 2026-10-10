---
title: "Native hash form marks carry a literal key, and the argument gate compares it"
status: draft
updated: 2026-10-10
rfc: "0190-native-js-hash-forms"
cluster: gate
packages: []
deps: [native-hash-forms-credit-key-delete-merge]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
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

- [ ] The extractor's `@in` and `@delete` marks carry the key when it is a
      string literal or an identifier property name
      (`"public" in options`, `delete options.public`, `delete options["x"]`),
      in a spelling `splitCalls` keeps apart from the receiver tail.
- [ ] `parity:api:calls:args` compares that key with the Ruby call's first
      argument when it is a Symbol or String literal, using the camelCase
      translation the gate already applies to kwarg keys
      (`:only_path` ≡ `onlyPath`).
- [ ] A mismatch is a `shape` row, baselined and gated like any other; a
      computed key on either side is not compared.
- [ ] Tests: `options.delete(:public)` with `delete options.public` passes;
      with `delete options.private` is a `shape` row;
      `options.key?(:only_path)` with `"onlyPath" in options` passes.
- [ ] The doc paragraph at `enumerable-idioms.ts:254-260` is updated.
- [ ] No row added to cover an existing body: any new row is a real key
      mismatch, and is fixed in the port or filed.
