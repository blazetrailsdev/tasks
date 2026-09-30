---
title: "TSE template bodies cannot name top-level constants (I18n) as Ruby templates do"
status: in-progress
updated: 2026-09-30
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 5
pr: trails#8266
claim: "2026-09-30T09:49:52Z"
assignee: "actionview-rendering-methods-have-no-super-chain"
blocked-by: null
closed-reason: null
---

## Context

A Rails template is compiled into a method on the view class
(`vendor/rails/v8.0.2/actionview/lib/action_view/template.rb`, `compile` / `compiled_source`),
so Ruby constant lookup resolves any top-level constant in the template body.
`vendor/rails/v8.0.2/actionview/test/fixtures/layouts/streaming_with_locale.erb` and
`test/fixtures/test/streaming_with_locale.erb` write `<%= I18n.locale %>` with nothing passed in.

trails' compiled source (`packages/actionview/src/template.ts`, `compiledSource`, the
`with (this) { with (__yield) { with (localAssigns) { ... } } }` wrapper) exposes only view
members, the yield getter and locals. Anything else must be a JS global, so `I18n` does not
resolve. The ported `streaming_render_test.rb`
(`packages/actionview/src/template/streaming-render.test.ts`, trails#8235) had to pass
`locals: { I18n }` on every render to reach `FiberedWithLocaleTest`.

## Converged shape

Template bodies resolve Rails top-level constants the way a Ruby method body does: through the
`TopLevel` namespace seat (`activesupport/src/namespaces.ts`, CLAUDE.md § "Call-time constant
resolution"), added as an outer `with` scope in `compiledSource`. The defining package seats
the constant: `I18n` by activesupport, `ActiveSupport` / `ActionView` / `ActionDispatch` by
theirs.

## Acceptance criteria

- `<%= I18n.locale() %>` renders in a TSE template with no local passed.
- `streaming-render.test.ts` drops its `locals: { I18n }` and still passes, including
  "render with streaming and locale".
