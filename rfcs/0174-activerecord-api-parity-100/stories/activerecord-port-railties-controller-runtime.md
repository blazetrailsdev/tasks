---
title: "activerecord: port Railties::ControllerRuntime (un-exclude railties/controller_runtime.rb)"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: excluded-files
packages: ["activerecord"]
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

`railties/controller_runtime.rb` is excluded: "Railties ActionController integration … Trails has not
ported Railties". trails now ports both actionpack and trailties (RFC 0171 thor, RFC 0160-0167
actionpack), so the reason is stale. `vendor/rails/v8.0.2/activerecord/lib/active_record/railties/controller_runtime.rb` adds
`db_runtime` / `append_info_to_payload` / `cleanup_view_runtime` to controllers, and
`controller_runtime_test.rb` pins it.

## Acceptance criteria

- [ ] `ControllerRuntime` is ported (in the activerecord file the conventions map it to) and included into ActionController::Base by trailties' activerecord railtie as `active_record/railtie.rb` does.
- [ ] The unported entry is deleted; `controller_runtime_test.rb` is enrolled and green.
