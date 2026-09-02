---
title: "Port ActionController::LogSubscriber#start_processing's params and format branches"
status: in-progress
updated: 2026-09-02
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: 61
pr: 7377
claim: "2026-09-02T01:45:12Z"
assignee: "move-monitor-mixin-to-ruby-compat"
blocked-by: null
closed-reason: null
---

## Context

`ActionController::LogSubscriber#start_processing`
(`actionpack/lib/action_controller/log_subscriber.rb:9-27`) logs the filtered
request parameters:

```ruby
payload = event.payload
params = {}
payload[:params].each_pair do |k, v|
  params[k] = v unless INTERNAL_PARAMS.include?(k)
end
format  = payload[:format]
format  = format.to_s.upcase if format.is_a?(Symbol)
format  = "*/*" if format.nil?
```

`packages/actionpack/src/action-controller/log-subscriber.ts:21-28` ports only
the `Processing by …#… as …` line: there is no `params` hash, no
`INTERNAL_PARAMS` register, and no `Symbol`/`nil` normalisation of `format`
(the port takes `format ?? "*/*"`, which is not the `to_s.upcase` arm).

PR #7313 (RFC 0129) therefore baselined the `each_pair` → `eachPair` row in
`scripts/api-compare/call-mismatches-exclude/actioncontroller/log-subscriber.json`
(`kind: "rubyCompat"`): there is no hash to walk yet. That row is debt waiting
on this port, not a settled deviation. The file also holds an older RFC 0047
call-set row for `process_action` / `log_process_action`, which is a separate
gap.

## Converged shape

Port the body line for line: the `INTERNAL_PARAMS` constant
(`log_subscriber.rb:6`), the `eachPair`-driven filter over `payload.params`,
the `format` normalisation arms, and the `Parameters` debug line Rails appends.

## Acceptance criteria

- `startProcessing` mirrors `log_subscriber.rb:9-27` — same locals, same branch
  order, `INTERNAL_PARAMS` at the Rails name.
- The `kind: "rubyCompat"` `start_processing` / `each_pair` row is deleted from
  `call-mismatches-exclude/actioncontroller/log-subscriber.json` by hand; no
  reseed.
- `pnpm parity:api:calls:ruby-compat` green; actionpack suite green.
