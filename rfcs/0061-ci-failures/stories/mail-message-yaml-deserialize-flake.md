---
title: "Flake: mail Message YAML 'should deserialize after serializing'"
status: ready
updated: 2026-11-19
rfc: "0061-ci-failures"
cluster: null
packages: ["mail"]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Intermittent red in CI Unit Tests (2) on trails#10350 (commit 8713c09350, run 44551523175), a PR that touches no mail code:

`packages/mail/test/message.test.ts:312` — `Mail::Message > initialization > YAML serialization > should deserialize after serializing`.

The test round-trips `yamlMail.toYaml()` through `Message.fromYaml` and compares with `toEqualRuby`, then compares the SMTP delivery-method settings Map. Rails/mail counterpart: `vendor/mail/2.8.1/spec/mail/message_spec.rb` (YAML serialization block). Likely order- or state-dependent: shared `yamlMail` / `deliveryHandler` mutation by sibling `it`s (`should load a serialized delivery handler` assigns `yamlMail.deliveryHandler`), or a time/Message-ID field that differs between serialize and compare.

## Acceptance criteria

- Reproduce the failure (e.g. `pnpm vitest run packages/mail/test/message.test.ts --sequence.shuffle` or repeated runs) and identify the nondeterministic input.
- Fix the root cause (test isolation mirroring the spec's `before` setup, or the serializer), not a retry.
- The test passes 50 consecutive local runs, including shuffled order.
