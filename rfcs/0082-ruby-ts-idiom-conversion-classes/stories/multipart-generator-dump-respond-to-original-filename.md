---
title: "Converge Multipart::Generator#dump onto respond_to?(:original_filename)"
status: draft
updated: 2026-09-22
rfc: "0082-ruby-ts-idiom-conversion-classes"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `pnpm parity:api:duck-types` (trails#7979), hand-audited real.
`vendor/rack/lib/rack/multipart/generator.rb:21`: `if file.respond_to?(:original_filename)`.
`packages/rack/src/multipart/generator.ts:29` (`dump`) tests `file instanceof UploadedFile`, so any other
object answering `original_filename` (an ActionDispatch or rack-test uploaded file) goes down the `content_for_other` arm.

## Acceptance criteria

- The guard is `rbObjRespondTo(file, "original_filename")`, in the same position.
- Its row drops out of `pnpm parity:api:duck-types`.
