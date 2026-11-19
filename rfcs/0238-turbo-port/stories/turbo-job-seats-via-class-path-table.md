---
title: "Seat Turbo::Streams jobs with plain assignments via the class-path table, not constSet"
status: done
updated: 2026-11-19
rfc: "0238-turbo-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#10320
claim: "2026-11-18T21:53:07Z"
assignee: "activejob-actioncable-before-setup-signatures-intersect"
blocked-by: null
closed-reason: null
---

## Context

The three broadcast jobs (`packages/turbo/lib/app/jobs/turbo/streams/*.ts`) and `Turbo::Streams` itself (`packages/turbo/lib/turbo-trails.ts`) are seated with `constSet`. A plain `Turbo.Streams.X = X` left `ActiveJob::Core.deserialize`'s `constantize` raising "uninitialized constant". CLAUDE.md § "Call-time constant resolution" says a seat is a plain typed assignment and `constSet` is never the seat spelling. The Ruby files are plain `class Turbo::Streams::ActionBroadcastJob < ActiveJob::Base` (`vendor/turbo-rails/v2.0.23/app/jobs/turbo/streams/action_broadcast_job.rb:2`), resolved by name through the class-path table (`pnpm parity:class-paths`, RFC 0213).

## Acceptance criteria

- turbo gets a `constants.generated.ts` from `pnpm parity:class-paths`, so `Turbo::Streams::*Job` names resolve.
- The jobs and `Turbo.Streams` are seated with plain assignments, and every `constSet` seat in turbo is gone.
- The `broadcast ... later` tests in `streams-channel.test.ts` still pass.
