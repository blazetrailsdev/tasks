---
title: "Teach the Ruby API extractor attr_internal and its reader/writer forms"
status: draft
updated: 2026-10-05
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: []
deps: []
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

`scripts/api-compare/extract-ruby-api.rb` models `attr_reader` /
`attr_writer` / `attr_accessor` (`:985-989`), `class_attribute` and the
`mattr_*` / `cattr_*` family (`:1001-1008`), but not ActiveSupport's
`attr_internal`, `attr_internal_reader`, `attr_internal_writer` and
`attr_internal_accessor`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/module/attr_internal.rb`).
So the names they define are absent from `rails-api.json`, and the TS member
porting one is scored `novel` by `pnpm parity:api:extra`.

Found moving `viewRuntime` from `action-controller/base.ts` onto
`action-controller/metal/instrumentation.ts`, where Rails declares it
(`attr_internal :view_runtime`,
`actionpack/lib/action_controller/metal/instrumentation.rb:21`): it is now in
the Rails file and still listed as novel there.

Every Rails site:

- `actionpack/lib/abstract_controller/base.rb:40,44,48`: `response_body`,
  `action_name`, `formats`
- `actionpack/lib/action_controller/metal.rb:164,170`: `request`,
  `attr_internal_reader :response`
- `actionpack/lib/action_controller/metal/instrumentation.rb:21`: `view_runtime`
- `actionview/lib/action_view/base.rb:219`: `config`, `assigns`
- `actionview/lib/action_view/layouts.rb:359`:
  `attr_internal_writer :action_has_layout`
- `actionview/lib/action_view/rendering.rb:30`:
  `attr_internal_reader :rendered_format`
- `actionview/lib/action_view/helpers/controller_helper.rb:12`: `controller`,
  `request`
- `actionview/lib/action_view/helpers/form_helper.rb:122`: `default_form_builder`
- `actionmailer/lib/action_mailer/base.rb:636`: `message`
- `activerecord/lib/active_record/railties/controller_runtime.rb:32`: `db_runtime`

## Acceptance criteria

- The extractor records the reader and/or writer each `attr_internal*` macro
  defines, public like `attr_accessor`'s.
- `pnpm parity:api:extra --package actioncontroller` no longer lists
  `viewRuntime` under `metal/instrumentation.ts`.
- Any extra-surface, call or pin mark the new rows move is tightened in the
  same PR, and no mark is widened.
