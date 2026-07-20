---
title: "converge-mime-responds-any-response"
status: draft
updated: 2026-07-20
rfc: "0023-surfaced-deviations"
cluster: null
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

Triage of the 183 bulk-baselined value-accessor-read wide-call entries
(story `triage-value-accessor-read-surfaced-wide-baseline`) found one entry
that is a real port divergence rather than an accessor-read artifact.

Rails `ActionController::MimeResponds::Collector#any_response?`
(`vendor/rails/actionpack/lib/action_controller/metal/mime_responds.rb:280-282`):

```ruby
def any_response?
  !@responses.fetch(format, false) && @responses[Mime::ALL]
end
```

trails (`packages/actionpack/src/action-controller/metal/mime-responds.ts:33`)
returns a boolean flag `_anyResponse` set in `any()` — it never consults the
registered responses hash or the negotiated format.

## Acceptance criteria

- `isAnyResponse()` ports the Rails body: consult the responses map for the
  negotiated format, falling back to the `Mime::ALL` entry.
- Remove the two `metal/mime-responds.ts | any_response?` entries
  (`fetch`, `format`) from
  `scripts/api-compare/call-mismatches-wide-exclude/actioncontroller/metal/mime-responds.json`.
- `pnpm api:calls:wide` green.
