---
title: "Parameters#permitted? is ported as a getter, not isPermitted"
status: draft
updated: 2026-10-06
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: ["actionpack", "actionview", "activemodel"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionController::Parameters#permitted?`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/strong_parameters.rb:445-447`)
is a public predicate. trails ports it as an `@internal` getter,
`get permitted(): boolean`
(`packages/actionpack/src/action-controller/metal/strong-parameters.ts:171`),
where the predicate rule spells `foo?` as `isFoo`. About 96 call sites read
`.permitted`, most of them tests, plus
`packages/actionpack/src/abstract-controller/rendering.ts:84-85`,
`packages/actionview/src/rendering.ts:219`,
`packages/activemodel/src/forbidden-attributes-protection.ts:32` and
`strong-parameters.ts:1158`.

`permitted_params_test.rb:7,11` calls `params[:person].permitted?`; its port
`packages/actionpack/src/action-controller/controller/permitted-params.test.ts`
reads `.permitted` until this lands.

## Acceptance criteria

- [ ] `Parameters#isPermitted()` is the public port of `permitted?`; the
      `permitted` getter is gone.
- [ ] Every caller, `permitted-params.test.ts` included, calls `isPermitted()`;
      the duck-typed probes use `rbObjRespondTo(x, "isPermitted")`.
- [ ] `pnpm parity:api:predicates` is green and tightened.
