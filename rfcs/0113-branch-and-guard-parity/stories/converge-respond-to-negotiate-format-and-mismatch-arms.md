---
title: "respondTo drops respond_to's negotiate_format, RespondToMismatchError guard and content-type arms"
status: draft
updated: 2026-08-31
rfc: "0113-branch-and-guard-parity"
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

`ActionController::MimeResponds#respond_to` (`vendor/rails/actionpack/lib/action_controller/metal/mime_responds.rb:211-228`)
runs five steps after yielding the collector:

```ruby
if format = collector.negotiate_format(request)
  if media_type && media_type != format
    raise ActionController::RespondToMismatchError
  end
  _process_format(format)
  _set_rendered_content_type(format) unless collector.any_response?
  response = collector.response
  response.call if response
else
  raise ActionController::UnknownFormat
end
```

`packages/actionpack/src/action-controller/base.ts#respondTo` (the splat and
the both-types-and-a-block `ArgumentError` were ported by
`param-drift-actioncontroller-structural-residue`, PR #7302) instead reads the
format and Accept header off the request itself and calls
`collector.negotiate({ format, accept })`, then invokes the handler:

- `collector.negotiate_format(request)` — the Rails-named entry point, which
  `packages/actionpack/src/action-controller/metal/mime-responds.ts:78` already
  provides — is not called; `negotiate` is called directly, so the collector's
  `@variant` is bypassed.
- The `media_type && media_type != format` guard and
  `ActionController::RespondToMismatchError` (`metal/exceptions.rb`) have no
  port at all.
- `_process_format(format)` and the
  `_set_rendered_content_type(format) unless collector.any_response?` arm are
  dropped, so the response content type is never set from the negotiated
  format. `isAnyResponse` (`mime-responds.ts:74`) exists and is unused by this
  path.
- Rails calls `collector.response` and invokes it only when present; the port
  calls `result.handler()` unconditionally.

## Acceptance criteria

- `respondTo` goes through `negotiateFormat(request)` and reproduces all five
  steps in Rails' order, including the `RespondToMismatchError` guard and the
  `any_response?`-gated `_set_rendered_content_type`.
- `UnknownFormat` stays the else arm, raised from the same place.
- No test renamed; `pnpm parity:api:calls` and `parity:api:calls:args` report no
  new row, and any baseline row this converges is deleted rather than reseeded.
