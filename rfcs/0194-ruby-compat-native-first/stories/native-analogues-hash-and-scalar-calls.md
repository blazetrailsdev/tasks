---
title: "Call gate: credit native forms for Hash keys/transform_values/each_value/values_at/dup and numeric/string to_i/to_f/round/strip/chomp"
status: draft
updated: 2026-10-19
rfc: "0194-ruby-compat-native-first"
cluster: gate
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0190 credited the native hash forms for `key?`, `delete`, `merge(!)`,
`update` and `each_pair`, and this RFC's earlier gate stories add `empty?` /
`size`, two-argument `fetch` and literal-key `except`. That still leaves calls
with no credited native form, so a site has to keep its helper:

- Hash: `keys` (`Object.keys`), `values`, `transform_values`
  (`Object.fromEntries(Object.entries(h).map(...))`), `each_value`
  (`for (const v of Object.values(h))`), `values_at` (`keys.map((k) => h[k])`)
  and `dup` (`{ ...h }`). `RUBY_COMPAT_EXPORTS` credits `transformValues` and
  `eachKey` from the name alone (`scripts/parity/ruby-compat.ts:56-60`).
- Numeric and String on a proven `numeric` / `string` kind: `to_i`
  (`Math.trunc` / `Number.parseInt(s, 10)`), `to_f`, `round` with no digits
  (`Math.round` is wrong for negative halves, so it is credited only where the
  form is the half-away shape), `nan?` (`Number.isNaN`), `strip` (`.trim()`;
  Ruby also strips `\0`, so it is credited only on the `trim` form the
  extractor marks), and `rstrip` / `chomp` with a literal argument.

## Acceptance criteria

- [ ] A `NATIVE_FORM_ANALOGUES` (or receiver-kind alias) row for each call above, scoped to the `hash`, `numeric` or `string` kind. Every row has a test in `scripts/api-compare/compare.test.ts`, and so does every case where Ruby and JS observably differ and nothing is credited.
- [ ] `Hash#transform_values` and `Hash#each_key` move from `RUBY_COMPAT_EXPORTS` to `RECEIVER_KEYED_RUBY_COMPAT_EXPORTS` with a `hash` receiver, or leave the table, so the reverse reading never demands the helper on a plain object.
- [ ] `pnpm parity:api:calls` and `:calls:args` are green, with no new baseline rows.
