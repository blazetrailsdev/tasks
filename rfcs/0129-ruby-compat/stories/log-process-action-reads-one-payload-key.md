---
title: "log_process_action reads two payload keys and formats without to_f"
status: done
updated: 2026-09-05
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: 22
pr: 7501
claim: "2026-09-04T23:26:00Z"
assignee: "io-write-must-transcode-to-utf8-in-text-mode"
blocked-by: null
closed-reason: null
---

## Context

`ActionController::Base.log_process_action`
(`vendor/rails/actionpack/lib/action_controller/metal/instrumentation.rb:113-117`)
is three lines:

```ruby
def log_process_action(payload) # :nodoc:
  messages, view_runtime = [], payload[:view_runtime]
  messages << ("Views: %.1fms" % view_runtime.to_f) if view_runtime
  messages
end
```

`packages/actionpack/src/action-controller/metal/instrumentation.ts:122-129`
diverges in three ways, all surfaced while wiring it into
`LogSubscriber#process_action` (PR #7437):

- **It reads two payload keys.** `payload.view_runtime ?? payload.viewRuntime`
  hedges between the Rails wire key and a camelCase invention. Rails reads
  `payload[:view_runtime]` and nothing else; the second spelling comes from
  `appendInfoToPayload` (`instrumentation.ts:114-120`) writing
  `payload.viewRuntime` where Rails writes `payload[:view_runtime]`
  (`instrumentation.rb:105-107`). One of the two writers is wrong, not both
  readers.
- **The guard is a nullish check, not Ruby truthiness.** `if view_runtime`
  is false only for `nil`/`false`, so a stored `0` still appends `Views:
0.0ms`; the port's `!== undefined && !== null` happens to agree here, but
  it is spelled as a JS guard rather than the ported one.
- **The format is `toFixed`, not `%.1f` over `to_f`.** Rails coerces with
  `to_f` first, so a String `view_runtime` formats rather than producing
  `NaN`.

## Converged shape

One payload key (`view_runtime`), written by `appendInfoToPayload` at that
same key, with Ruby's truthiness guard and a `to_f` coercion before the
one-decimal format. `messages` keeps the Rails local name.

## Acceptance criteria

- `logProcessAction` reads `payload.view_runtime` only, and
  `appendInfoToPayload` writes that key.
- A `view_runtime` that arrives as a String still formats, per `to_f`.
- `pnpm parity:api:calls` / `:args` show no new rows; actionpack green.
