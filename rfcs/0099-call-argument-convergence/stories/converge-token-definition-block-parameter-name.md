---
title: "name TokenDefinition's block parameter block, not generator"
status: done
updated: 2026-08-13
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6477
claim: "2026-08-13T16:45:43Z"
assignee: "fold-grouped-composite-assoc-into-one-grouped-body"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging the RFC 0096 receiver rows in #6469. This is a live
`naming` row in `call-arg-mismatches.json`:

| rubyFile       | rubyName              | call  | rubyArgs                                                | tsArgs                                                      |
| -------------- | --------------------- | ----- | ------------------------------------------------------- | ----------------------------------------------------------- |
| `token_for.rb` | `generates_token_for` | `new` | `ref:this`, `ref:purpose`, `ref:expiresIn`, `ref:block` | `ref:this`, `ref:purpose`, `ref:expiresIn`, `ref:generator` |

Rails (`activerecord/lib/active_record/token_for.rb:83-85`):

```ruby
def generates_token_for(purpose, expires_in: nil, &block)
  self.token_definitions = token_definitions.merge(
    purpose => TokenDefinition.new(self, purpose, expires_in, block))
end
```

trails (`packages/activerecord/src/token-for.ts`) spells the block parameter
`generator` at the `generatesTokenFor` call site and through
`TokenDefinition`'s constructor. Rails names it `block` in both places
(`token_for.rb:20-27` for the `TokenDefinition` members).

## Converged shape

Rename the parameter to `block` at the `generatesTokenFor` call site and on
`TokenDefinition`, per CLAUDE.md "Locals and parameters" — a parameter keeps
the Rails identifier, camelCased. Check `docs/ruby-ts-conventions.md` first in
case `block` is a reserved-word rename.

## Acceptance criteria

- [ ] `TokenDefinition`'s block member and the `generatesTokenFor` call site
      both spell it `block`.
- [ ] The `naming` row for `token_for.rb#generates_token_for` is gone from
      `pnpm parity:api:calls:args:report`, with no baseline row added.
- [ ] `token-for.test.ts` and `token-for.trails.test.ts` pass.
