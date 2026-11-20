---
title: "solid-queue-fork-child-supervisee-description"
status: draft
updated: 2026-11-20
rfc: "0196-solid-stack"
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

`Supervised#create_fork` (`vendor/solid_queue/v1.7.2/lib/solid_queue/processes/supervised.rb:28-40`) forks, and the child keeps the supervisee it was forked from. In trails a forked Node child starts on a fresh heap (RFC 0196 README, "Decisions", 2026-11-18), so it has to be told which supervisee to build. trails#10407 carries that information as `_configuredProcess`, set by `Configuration::Process#instantiate` (`packages/solid-queue/lib/configuration.ts`). Rails' `instantiate` is just `klass.new(**attributes)` (`configuration.rb`). The arm is receipted CONVERGEABLE against this story.

`Supervisor#start_process` (`supervisor.rb:99-109`) holds the configured process, but it reaches `create_fork` only through `start` → `run_in_mode`, and neither takes an argument.

## Acceptance criteria

- The operator rules on where the child's supervisee description comes from: the current `instantiate` arm, a value threaded from `start_process`, or something else.
- `instantiate` matches `configuration.rb`, or the arm's receipt becomes `PERMANENT` citing that ruling.
