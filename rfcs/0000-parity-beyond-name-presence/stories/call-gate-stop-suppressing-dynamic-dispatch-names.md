---
title: "Let the call-set gate see public_send, send, respond_to? and inspect"
status: draft
updated: 2026-09-20
rfc: "0000-parity-beyond-name-presence"
cluster: "call-gate"
packages: []
deps: []
deps-rfc: []
est-loc: 240
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`update-attribute-uses-public-send-setter` (0155) is a wrong call. Rails' `update_attribute` is `public_send("#{name}=", value)` (`vendor/rails/activerecord/lib/active_record/persistence.rb:530-536`); trails' calls `this.writeAttribute(name, value)` (`packages/activerecord/src/persistence.ts:562`). `output/call-skeletons.json` records exactly that: `ruby: ["ref:to_s","ref:verify_readonly_attribute","ref:public_send","ref:save"]`, `ts: ["ref:String","ref:call","ref:writeAttribute","ref:save"]`. `output/call-mismatches.json` has no row.

`public_send` is in `SKIP_GROUPS[0]` (`scripts/parity/conventions.ts:455-498`), so `rubyMethodToTs` maps it to no candidate, and `significantMissingCalls` (`scripts/api-compare/compare.ts:609`) suppresses a Ruby call that maps to no ported TS method. `send`, `respond_to?`, `is_a?`, `kind_of?` and `inspect` go the same way. `NO_JS_CALL_FORM` (`compare.ts:312-319`) separately drops `to_s`, `present?`, `blank?`, which is deliberate and stays.

These are the call names that most often carry a fidelity decision. The settled TS spellings exist: `rbObjRespondTo`, ruby-compat's inspect, a bracket call for `public_send`.

## Acceptance criteria

- `respond_to?`, `public_send`, `send` and `inspect` each get an explicit TS candidate list for the CALL side, independent of the surface SKIP.
- `updateAttribute` and `updateAttributeBang` flag.
- New rows are measured first: the PR body gives the row count per name and a hand verdict on a sample, following RFC 0113's measure-then-gate rule.
- If the real rate clears RFC 0113's one-third tripwire the rows enter the existing `call-mismatches-exclude/` baseline as seeded debt. Otherwise the name stays report-only and the PR says so.
