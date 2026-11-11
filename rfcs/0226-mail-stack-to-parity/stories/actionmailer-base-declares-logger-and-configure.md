---
title: "ActionMailer::Base declares the logger and configure statics it mixes in"
status: in-progress
updated: 2026-11-11
rfc: "0226-mail-stack-to-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trails#9981
claim: "2026-11-11T03:04:57Z"
assignee: "actionmailer-base-declares-logger-and-configure"
blocked-by: null
closed-reason: null
---

## Context

`ActionMailer::Base` mixes in `AbstractController::Logger` (`vendor/rails/v8.0.2/actionmailer/lib/action_mailer/base.rb:489`), which provides `logger`. It also gets `ActiveSupport::Configurable`'s `configure` / `config` class methods through AbstractController. trails installs these at run time, but `packages/actionmailer/lib/base.ts` declares only `config`. So every caller has to cast to reach `logger` and `configure`:

- `packages/actionmailer/test/log-subscriber.test.ts` casts `(Base as unknown as { logger: Logger | null }).logger`, mirroring `ActionMailer::Base.logger = logger` (`actionmailer/test/log_subscriber_test.rb:25-27`).
- `asset-host.test.ts`, `url.test.ts` and `i18n-with-controller.test.ts` each cast to `{ configure(b) }`, mirroring `configure do |c| ... end` (`asset_host_test.rb:15-17`, `url_test.rb:23-25`, `i18n_with_controller_test.rb:8-10`).
- `asset-host.test.ts` and `url.test.ts` reach `mail` / mailer actions through `Record<string, ...>` casts. That part is the method_missing dispatch and is out of scope here.

## Acceptance criteria

- [ ] `Base` declares `static logger` and `static configure` with the AbstractController / Configurable types, next to the existing `declare static config`.
- [ ] The casts listed above are removed from the actionmailer tests.
