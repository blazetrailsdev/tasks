---
title: "ActionController::UrlFor#url_options is unported, so controller *_url helpers ignore the request"
status: draft
updated: 2026-09-08
rfc: "0141-actionpack-surfaced-deviations"
cluster: "action-controller"
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails builds a controller's `url_options` from the live request
(`actionpack/lib/action_controller/metal/url_for.rb:36-46`):

```ruby
def url_options
  @_url_options ||= {
    host: request.host,
    port: request.optional_port,
    protocol: request.protocol,
    _recall: request.path_parameters
  }.merge!(super).freeze
  ...
end
```

`ActionController::UrlFor` includes `AbstractController::UrlFor` (`:30`), and
the module's own `url_options` is the `{}` at `route_set.rb:591`, which the
controller's override supersedes.

trails has no such override. Since PR #7616 a controller resolves `urlOptions`
through the spliced url-helpers module, whose implementation returns only the
route set's defaults
(`packages/actionpack/src/action-dispatch/routing/route-set.ts:392`):

```ts
urlOptions: () => ({ ...routes.defaultUrlOptions }),
```

So `host`, `port`, `protocol` and `_recall` never reach `UrlHelper#call`'s
`t.urlOptions?.()` (`route-set.ts:207`). Path helpers are unaffected — they
discard the host — but a `*_url` helper called from a controller action
generates against `default_url_options` alone rather than the request, and
`_recall` is absent, so `url_for` cannot fall back to the current request's
path parameters.

Not a regression from #7616: before it, a controller answered no url helper at
all. It is the next divergence on that path, found while wiring the helpers.

## Converged shape

Port `ActionController::UrlFor#url_options` onto the controller
(`url_for.rb:36-46`), memoized in `@_url_options` as Ruby does, merging
`super` over the request-derived hash, so a controller-invoked `*_url` helper
resolves host/port/protocol from the request and `url_for` sees `_recall`.

## Acceptance criteria

- [ ] `ActionController::Base` answers `urlOptions()` with `host`, `port`,
      `protocol` and `_recall` taken from the request, merged under the
      module's own options as `url_for.rb:41` does.
- [ ] A controller action calling a `*_url` helper generates an absolute URL
      carrying the request's host, covered against the `boot-app` fixture
      beside the existing `postsPath()` cover in
      `packages/trailties/src/application.test.ts`.
- [ ] The memoization matches Ruby's `@_url_options ||=` and its reset points.
