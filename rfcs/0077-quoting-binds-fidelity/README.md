---
rfc: "0077-quoting-binds-fidelity"
title: "Adapter quoting and bind-param fidelity"
status: active
created: 2026-07-26
updated: 2026-08-09
owner: "@deanmarano"
packages:
  - "activerecord"
  - "arel"
clusters:
  - "adapters"
priority: 2
---

Extracted from RFC 0023 (surfaced-deviations) triage, 2026-07-26.

Open deviations in the adapter quoting layer (quote_string/quote overrides, invented arms, dead interfaces, class-field vs prototype-method override shape, host contracts) and in bind handling (inline quoting where Rails binds, Attribute unwrapping, temporal/binary bind formatting, non-prepared inline-binds branch). These interlock - several stories name each other as sequencing hazards - so they are collected under one RFC.

Swept 2026-08-09 against origin/main: 2 of 15 stories closed as already converged (the \_qi/\_qt shorthand is gone; both SchemaQuoter object-literal assignment sites are gone). 13 remain.
