---
title: "wire-parameter-encoding-onto-metal-action-encoding-template"
status: draft
updated: 2026-09-11
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in review of trails#7706, which wired
`CustomParamEncoder.actionEncodingTemplate` into `Request#GET` / `#POST`.

- Rails `ActionController::ParameterEncoding::ClassMethods`
  (`actionpack/lib/action_controller/metal/parameter_encoding.rb:11-22`) is
  extended onto every controller. `inherited` calls `setup_param_encode`, and
  `action_encoding_template(action)` reads `@_parameter_encodings[action.to_s]`
  (a Hash whose `skip_parameter_encoding` default is `ASCII_8BIT`).
- trails' `Metal.actionEncodingTemplate` (`packages/actionpack/src/action-controller/metal.ts:159`)
  is a stub that always returns `false`. `ParameterEncodingRegistry`
  (`packages/actionpack/src/action-controller/metal/parameter-encoding.ts`) is a
  standalone class that nothing wires onto a controller's static side, and it
  stores a `Map` with a `"*"` sentinel rather than a Hash with a default.
- `request/utils.ts#CustomParamEncoder.actionEncodingTemplate` casts the
  result to `EncodingTemplate` (a `Record`). `ParamBuilder#storeNestedParam`
  reads `encodingTemplate[k]`, which is always `undefined` on a `Map`. So the
  encoding-template path is inert for every real controller.

## Acceptance criteria

- [ ] `ParameterEncoding` class methods (`setup_param_encode`,
      `action_encoding_template`, `param_encoding`, `skip_parameter_encoding`)
      are extended onto `Metal` the way Rails does, replacing the `false` stub.
- [ ] The per-action template is a Record that answers `template[k]` the way
      Rails' Hash default does for `skip_parameter_encoding`.
- [ ] A request test exercises `param_encoding` end to end through `GET`.
