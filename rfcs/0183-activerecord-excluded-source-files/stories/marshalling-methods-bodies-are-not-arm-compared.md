---
title: "activerecord: marshalling.ts Methods bodies get no skeleton row, so marshalLoad's reader arm is unreceipted"
status: draft
updated: 2026-10-06
rfc: "0183-activerecord-excluded-source-files"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/marshalling.ts` `marshalLoad` ports `ActiveRecord::Marshalling::Methods#marshal_load`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/marshalling.rb:43-56`). Between `build_from_database` and
`init_with_attributes` the trails body carries a loop Rails does not have: for each key of
`attributes_from_database` the record does not answer, it calls
`rbObjSingletonClass(this).defineAttributeMethod(name)`. That is the select-alias reader stand-in for
`method_missing` (CLAUDE.md § "Records are not Proxies"), moved there by trails#8472, and it is the same arm
`instantiateInstanceOf` in `persistence.ts` receipts with six `@inventedArm … — PERMANENT` tags
(`loop`, `if`, `keys`, `basicObjRespondTo`, `rbObjSingletonClass`, `defineAttributeMethod`).

`marshalLoad` cannot carry those receipts. `marshalling.rb` left the unported-files register in trails#8580 and
scores 4/4 in `parity:api`, but `scripts/api-compare/output/call-skeletons.json` holds no row for
`marshalling.rb#marshal_load` / `marshalling.ts#marshalLoad` (nor for `_marshal_dump_7_1`), so
`pnpm parity:api:arms:throws` rejects the tags with
`activerecord/marshalling.ts marshalLoad: loop (declaration not compared)`. The functions are module-private
and seated through `Methods.include({ _marshalDump71, marshalLoad })` on a `new Module()`, which is the likely
reason the skeleton writer skips them. So the invented arm is invisible to the arms report and unreceipted.

## Acceptance criteria

- [ ] The skeleton writer emits rows for `marshalling.ts#marshalLoad` and `#_marshalDump71` (bodies seated through `Module#include` of an object literal), or the module is reshaped so they are compared.
- [ ] `marshalLoad` carries the same six `@inventedArm … — PERMANENT` receipts as `instantiateInstanceOf`, and `pnpm parity:api:arms:throws` is green.
- [ ] `pnpm parity:api:arms:report` lists no unreceipted row for `marshalling.ts`.
