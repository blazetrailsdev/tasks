---
title: "Port ActionController::LogSubscriber#process_action's additions, exception-status and GC branches"
status: done
updated: 2026-09-03
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 7437
claim: "2026-09-03T11:20:50Z"
assignee: "resweep-rfc-0104-story-context-against-main"
blocked-by: null
closed-reason: null
---

## Context

`ActionController::LogSubscriber#process_action`
(`vendor/rails/actionpack/lib/action_controller/log_subscriber.rb:26-44`) builds
its line inside an `info do ... end` block:

```ruby
def process_action(event)
  info do
    payload = event.payload
    additions = ActionController::Base.log_process_action(payload)
    status = payload[:status]

    if status.nil? && (exception_class_name = payload[:exception]&.first)
      status = ActionDispatch::ExceptionWrapper.status_code_for_exception(exception_class_name)
    end

    additions << "GC: #{event.gc_time.round(1)}ms"

    message = +"Completed #{status} #{Rack::Utils::HTTP_STATUS_CODES[status]} in #{event.duration.round}ms" \
               " (#{additions.join(" | ")})"
    message << "\n\n" if defined?(Rails.env) && Rails.env.development?

    message
  end
end
subscribe_log_level :process_action, :info
```

`packages/actionpack/src/action-controller/log-subscriber.ts` ports five of
those lines as one eager string:

```ts
processAction(event: Event): void {
  const { status } = event.payload as { status: number | string };
  const statusText = typeof status === "number" ? (HTTP_STATUS_CODES[status] ?? "") : "";
  const statusStr = statusText ? `${status} ${statusText}` : String(status);
  this._info(`Completed ${statusStr} in ${Math.round(event.duration)}ms`);
}
```

Missing, in Rails' own order: the `info do` BLOCK form (trails' `_info` already
takes a `() => string`, so the lazy arm exists and is simply unused here); the
`additions` local from `ActionController::Base.log_process_action(payload)`
(`log_subscriber.rb:29`, itself `abstract_controller/logger.rb`); the
`payload[:exception]&.first` →
`ActionDispatch::ExceptionWrapper.status_code_for_exception` arm that recovers a
`nil` status (`:32-34`); the `GC:` addition off `event.gc_time` (`:36`); the
the space-prefixed `(#{additions.join(" | ")})` suffix (`:38`); and the development-only trailing
blank line (`:40`). The port also invents a `statusText`/`statusStr` pair where
Rails interpolates `Rack::Utils::HTTP_STATUS_CODES[status]` directly, so a nil
status renders differently.

Two baseline rows in
`scripts/api-compare/call-mismatches-exclude/actioncontroller/log-subscriber.json`
are exactly this gap and converge with it — the RFC 0047 call-set row
`process_action` / `log_process_action`, and the RFC 0095 `kind: "args"` row
`round` with `rubyArgs: ["num:1"]` (Rails' `event.gc_time.round(1)`; the port's
only `round` is the argument-less `event.duration.round`).

PR 7377 ported the sibling `start_processing` (`:9-27`) and left this one
untouched; the two rows above are the debt it did not clear.

## Converged shape

Port the body line for line inside `this._info(() => { ... })`, with the Rails
locals (`payload`, `additions`, `status`, `exception_class_name`, `message`),
the Rails branch order, and `HTTP_STATUS_CODES[status]` interpolated directly.
`gc_time` needs a counterpart on the trails `NotificationEvent`
(`packages/activesupport/src/notifications/*`); if it has none, file that half
separately rather than dropping the `GC:` addition silently.

## Acceptance criteria

- `processAction` mirrors `log_subscriber.rb:26-44`: the block form, the same
  locals at the Rails names, the same branch order, the `additions` join and
  the development trailing newline.
- `subscribe_log_level :process_action, :info` (`:44`) is registered — this
  overlaps `port-log-subscriber-remaining-subscribe-log-level`; whichever
  lands second drops its half.
- Both rows named above are deleted from
  `call-mismatches-exclude/actioncontroller/log-subscriber.json` by hand — no
  reseed — and `pnpm parity:api:calls` / `pnpm parity:api:calls:args` stay
  green.
- actionpack suite green.
