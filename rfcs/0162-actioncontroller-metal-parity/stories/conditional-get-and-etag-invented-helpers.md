---
title: "Fold ConditionalGet's and the etag modules' invented helpers into Rails' shape"
status: draft
updated: 2026-09-28
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "action-controller-config-seats-onto-activesupport-primitives",
    "model-response-cache-control-hash-for-expires-in-and-fresh-when",
  ]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:extra --package actioncontroller` lists, under
`packages/actionpack/src/action-controller/metal/`:

- `conditional-get.ts`: `buildCacheControl` (`:55`), `getEtaggers` (`:122`),
  `clearEtaggers` (`:126`) — novel; `generateStrongEtag`, `generateWeakEtag`,
  `isFresh` — moved
- `etag-with-template-digest.ts`: `templateDigest` (`:36`), `templateEtagger` (`:75`)
- `etag-with-flash.ts`: `flashEtagger` (`:35`)
- `default-headers.ts`: `getDefaultHeaders` (`:9`), `clearDefaultHeaders` (`:13`),
  `applyDefaultHeaders` (`:19`)
- `head.ts`: `headResponse` (`:10`)

Rails' shape, under `vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/`:

- `ConditionalGet.etag(&etagger)` (`conditional_get.rb:33`) appends to the
  `etaggers` class attribute; `combine_etags` (`:336`) folds them into the
  validator. There is no global etagger list to get or clear.
- `EtagWithTemplateDigest` registers `etag do |options| … end` (`:33`) over
  private `determine_template_etag` / `pick_template_for_etag` /
  `lookup_and_digest_template`.
- `EtagWithFlash` registers `etag { flash if … }` in its `included` block.
- `DefaultHeaders::ClassMethods#make_response!(request)` (`default_headers.rb:14`)
  applies `ActionDispatch::Response.default_headers` by building the response.
- `Head#head(status, options = nil)` (`head.rb:23`) with private
  `include_content?` (`:56`).

Three call baseline rows sit in `actioncontroller/metal/conditional-get.json`.

## Acceptance criteria

- Every novel name above is gone; each module registers its etagger or applies
  its headers the way Rails does, through the `etaggers` class attribute and
  `make_response!`.
- `conditional-get.json` is empty and its mark tightened.
- `pnpm parity:api:extra --package actioncontroller` lists none of the five
  files.
