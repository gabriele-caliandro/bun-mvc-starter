import type { BasicError } from "./basic.error";

// Error trhown when the material to be created already exists
export class ERR_DUPLICATED_MATERIAL extends Error {
  type: "ERR_DUPLICATED_MATERIAL";

  constructor(message: string) {
    super(message);
    this.type = "ERR_DUPLICATED_MATERIAL";
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = "ERR_DUPLICATED_MATERIAL";
  }
}

export type MaterialCreationError = BasicError | ERR_DUPLICATED_MATERIAL;