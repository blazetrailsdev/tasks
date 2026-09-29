---
title: "port-action-view-csp-helper"
status: draft
updated: 2026-09-29
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

`ActionView::Helpers::CspHelper#csp_meta_tag`
(`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/csp_helper.rb:17-23`) has no
trails port: there is no `packages/actionview/src/helpers/csp-helper.ts`, and
`helpers/index.ts` exports no `cspMetaTag`, so `Base` (which installs every
`helpers/index.ts` export, `packages/actionview/src/base.ts:381`) does not answer it.

The controller half already exists: `ActionController::Base` publishes
`isContentSecurityPolicy` / `contentSecurityPolicyNonce` as helper methods
(`packages/actionpack/src/action-controller/base.ts:980`), which is all the
Rails body reads.

It blocks `generated-application-layout-is-not-a-port-of-the-rails-template`
(0142): the Rails layout template emits `<%= csp_meta_tag %>`
(`railties/lib/rails/generators/rails/app/templates/app/views/layouts/application.html.erb.tt:9`),
and a generated layout calling an undefined helper would fail to render.

## Acceptance criteria

- `packages/actionview/src/helpers/csp-helper.ts` ports `csp_meta_tag(**options)`
  line for line: `if content_security_policy?`, set `name: "csp-nonce"` and
  `content: content_security_policy_nonce`, `tag("meta", options)`; nil otherwise.
- Exported from `helpers/index.ts` so views answer it.
- `vendor/rails/v8.0.2/actionview/test/template/csp_helper_test.rb` ported
  (`CspHelperWithCspEnabledTest`, `CspHelperWithCspDisabledTest`, 3 tests).
