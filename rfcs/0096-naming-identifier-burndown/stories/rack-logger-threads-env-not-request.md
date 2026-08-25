---
title: "rack-logger-threads-env-not-request"
status: done
updated: 2026-08-14
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6538
claim: "2026-08-14T18:57:42Z"
assignee: "activemodel-define-attribute-method-code-generator"
blocked-by: null
closed-reason: null
---

## Context

`packages/trailties/src/rack/logger.ts#call` passes the raw Rack `env` to
`computeTags(env)`, and `computeTags` invokes each tagger with `env`. Rails
(`vendor/rails/railties/lib/rails/rack/logger.rb:20-29`) builds an
`ActionDispatch::Request` first and threads THAT everywhere:

```ruby
def call(env)
  request = ActionDispatch::Request.new(env)
  env["rails.rack_logger_tag_count"] = if logger.respond_to?(:push_tags)
    logger.push_tags(*compute_tags(request)).size
  ...
  call_app(request, env)
end
```

`compute_tags` (logger.rb) then does `request.send(tag)` for Symbol taggers and
`tag.call(request)` for Proc ones — the class doc at logger.rb:11-13 says taggers
are "methods that the +request+ object responds to […] or Proc objects that
accept an instance of the +request+ object". trails' taggers receive a Hash, so a
`:remote_ip`/`:uuid` tagger — the documented common case — cannot work at all.

The same `request` is what Rails threads into `call_app`, into the
`request.action_dispatch` notification payload, and into
`started_request_message`; trails passes `env` at each of those too
(logger.ts:40-79).

This is an a3, not a rename: converging means constructing an
`ActionDispatch::Request` in `call` and rewiring the four call sites, not
renaming a local. Surfaced by RFC 0096 wave 3 (`naming-burndown-3-tail`), where
it keeps one `naming` call-argument row standing.

## Acceptance criteria

- [ ] `Logger#call` builds an `ActionDispatch::Request` from `env` and passes it
      to `computeTags`, `callApp`, `startedRequestMessage` and the
      `request.action_dispatch` notification payload, per logger.rb:20-46.
- [ ] `computeTags` dispatches a Symbol tagger as a method on the request and a
      function tagger with the request, per logger.rb's `compute_tags`.
- [ ] `pnpm parity:api:calls:args:report` shows the `rack/logger.ts` `naming`
      row retired, with no new `shape` row.
