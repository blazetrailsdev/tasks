---
title: "Port Thor::CoreExt::HashWithIndifferentAccess, with its method_missing predicates as a Proxy"
status: draft
updated: 2026-09-30
rfc: "0171-thor-port"
cluster: null
packages: ["trailties"]
deps: ["port-thor-errors-nested-context-and-version"]
deps-rfc: []
est-loc: 300
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Thor::Options#parse` returns `Thor::CoreExt::HashWithIndifferentAccess.new(@assigns).freeze`
(`vendor/thor/v1.3.2/lib/thor/parser/options.rb:139-141`). Rails' generators rely on its `method_missing`
(`vendor/thor/v1.3.2/lib/thor/core_ext/hash_with_indifferent_access.rb:93-104`): `options.skip_git?` is `!!self["skip_git"]`,
`options.database?("sqlite3")` compares, and `options.name` reads. railties calls the predicate
form **64 times** (`grep -rEn 'options\.[a-z_]+\?' vendor/rails/v8.0.2/railties/lib`), and the
compare form 0 times. `plugin_command.rb:26` comments "Thor's not so indifferent access hash."

It is not activesupport's HWIA. It is a separate 107-line class with its own `convert_key`,
`except`, `slice`, `values_at`, `merge`, `reverse_merge` and `to_hash`.

## Design (RFC decision 6)

Keys are camelCase strings (`skipGit`), so `convert_key`'s Symbol→String arm is a no-op in
JS and ported as one. The plain-read arm of `method_missing` (`options.name`) is an own
property read. The **predicate** arm is a `Proxy` `get` trap: `options.isSkipGit` answers
Ruby truthiness of `self["skipGit"]` (`!= null && !== false`). That follows the repo's `isX`
predicate spelling (`scripts/parity/conventions.ts` `HAS_PREDICATE_ALIASES` / `is*`). The
one-argument compare arm has no call site in railties and is not given a JS spelling. It is
recorded in `SCOPED_SKIP_GROUPS` with that reason.

Add a row to CLAUDE.md § "Ruby protocol methods with a different JS mechanism"'s table:
`thor/core_ext/hash_with_indifferent_access.rb | Proxy`.

## Fidelity traps (predicted at authoring)

- [ ] **Ruby truthiness.** `!!self[$1]` is false only for `nil` / `false`. `options.isForce`
      over `""` or `0` is `true`.
- [ ] **Frozen.** `assigns.freeze`. A write through the Proxy raises `FrozenError`
      (ruby-compat), not a silent no-op.
- [ ] **`reverse_merge!` / `replace`** return self.
- [ ] **Types.** `ThorOptions<T>` maps each declared key `K` to an `is${Capitalize<K>}`
      boolean, so `options.isSkipGit` type-checks.

## Acceptance criteria

- [ ] The file reads complete in `parity:api --package thor` (less the scoped skip).
- [ ] `vendor/thor/v1.3.2/spec/core_ext/hash_with_indifferent_access_spec.rb` (13) is ported.
- [ ] The CLAUDE.md table row is added.

## Cases to port (13)

`vendor/thor/v1.3.2/spec/core_ext/hash_with_indifferent_access_spec.rb`:

- `has values accessible by either strings or symbols` (`:9`)
- `supports except` (`:17`)
- `supports fetch` (`:28`)
- `supports slice` (`:43`)
- `has key checkable by either strings or symbols` (`:57`)
- `handles magic boolean predicates` (`:64`)
- `handles magic comparisons` (`:70`)
- `maps methods to keys` (`:75`)
- `merges keys independent if they are symbols or strings` (`:79`)
- `creates a new hash by merging keys independent if they are symbols or strings` (`:86`)
- `converts to a traditional hash` (`:92`)
- `handles reverse_merge` (`:97`)
- `handles reverse_merge!` (`:106`)
