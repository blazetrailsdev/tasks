---
title: "activerecord: port Railties::ControllerRuntime (un-exclude railties/controller_runtime.rb)"
status: done
updated: 2026-10-06
rfc: "0183-activerecord-excluded-source-files"
cluster: excluded-files
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#8581
claim: "2026-10-06T14:54:01Z"
assignee: "activerecord-port-railties-controller-runtime"
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

## Verification

```bash
pnpm build && pnpm parity:api && pnpm parity:skips:stories && pnpm parity:api:calls
```
