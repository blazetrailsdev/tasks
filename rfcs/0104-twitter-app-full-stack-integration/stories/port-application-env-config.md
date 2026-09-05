---
title: "port-application-env-config"
status: draft
updated: 2026-09-05
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
closed-reason: null
---

## Context

`railties/lib/rails/application.rb:317-348` defines `Rails::Application#env_config`,
which merges the `action_dispatch.*` and `content_security_policy` slots of
`config` into the default Rack env every request is served with — including
`"action_dispatch.content_security_policy"`,
`"...content_security_policy_report_only"`,
`"...content_security_policy_nonce_generator"` and
`"...content_security_policy_nonce_directives"` (`application.rb:342-346`).

trails has no `Application#envConfig`. PR for
`invented-statics-on-the-moved-framework-railties` deleted
`ActionDispatch::Trailtie.seedContentSecurityPolicyEnv`, an invented static that
wrote those four slots onto a request; it had no production caller, so nothing
regressed — but nothing seeds them either, which leaves
`ContentSecurityPolicyMiddleware` reading an env that is always empty in a
booted trails app.

Relevant trails files:

- `packages/trailties/src/application.ts` — where `envConfig` belongs.
- `packages/trailties/src/trailties/action-dispatch.ts` — where the deleted
  static used to live; its `contentSecurityPolicy` config slot is the source.
- `packages/actionpack/src/action-dispatch/http/content-security-policy.ts` —
  the `ContentSecurityPolicyRequest` accessors the env keys back.

## Acceptance criteria

- [ ] `Application#envConfig` is ported at
      `packages/trailties/src/application.ts`, mirroring
      `application.rb:317-348`'s key set as far as the ported config slots allow.
- [ ] The four `content_security_policy*` env keys are populated from
      `config.contentSecurityPolicy`.
- [ ] A test boots an app and asserts `ContentSecurityPolicyMiddleware` sees the
      configured policy through the env.
