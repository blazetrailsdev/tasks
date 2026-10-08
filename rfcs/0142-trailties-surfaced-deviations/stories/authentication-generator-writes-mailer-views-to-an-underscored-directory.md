---
title: "Authentication generator writes mailer views to the kebab-case directory"
status: draft
updated: 2026-10-08
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8670 made a controller's view directory kebab-case. The authentication
generator still emits mailer views into an underscored directory:
`packages/trailties/src/generators/rails/authentication/authentication-generator.ts:60-61`
(`app/views/passwords_mailer/reset.html.erb`, `reset.text.erb`; bodies in
`templates.ts:227,233`).

Nothing reads them today: the repo has no `actionmailer` package, which is
why trails#8670 left them (see its "Review answers" 2). Rails resolves a mailer's
templates through the same `ActionView::ViewPaths` prefixes as a controller
(`actionmailer/lib/action_mailer/base.rb` includes `AbstractController::Rendering`
/ `ActionView::Layouts`; prefixes from `actionview/lib/action_view/view_paths.rb:75-77`),
so once a mailer exists here its lookup will come through `localPrefixes` and
land on `passwords-mailer/`.

Related and blocked on the same port:
`passwords-mailer-resolves-against-a-ported-actionmailer`.

## Acceptance criteria

- The authentication generator writes the mailer's views to
  `app/views/passwords-mailer/`, and its tests expect that path.
- When Action Mailer is ported, a test renders `PasswordsMailer#reset` from the
  generated directory.
- Do this with, or after, the Action Mailer port; not before, since until then
  the directory name is read by nothing.
