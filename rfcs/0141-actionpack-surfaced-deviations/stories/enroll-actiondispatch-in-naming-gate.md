---
title: "enroll-actiondispatch-in-naming-gate"
status: ready
updated: 2026-10-19
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps:
  - response-to-a-passes-rack-headers-to-hash
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

`enroll-actionpack-in-naming-gate` enrolled abstractcontroller (actioncontroller
was already in) and receipted/renamed every actiondispatch naming row but one,
so actiondispatch is still out of `NAMING_ENROLLED_PACKAGES`
(`scripts/api-compare/lint-call-args.ts`). The remaining convergeable row:

actiondispatch middleware/public-exceptions.ts render render_format (publicSend)

Rails' `PublicExceptions#render`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/public_exceptions.rb:39-46`)
builds `format = "to_#{content_type.to_sym}"` and calls
`body.public_send(format)` when `body.respond_to?(format)`. trails branches on
`:json` / `:xml` and calls `JSON.stringify` and a module-local `toXml` /
`escapeXml` that Rails does not have. Converging needs the error body to answer
Hash `to_json` / `to_xml` (ActiveSupport core-ext), reached through
`rbObjRespondTo` / `rbFPublicSend`.

## Acceptance criteria

- `render` mirrors Rails' body: the `format` local, the `respond_to?` guard and
  `public_send`; the local `toXml` / `escapeXml` are gone.
- `actiondispatch` joins `NAMING_ENROLLED_PACKAGES` and
  `pnpm parity:api:calls:args` is green.
