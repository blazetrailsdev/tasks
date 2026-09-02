---
title: "asset-url-helper-compute-asset-host"
status: closed
updated: 2026-09-02
rfc: "0104-twitter-app-full-stack-integration"
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
closed-reason: "superseded — compute_asset_host is ported in #7378, the PR that filed this"
---

## Context

`AssetUrlHelper#asset_path` (`actionview/lib/action_view/helpers/asset_url_helper.rb:184-217`)
ends with

```ruby
if host = compute_asset_host(source, options)
  source = File.join(host, source)
end
```

The trails port (`packages/actionview/src/helpers/asset-url-helper.ts`,
`assetPath`) omits that call and carries a
`@missingRailsCall compute_asset_host — CONVERGEABLE` receipt for it, because
`compute_asset_host` (`asset_url_helper.rb:275-306`) needs three things trails
does not have yet:

- `Zlib.crc32` for the `%d` wildcard arm (`host % (Zlib.crc32(source) % 4)`) —
  ruby-compat has no `Zlib`. `packages/activerecord/src/migration.ts:93` has a
  module-private `crc32` standing in for it, so a shared home is the first
  decision this story has to make.
- The callable-host arm's `arity` branch (`host.respond_to?(:call)`).
- `request.base_url` / `request.protocol` on the view for the `:request`
  protocol arm, plus `config.default_asset_host_protocol`.

Until it lands, an app that sets `config.action_controller.asset_host`
(a CDN) gets a host-less path from every trails asset helper.

The matching test cases exist in Rails and were left out of
`packages/actionview/src/helpers/asset-tag-helper.test.ts` for the same
reason: `test_asset_path_tag_to_not_create_duplicate_slashes`
(`actionview/test/template/asset_tag_helper_test.rb:474-481`) and the
`stylesheet_link_tag("bank", :host => "assets.example.com")` row of
`StyleLinkToTag` (`asset_tag_helper_test.rb:182`).

## Acceptance criteria

- `computeAssetHost` is ported at
  `packages/actionview/src/helpers/asset-url-helper.ts`, line for line with
  `asset_url_helper.rb:275-306` — all three host arms and all three protocol
  arms.
- `assetPath` calls it, and the `@missingRailsCall compute_asset_host` receipt
  is deleted.
- Ruby's `Zlib.crc32` has one home rather than a second private copy;
  `migration.ts`'s private `crc32` moves there or is left alone by an explicit
  decision recorded in the PR.
- The two Rails test rows above are enrolled and pass.
