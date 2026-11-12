---
title: "Port StimulusGenerator (trails generate stimulus <name>)"
status: draft
updated: 2026-11-12
rfc: "0000-stimulus-port"
cluster: stimulus
packages: [stimulus, trailties]
deps: [stimulus-package-and-install]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/stimulus-rails/v1.3.4/lib/generators/stimulus/stimulus_generator.rb:3-22` is a
`NamedBase` generator with `copy_view_files` (`:8`), `controller_name`
(`:15`) and `stimulus_attribute_value` (`:19`). It uses the
`templates/controller.js.tt` template and `USAGE`. After generating, it runs
`stimulus:manifest:update` when the app uses node. Test:
`vendor/stimulus-rails/v1.3.4/test/generator_test.rb` (13).

## Acceptance criteria

- `trails generate stimulus hello` writes
  `app/javascript/controllers/hello_controller.js` from the ported template,
  with the template path from hotwire-via-vite open question 3.
- `generator_test.rb` is ported under its upstream names. Any importmap-only
  arms are dropped, citing the ratified section.
