
import { type AnyColumn, type GetColumnData, type SQL } from "drizzle-orm";

export const aliased_column = <T extends AnyColumn>(column: T, alias: string): SQL.Aliased<GetColumnData<T>> => {
  return column.getSQL().mapWith(column.mapFromDriverValue).as(alias);
};
