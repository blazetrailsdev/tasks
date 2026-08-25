import { Base } from "@blazetrails/activerecord";
import type { AssociationProxy, Relation } from "@blazetrails/activerecord";
import type { Story } from "./story.js";

export const RFC_STATUSES = ["draft", "active", "closed", "postponed", "superseded"] as const;
export type RfcStatus = (typeof RFC_STATUSES)[number];

export class Rfc extends Base {
  static _tableName = "rfcs";

  declare id: string; // slug, e.g. "0061-ci-failures"
  declare number: number | null;
  declare slug: string | null;
  declare title: string | null;
  declare status: RfcStatus;
  declare owner: string | null;
  declare superseded_by: string | null;
  declare priority: number | null;
  declare file_path: string | null;
  declare stories: AssociationProxy<Story>;

  declare isActive: () => boolean;
  declare static active: () => Relation<Rfc>;
  declare static closed: () => Relation<Rfc>;

  static {
    this.hasMany("stories", { foreignKey: "rfc_id" });
    this.enum("status", {
      draft: "draft",
      active: "active",
      closed: "closed",
      postponed: "postponed",
      superseded: "superseded",
    });
  }
}
