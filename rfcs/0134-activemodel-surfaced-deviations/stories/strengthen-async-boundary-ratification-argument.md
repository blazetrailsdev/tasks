---
title: "Strengthen the serialization async-boundary ratification with the encoder-propagation argument"
status: draft
updated: 2026-09-02
rfc: "0134-activemodel-surfaced-deviations"
cluster: receipt-hygiene
packages: ["activemodel"]
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

PR #7406 ratified the dual sync/async `serializable_hash` / `as_json` shape in
the CLAUDE.md section "Serialization's dual sync/async hash", closing
`serializable-hash-async-return-boundary` under option (b).

The conclusion is right, but the section leads with the **wrong argument**, and
a ratified repo-wide decision resting on a weak argument is one a future agent
can poke a hole in and reopen.

**What the section currently says:** an unconditionally-async `asJson` is
impossible because `JSON.stringify` calls `toJSON` synchronously and never
awaits, so `JSON.stringify(record)` would emit `{}` for every model.

**Why that is too weak:** on the `JSON.stringify` path, `toJSON` receives the
property key and calls `this.asJson()` with **no options**
(`packages/activesupport/src/core-ext/object/json.ts:47-60`, porting
`activesupport/lib/active_support/core_ext/object/json.rb:35-43`). No options
means no `include:`, which means that path never needs to await anything and
could be given a synchronous route. It is a fixable coupling, not a wall.

**The argument that actually binds** — async propagation through the whole JSON
encoder:

- `asJson` is not one method; it is the recursive dispatcher at
  `packages/activesupport/src/core-ext/object/json.ts:395`, standing in for
  Ruby's `as_json` method lookup.
- `Array.asJson` recurses per element through that dispatcher (`:230`) and
  `Enumerable.asJson` delegates to it (`:162`), so any collection containing a
  model goes async.
- `JSONGemEncoder#jsonify` (`packages/activesupport/src/json/encoding.ts:70-93`,
  Rails' `activesupport/lib/active_support/json/encoding.rb`) recurses through
  `asJson` for every nested node, so the encoder itself goes async.
- `Encoding#encode` (`encoding.ts:31`) and its 10 call sites follow, which means
  **`to_json` returns a Promise**. Rails' `to_json` returns a String
  (`activesupport/lib/active_support/core_ext/object/json.rb:35-43`) — a
  fidelity loss at a _more_ prominent Rails surface than the thenable it would
  remove.
- The duality does not even disappear: `jsonify` would still need a synchronous
  path for the `JSON.stringify` case, so there would be two serialization paths
  regardless — the same sync/async split, relocated out of one contained Proxy
  and duplicated across the ~14 `asJson` definitions in the repo.

## Acceptance criteria

- The CLAUDE.md section "Serialization's dual sync/async hash" leads with the
  encoder-propagation argument (`asJson` is the recursive dispatcher; async
  propagates through `Array`/`Enumerable`/`jsonify`/`encode`; `to_json` would
  return a Promise where Rails returns a String).
- It states explicitly that the `JSON.stringify` → `toJSON` path is **not** the
  binding constraint, and why (no options on that path, so no `include:`), so a
  future reader does not mistake the weaker argument for the decision's
  foundation.
- It notes that the sync/async duality survives option (a) rather than being
  removed by it.
- Docs-only change; no code, no receipt text changes (receipts stay the bare
  `PERMANENT` token per the receipt-shape rule).
