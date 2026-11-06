---
title: "Port ActionMailer::Railtie and the mailer generator"
status: done
updated: 2026-11-05
rfc: "0204-actionmailer-and-mail-port"
cluster: actionmailer
packages: ["actionmailer", "trailties"]
deps: ["actionmailer-test-helper-test-case-and-preview"]
deps-rfc: []
est-loc: 300
priority: null
pr: trails#9763
claim: "2026-11-05T23:04:35Z"
assignee: "actionmailer-railtie-and-mailer-generator"
blocked-by: null
---

## Context

`actionmailer/lib/action_mailer/railtie.rb` (94: config, initializers, preview
paths, `action_mailer.set_autoload_paths`) and
`lib/rails/generators/mailer/mailer_generator.rb` (38) wire into trailties.

## Acceptance criteria

- Railtie and generator ported; initializers follow trailties' settled shapes
  (no autoloader: packages/trailties/CLAUDE.md).
- The generator's test in railties passes.
