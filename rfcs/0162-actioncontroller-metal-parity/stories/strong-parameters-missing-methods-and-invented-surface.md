---
title: "Port Parameters' missing members and remove its invented ones"
status: draft
updated: 2026-09-27
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: ["actionpack"]
deps: ["strong-parameters-fetch-raises-keyerror-not-parameter-missing"]
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

`pnpm parity:api --package actioncontroller` reports `metal/strong_parameters.rb`
at 104/111. Missing, in
`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/strong_parameters.rb`:

- `as_json`, delegated to `@parameters` (`:251`)
- `alias :required :require` (`:529`)
- `init_with(coder)` (`:1068`) and `encode_with(coder)` (`:1086`), the YAML
  round trip
- `initialize_copy(source)` (`:1434`), which deep-dups `@parameters` on `dup`
- `always_permitted_parameters` is `action-controller-config-seats-onto-activesupport-primitives`

`pnpm parity:api:extra` lists four novel methods on
`packages/actionpack/src/action-controller/metal/strong-parameters.ts`:
`permitAll` (`:139`), `has` (`:196`), `reversemerge` (`:335`) and
`transform` (`:339`), and six moved (`create`, `extract`, `get`, `length`,
`set`, `size`). Rails spells these `permit!`, `has_key?` / `key?` / `include?`,
`reverse_merge`, and `transform_values` / `transform_keys`.

## Acceptance criteria

- The five members exist with Rails' bodies. `initializeCopy` is what `dup`
  calls, so a duped `Parameters` does not share nested hashes.
- The four novel methods are removed and their call sites use the Rails names;
  each moved name is removed or relocated to the file mirroring its `.rb`.
- `pnpm parity:api` reports `metal/strong_parameters.rb` 111/111 and
  `parity:api:extra` lists no novel name on the file.
