import { Migration8 } from "../../src/migration-base.ts";

/**
 * trailmap's refine reports (RFC 0243, Decision 1: `RfcRefine` moves to `Base`
 * as `Refinement`). The summary is an Active Storage attachment. `stories` is
 * null for an imported report that never recorded it. Ingest and export never
 * touch this table.
 */
export class CreateRefinements extends Migration8 {
  async change() {
    await this.createTable("refinements", (t) => {
      t.string("rfc_id", { null: false });
      t.string("outcome", { null: false });
      t.integer("stories");
      t.timestamps();

      t.index(["rfc_id", "created_at"]);
    });
  }
}
