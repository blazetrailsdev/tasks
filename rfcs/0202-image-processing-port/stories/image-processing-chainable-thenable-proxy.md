---
title: "ImageProcessing::Chainable as a thenable Proxy that collects operations"
status: done
updated: 2026-10-29
rfc: "0202-image-processing-port"
cluster: ip-core
packages: ["image-processing"]
deps: ["vendor-image-processing-and-mini-magick"]
deps-rfc: []
est-loc: 300
priority: null
pr: trails#9426
claim: "2026-10-29T12:52:29Z"
assignee: "image-processing-chainable-thenable-proxy"
blocked-by: null
---

## Context

`ImageProcessing::Chainable` (`chainable.rb`, 104 lines) builds operations
lazily: `source`, `convert`, `loader`, `saver`, `instrumenter`, `apply`,
`operation`, `call` (`:55-61`, `branch(…).call!`), `branch` (`:64`), and
`method_missing` (`:86-91`), which queues any unknown name, runs a `!` name
immediately and passes a `?` name to `super`. `Builder` (`builder.rb`) holds
the options.

Ruled 2026-10-21: the port is a Proxy that collects operations and is
thenable, so `await` runs the pipeline as `call()` does. The RFC's Design
section lists the reserved names, the `*Bang` / `is*` handling and the
`then` hazard.

## Acceptance criteria

- An unknown property read returns a function queuing that operation on a new
  builder; the gem's own methods are ordinary members; `then` runs `call()`.
- `*Bang` names queue and call; `is*` names are not queued; `then`, `catch`,
  `finally`, `constructor`, `toJSON` and well-known symbols are never queued.
- CLAUDE.md's `method_missing` table gains the
  `image_processing/chainable.rb | Proxy (thenable)` row, with the hazard noted.
- `builder_test.rb` and the chainable parts of `pipeline_test.rb` pass with a
  stub processor.
