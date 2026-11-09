---
title: "Lint rule: a constructor or exported function may not return a Proxy"
status: ready
updated: 2026-11-05
rfc: "0123-blocked-convergence-holding"
cluster: gate
packages: ["ruby-compat"]
deps:
  [
    "app-generator-action-methods-method-missing-in-prototype-chain",
    "application-configuration-method-missing-in-prototype-chain",
    "array-inquirer-method-missing-in-prototype-chain",
    "broadcast-logger-method-missing-in-prototype-chain",
    "builder-xmlbase-method-missing-in-prototype-chain",
    "command-recorder-delegates-through-prototype-chain",
    "database-configuration-without-a-returned-proxy",
    "delegate-missing-to-in-prototype-chain",
    "deprecation-proxy-wrappers-in-prototype-chain",
    "errors-empty-array-without-a-proxy",
    "generators-configuration-method-missing-in-prototype-chain",
    "i18n-subtree-proxy-without-a-returned-proxy",
    "image-processing-chainable-without-a-returned-proxy",
    "mime-type-method-missing-in-prototype-chain",
    "mini-magick-image-method-missing-in-prototype-chain",
    "mini-magick-tool-method-missing-in-prototype-chain",
    "multibyte-chars-method-missing-in-prototype-chain",
    "null-pool-method-missing-in-prototype-chain",
    "option-merger-without-a-returned-proxy",
    "ordered-options-method-missing-in-prototype-chain",
    "pg-connection-without-a-returned-proxy",
    "psych-adapter-yaml-without-a-proxy",
    "rack-body-proxy-method-missing-in-prototype-chain",
    "rake-task-arguments-method-missing-in-prototype-chain",
    "rb-f-binding-without-a-returned-proxy",
    "reflection-proxy-delegates-through-prototype-chain",
    "retire-method-missing-proxy-helper",
    "routes-proxy-method-missing-in-prototype-chain",
    "ruby-compat-delegator-delegates-through-prototype-chain",
    "session-options-without-a-returned-proxy",
    "string-inquirer-method-missing-in-prototype-chain",
    "strip-thenable-without-a-returned-proxy",
    "tag-builder-method-missing-in-prototype-chain",
    "time-with-zone-method-missing-in-prototype-chain",
    "trailtie-configuration-method-missing-in-prototype-chain",
    "uploaded-file-delegates-through-prototype-chain",
    "variant-collector-method-missing-in-prototype-chain",
  ]
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

trails:

- A new rule under `eslint/`, beside `ruby-compat-native-required.mjs`.

Rails / Ruby:

- None: this is a repo rule.

This story lands **last**, after every conversion story in this RFC, so the
rule is born with nothing to report and holds the line at zero. It has no
enrollment list, baseline or allowlist: a returned Proxy anywhere in
`packages/*/src` is an error from the day the rule lands. The rule flags
`return new Proxy(…)` in a constructor, a function or allocator whose returned
value is a `new Proxy(…)` expression, and an exported `const` initialised with
one. A Proxy passed to `Object.setPrototypeOf` is the sanctioned form and is
not flagged.

If a site was converted since the RFC's inventory but a new returned Proxy has
appeared on `main` since, converge it in this story (or file it as a sibling
story and add it to `deps`); never add an exemption.

See the RFC README for why a returned Proxy is the defect, and trails#9572 for
the first prototype-chain conversion of an instance-level dispatch.

## Acceptance criteria

- [ ] A lint rule under `eslint/` reports a returned Proxy in each shape the
      inventory held, with a fixture test per shape:
  - `return new Proxy(…)` in a constructor, function or method;
  - an allocator passed to `rbDefineAllocFunc` whose value is a `new Proxy(…)`;
  - an exported `const` initialised with `new Proxy(…)`;
  - a `return` (or arrow-function body) whose value is a call to a function
    that itself returns a Proxy.
- [ ] The rule has a fixture for the sanctioned
      `Object.setPrototypeOf(…, new Proxy(…))` form, which is not reported.
- [ ] The rule has no enrollment list, baseline or exemption mechanism, and
      reports zero sites on `main` when it lands.
- [ ] CI runs it, and a new returned Proxy anywhere in `packages/*/src` reds.
