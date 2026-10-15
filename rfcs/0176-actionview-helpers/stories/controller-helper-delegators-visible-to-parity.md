---
title: "ControllerHelper: declare the ten controller delegators on the Module"
status: ready
updated: 2026-10-15
rfc: "0176-actionview-helpers"
cluster: null
packages: ["actionview"]
deps: []
deps-rfc: []
est-loc: 80
priority: 14
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`controller_helper.rb` is 2/12: `request_forgery_protection_token`, `params`, `session`, `cookies`, `response`, `headers`, `flash`, `action_name`, `controller_name`, `controller_path` report missing. Rails defines them with `delegate ... to: :controller`; trails installs them dynamically from `CONTROLLER_DELEGATES` via `installControllerDelegates` (`packages/actionview/src/helpers/controller-helper.ts`), which parity cannot see.

## Acceptance criteria

- [ ] The ten delegators are declared on the `ControllerHelper` Module (or the delegation is expressed in a form the api-compare extractor credits) without changing behavior.
- [ ] parity `controller_helper.rb` 0 missing; the related `helpers.rb` rows clear.
