---
title: "trailties-mailer-previews-test-port-remaining"
status: done
updated: 2026-11-09
rfc: "0212-trailties-port"
cluster: null
packages: []
deps:
  - secret-key-base-credentials-arm
deps-rfc: []
est-loc: null
priority: null
pr: trails#9934
claim: "2026-11-09T21:05:40Z"
assignee: "trailties-mailer-previews-test-port-remaining"
blocked-by: null
closed-reason: null
---

## Context

trailties-mailer-previews-test-port ported 19 more tests of
`vendor/rails/v8.0.2/railties/test/application/mailer_previews_test.rb` into
`packages/trailties/src/application/mailer-previews.test.ts`, bringing it to 20
of 34. It also set up the Rails helpers (`mailer`, `mailer_preview`,
`html_template`, `text_template`, `image_file`, `document_root_element`). The
remaining 14 tests were left out because of the 800-LOC ceiling or a known
blocker:

- Blocked on `secret-key-base-credentials-arm`: production boot raises
  "Missing `secret_key_base` for 'production' environment", because
  `Configuration#secretKeyBase` (`packages/trailties/src/application/configuration.ts`)
  has no credentials arm.
  - "/rails/mailers is not accessible in production" (`:29`)
  - "/rails/mailers is accessible with correct configuration" (`:35`)
- Blocked because a plain-`require`d class isn't tracked. In Ruby,
  `Class#subclasses` tracks every class. In trails, `DescendantsTracker` only
  learns of a subclass through Zeitwerk's `on_load` (`_registerAutoloaded`,
  `packages/trailties/src/application/finisher.ts`). A preview file that
  Zeitwerk shadows (two `notifier_preview` files on two preview paths) goes
  through the original `Kernel.require` and is never registered.
  - "mailer previews are loaded from custom preview_paths" (`:104`)
- Not yet attempted (LOC):
  - Reload: "mailer previews are reloaded across requests" (`:141`), "mailer
    preview actions are added and removed" (`:179`), "mailer previews are
    reloaded from custom preview_paths" (`:278`).
  - "locale menu selects correct option" (`:580`), which needs
    `config/initializers/available_locales.ts`.
  - "preview does not leak I18n global setting changes" (`:636`). It calls
    `get` without `app(...)`, so it boots production and also needs
    `secret-key-base-credentials-arm`.
  - "mailer preview receives query params" (`:673`).
  - Attachments: "plain text mailer preview with attachment" (`:724`),
    "multipart mailer preview with attachment" (`:771`), "multipart mailer
    preview with inline attachment" (`:819`), "multipart mailer preview with
    attached email" (`:872`).
  - "mailer preview has access to rendering context" (`:1085`).

## Acceptance criteria

- The 14 tests above are ported into `mailer-previews.test.ts`, names verbatim
  (`rails` → `trails`), using the file's existing helpers.
- The production tests land once `secret-key-base-credentials-arm` is done
  (add it as a dep). The custom-preview_paths test lands once a plain-required
  class is registered with `DescendantsTracker` the way Ruby's
  `Class#subclasses` would see it.
- Every framework gap a test exposes is fixed at its Rails-named site, or filed
  with the Rails `file:line`.
