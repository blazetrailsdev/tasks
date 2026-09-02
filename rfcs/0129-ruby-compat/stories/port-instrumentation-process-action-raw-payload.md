---
title: "port-instrumentation-process-action-raw-payload"
status: ready
updated: 2026-09-02
rfc: "0129-ruby-compat"
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

`ActionController::Instrumentation#process_action`
(`vendor/rails/actionpack/lib/action_controller/metal/instrumentation.rb:61-90`)
builds one `raw_payload` and publishes it to BOTH notifications:

```ruby
raw_payload = {
  controller: self.class.name,
  action: action_name,
  request: request,
  params: request.filtered_parameters,
  headers: request.headers,
  format: request.format.ref,
  method: request.request_method,
  path: request.filtered_path
}

ActiveSupport::Notifications.instrument("start_processing.action_controller", raw_payload)
ActiveSupport::Notifications.instrument("process_action.action_controller", raw_payload) do |payload|
  ...
```

`packages/actionpack/src/action-controller/metal/instrumentation.ts:15` is not
that method. It is `instrumentAction(controllerName, actionName, request, fn,
notifier)`, a trails-shaped free function with **no callers anywhere in the
repo** (only its own `dist` declaration), and its payload carries five of the
eight keys: `controller`, `action`, `params` (added by PR 7377, because
`start_processing` reads it), `method` and `path`. Missing: `request`,
`headers`, and `format` is `request.format?.symbol` where Rails passes
`request.format.ref` (`Mime::Type#ref` is `symbol || to_s`,
`packages/actionpack/src/action-dispatch/http/mime-type.ts:197`). `method` and
`path` read `request.method` / `request.path` where Rails reads
`request.request_method` and `request.filtered_path` — the latter is the
FILTERED path, and `filteredPath` already exists at
`action-dispatch/http/filter-parameters.ts:78`.

A second divergence rides along: `Mime::Type#symbol` returns a Ruby Symbol, and
trails spells it as a bare `"html"` rather than the repo's colon convention
(`":html"`). `LogSubscriber#start_processing` branches on
`format.is_a?(Symbol)` (`log_subscriber.rb:19`), so with the bare spelling the
`to_s.upcase` arm never fires for a payload this file produces.

## Acceptance criteria

- The port has a counterpart for `Instrumentation#process_action` at the Rails
  name, on the Rails receiver, building `raw_payload` with all eight keys in
  the Rails order and publishing it to both notifications — or, if that seat
  cannot exist yet, `instrumentAction` is deleted as the callerless invention
  it is and the story says so.
- `format` carries what `Mime::Type#ref` answers, spelled so that
  `start_processing`'s `is_a?(Symbol)` arm fires as it does in Rails — which
  likely means converging `MimeType#symbol` to the colon convention
  (`docs/ruby-ts-conventions.md`).
- `path` is `filteredPath`, `method` is `requestMethod`.
- `pnpm parity:api:calls` shows no new rows; actionpack suite green.
