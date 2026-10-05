---
title: "parity: the arms extractor reads a leading kwargs rebinding guard as no arm"
status: done
updated: 2026-10-05
rfc: "0173-activemodel-parity-100"
cluster: arms
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: trails#8539
claim: "2026-10-05T16:09:41Z"
assignee: "arms-extractor-reads-a-kwargs-rebinding-guard"
blocked-by: null
closed-reason: null
---

## Context

Split out of `activerecord-converge-invented-control-flow-arms-connection-adapters-abstract-part-3`
(trails#8403) to keep that PR under the LOC ceiling.

`pnpm parity:api:arms:report --package=activerecord --direction=invented` lists three rows in
`connection-adapters/abstract/schema-statements.ts` at `+if` whose only extra arm is a guard that
moves an options hash out of a positional slot:

- `removeIndex` — `remove_index(table_name, column_name = nil, **options)`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:966`)
- `removeForeignKey` — `remove_foreign_key(from_table, to_table = nil, **options)` (`:1214`)
- `foreignKeyExists` — `foreign_key_exists?(from_table, to_table = nil, **options)` (`:1237`)

Ruby binds those at the call: `remove_index :t, name: :n` leaves `column_name` nil and puts `name:`
in `options`, with no statement in the body. TS has no keyword arguments, so
`removeIndex("t", { name })` lands the hash in `columnName` and the body has to move it:

```ts
if (typeof toTable === "object" && toTable !== null) {
  options = toTable;
  toTable = options.toTable;
}
```

That is the signature's work, not an arm of the method (RFC 0113 names argument normalisation as a
false-positive class). #8403 already wrote `removeForeignKey` and `foreignKeyExists` in that leading
shape; `removeIndex` had it.

A rule for `scripts/api-compare/extract-ts-api.ts#extractSkeleton` was written and measured on #8403
and then removed for size. It is reproduced below. An `if` tokens as nothing when all four hold:

1. it is the first statement of the function body;
2. its test only asks what KIND of value a parameter holds (`typeof p === "…"`, `p === null`,
   `Array.isArray(p)`, joined by `&&` / `||` / `!`);
3. every statement it guards assigns to a parameter;
4. one of them hands the tested parameter, or a spread of it, to the LAST parameter.

Condition 4 is load-bearing. A first cut without it swallowed two real Rails coercions:
`error = RuntimeError.new(error) if error.is_a?(String)` (`ErrorReporter#unexpected`) and
`query_params = parse_nested_query(query_params) if query_params.is_a?(String)`
(`vendor/rack-test/v2.2.0/lib/rack/test.rb:341`). Both are in the test below as kept arms.

Measured effect across every package (missing / invented arms, before → after):

| pair                                                                                                                                   | effect    |
| -------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| activerecord `abstract/schema-statements.ts#removeIndex`, `#removeForeignKey`, `#foreignKeyExists`                                     | 0/1 → 0/0 |
| activerecord `postgresql-adapter.ts#removeIndex` (2 pairs), `sqlite3-adapter.ts#removeIndex`, `migration/compatibility.ts#removeIndex` | 0/1 → 0/0 |
| activerecord `relation/calculations.ts#sum`                                                                                            | 0/2 → 0/1 |
| activerecord `tasks/database-tasks.ts#migrate`                                                                                         | 0/3 → 0/2 |
| activesupport `benchmark.ts#realtime`                                                                                                  | 0/2 → 0/1 |
| activesupport `hash-with-indifferent-access.ts#transformKeysBang`                                                                      | 0/1 → 1/1 |

The last row unmasks a real dropped arm, filed as `hwia-transform-keys-bang-drops-the-to-enum-arm`.

The kind test was matched by regex over the test's source text. The #8403 reviewer asked for AST
nodes over source-text regex on a sibling rule, so write `parameterKindTest` on AST nodes.

Module-level `const`s in `extract-ts-api.ts` are read in TDZ by the worker-dispatch block at the top
of the file; keep any pattern inside the function.

### The rule as written

```ts
function parameterKindTest(
  test: ts.Expression,
  parameters: readonly string[],
): string[] | undefined {
  const atom = /typeof (\w+) [!=]== "\w+"|(\w+) [!=]== null|Array\.isArray\((\w+)\)/g;
  const tested: string[] = [];
  const rest = test.getText().replace(atom, (_atom, a, b, c) => {
    tested.push(a ?? b ?? c);
    return "";
  });
  const kindOnly = /^[\s!()&|]*$/.test(rest) && tested.every((p) => parameters.includes(p));
  return kindOnly && tested.length > 0 ? tested : undefined;
}

function isKwargsRebindingGuard(statement: ts.IfStatement): boolean {
  const body = statement.parent;
  if (!ts.isBlock(body) || !ts.isFunctionLike(body.parent)) return false;
  const parameters = body.parent.parameters.flatMap((p) =>
    ts.isIdentifier(p.name) ? [p.name.text] : [],
  );
  const tested = parameterKindTest(statement.expression, parameters);
  if (tested === undefined) return false;
  const last = parameters[parameters.length - 1];
  const isTested = (e: ts.Expression): boolean => {
    while (ts.isParenthesizedExpression(e) || ts.isAsExpression(e)) e = e.expression;
    return ts.isIdentifier(e) && e.text !== last && tested.includes(e.text);
  };
  let moves = false;
  const rebinds = (branch: ts.Statement | undefined): boolean => {
    if (branch === undefined) return true;
    const statements = ts.isBlock(branch) ? branch.statements : [branch];
    return statements.every((s) => {
      if (!ts.isExpressionStatement(s) || !ts.isBinaryExpression(s.expression)) return false;
      const { left, operatorToken, right } = s.expression;
      if (operatorToken.kind !== ts.SyntaxKind.EqualsToken) return false;
      if (!ts.isIdentifier(left) || !parameters.includes(left.text)) return false;
      if (left.text === last) {
        moves ||= ts.isObjectLiteralExpression(right)
          ? right.properties.some((p) => ts.isSpreadAssignment(p) && isTested(p.expression))
          : isTested(right);
      }
      return true;
    });
  };
  const leads = body.statements.indexOf(statement) === 0;
  return leads && rebinds(statement.thenStatement) && rebinds(statement.elseStatement) && moves;
}
```

Call site, in the `IfStatement` case of `extractSkeleton`, before `tokens.push("if")`:

```ts
if (isKwargsRebindingGuard(n as ts.IfStatement)) {
  visit((n as ts.IfStatement).thenStatement);
  const alternate = (n as ts.IfStatement).elseStatement;
  if (alternate !== undefined) visit(alternate);
  return;
}
```

### Its test

```ts
it("emits no arm for a leading guard that moves an options hash or block out of a positional parameter", () => {
  const cls = extractFromSource(
    `class Foo {
        removeIndex(t: string, columnName: unknown = null, options: object = {}) {
          if (!(typeof columnName === "string" || Array.isArray(columnName))) {
            options = { ...(columnName as object), ...options };
            columnName = null;
          }
          return this.run(t, columnName, options);
        }
        block(unit: unknown, block?: () => void) {
          if (typeof unit === "function") block = unit as () => void;
          return this.run(unit, block);
        }
        notLeading(t: string, toTable: unknown, options: object = {}) {
          this.log(t);
          if (typeof toTable === "object") options = toTable as object;
          return options;
        }
        notAKindTest(t: string, toTable: unknown, options: object = {}) {
          if (this.supports(toTable)) options = toTable as object;
          return options;
        }
        coerce(error: unknown, options: object = {}) {
          if (typeof error === "string") error = new RuntimeError(error);
          return this.report(error, options);
        }
        coerceLast(queryArray: string[], queryParams: unknown) {
          if (typeof queryParams === "string") queryParams = this.parse(queryParams);
          queryArray.push(this.build(queryParams));
        }
      }`,
  );
  const arms = (name: string) =>
    cls.instanceMethods.find((m) => m.name === name)!.skeleton!.filter((t) => !t.includes(":"));
  expect(arms("removeIndex")).toEqual([]);
  expect(arms("block")).toEqual([]);
  for (const kept of ["notLeading", "notAKindTest", "coerce", "coerceLast"]) {
    expect(arms(kept)).toEqual(["if"]);
  }
});
```

## Acceptance criteria

- [ ] `extractSkeleton` emits no arm for a leading kwargs / block rebinding guard, on AST nodes, with
      a unit test that keeps the two coercion shapes as arms.
- [ ] `pnpm parity:api:arms:report --package=activerecord --direction=invented` no longer lists
      `abstract/schema-statements.ts#removeIndex`, `#removeForeignKey` or `#foreignKeyExists`.
- [ ] The effect on every other package is re-measured and recorded in the PR body.
