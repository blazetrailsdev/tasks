---
rfc: "0078-sti-schema-reflection-fidelity"
title: "STI / schema-reflection attribute-definition fidelity"
status: draft
created: 2026-07-26
updated: 2026-07-27
owner: "@your-handle"
packages:
  - "activerecord"
  - "activemodel"
clusters:
  - "schema"
priority: 2
---

Extracted from RFC 0023 (surfaced-deviations) triage, 2026-07-26.

trails' `_attributeDefinitions` + STI overlay + reflection-registry generation gate is invented machinery standing in for Rails' `_default_attributes` + `reload_schema_from_cache` + Zeitwerk discard semantics. The open stories here (cold-leaf STI gates, subclass attribute routing, stale bound reflections after DDL, descendant invalidation, registry poison mechanism) all trace to that same substitution and should converge together - the headline story is converge-attribute-definitions-onto-default-attributes-r.
