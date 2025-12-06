import * as path from "path";

// Gets the root directory of the project. Checks if it's in production or development mode.
export const _rootdir =
  import.meta.dir.startsWith("/$bunfs/root") || import.meta.dir.startsWith("B:\\~BUN\\root")
    ? path.join(process.execPath, "..", "..")
    : path.join(import.meta.dir, "..");
