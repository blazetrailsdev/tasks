---
title: "ActionController::Parameters: port hook_into_yaml_loading, init_with and encode_with"
status: draft
updated: 2026-09-29
rfc: "0170-psych-in-ruby-compat"
cluster: fidelity
packages: ["actionpack"]
deps: ["psych-load-tags-dump-tags-and-domain-types"]
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/strong_parameters.rb:1059-1066`
(`hook_into_yaml_loading` writes `YAML.load_tags["!ruby/hash-with-ivars:ActionController::Parameters"]`
and `["!ruby/hash:ActionController::Parameters"]`, called at class-body
end), `:1068-1084` `init_with` (the legacy `!ruby/hash:` and
`hash-with-ivars` shapes) and `:1086-1088` `encode_with`. trails'
`static hookIntoYamlLoading(): void {}`
(`packages/actionpack/src/action-controller/metal/strong-parameters.ts:115`) is
an empty body, and `initWith` / `encodeWith` are absent.

## Acceptance criteria

- [ ] `hookIntoYamlLoading` writes both `Psych.loadTags` entries and is called
      at module load. That needs no backend (RFC §3).
- [ ] `initWith` / `encodeWith` are ported line for line.
- [ ] The `serialization.test.ts` YAML cases in
      `action-controller/controller/parameters/` (mirroring
      `vendor/rails/v8.0.2/actionpack/test/controller/parameters/serialization_test.rb`) run
      unskipped, or are re-parked `BLOCKED:` on `psych-scalar-and-tag-visitors`
      for the `!ruby/hash:` revive arm.

## Verification

`pnpm vitest run packages/actionpack/src/action-controller/controller/parameters/serialization.test.ts`.
