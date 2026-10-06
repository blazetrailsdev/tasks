---
title: "Parameters holds @parameters as a plain object, not HashWithIndifferentAccess"
status: ready
updated: 2026-10-06
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
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

`ActionController::Parameters#initialize` stores
`@parameters = parameters.with_indifferent_access`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/strong_parameters.rb:293`),
and `init_with` (`:1068-1084`) calls `coder.map.with_indifferent_access` in its
two legacy arms.

`packages/actionpack/src/action-controller/metal/strong-parameters.ts` holds
`_data` as a plain `Record<string, unknown>`, and `initWith` copies the coder
with a spread. So `YAML.dump(params)` writes `parameters:` as an untagged map,
where Rails writes
`parameters: !ruby/hash:ActiveSupport::HashWithIndifferentAccess`.

`vendor/rails/v8.0.2/actionpack/test/controller/parameters/serialization_test.rb:20`
asserts
`/parameters: !ruby\/hash:ActiveSupport::HashWithIndifferentAccess\n\s+key: :value/`.
`packages/actionpack/src/action-controller/controller/parameters/serialization.test.ts`
ports it as `/parameters:\n\s+key: :value/`.

## Acceptance criteria

- [ ] `Parameters` holds `@parameters` as activesupport's
      `HashWithIndifferentAccess`, built by `withIndifferentAccess` in the
      constructor and in `initWith`'s two legacy arms.
- [ ] `serialization.test.ts`'s "YAML serialization" asserts Rails' regex
      verbatim.
