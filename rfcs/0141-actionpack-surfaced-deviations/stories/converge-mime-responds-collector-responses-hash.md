---
title: "converge-mime-responds-collector-responses-hash"
status: ready
updated: 2026-09-26
rfc: "0141-actionpack-surfaced-deviations"
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

`ActionController::MimeResponds::Collector` keeps its handlers in a
`@responses = {}` Hash (`vendor/rails/actionpack/lib/action_controller/metal/mime_responds.rb:250-262`),
and `any_response?` reads it with `Hash#fetch`:

    # mime_responds.rb:280-282
    def any_response?
      !@responses.fetch(format, false) && @responses[Mime::ALL]
    end

trails' `Collector.isAnyResponse` (`packages/actionpack/src/action-controller/metal/mime-responds.ts:52-54`)
reads `this.handlerFor(this.format)` / `this.hasAnyHandler` off the
`action-dispatch/respond-to.ts` base's `handlers` Map and `anyHandler` field
instead. Surfaced in trails#7739, whose extractor now proves `@responses` is
a Hash, so the ruby-compat call ratchet reports `fetch → fetch` for
`any_response?`; that PR baselined the row pointing here.

Related: `mime-responds-custom-variant-collector-and-mime-lookup` (0023) ports
`custom`'s `@responses[mime_type] ||=` store.

## Acceptance criteria

- `Collector` keeps Rails' `@responses` Hash (with `Mime::ALL` as the `any`
  key) and `isAnyResponse` is `!fetch(this._responses, format, false) && this._responses[ALL]`.
- The `any_response?` `rubyCompat` row in
  `scripts/api-compare/call-mismatches-exclude/actioncontroller/metal/mime-responds.json` is deleted.
