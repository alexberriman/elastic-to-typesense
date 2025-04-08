import {
  TransformerContext,
  TransformResult,
  TypesenseQuery,
} from "../core/types";
import { resolveMappedField } from "../utils/resolve-mapped-field";

export const transformMatch = (
  match: Record<string, any>,
  ctx: TransformerContext
): TransformResult<Partial<TypesenseQuery>> => {
  const filters: string[] = [];
  const warnings: string[] = [];

  for (const [field, value] of Object.entries(match)) {
    const mapped = resolveMappedField(field, ctx);
    if (!mapped) {
      warnings.push(`Skipped unmapped field "${field}"`);
      continue;
    }

    const safeValue = typeof value === "string" ? `"${value}"` : value;
    filters.push(`${mapped}:=${safeValue}`);
  }

  return {
    query: {
      filter_by: filters.join(" && "),
    },
    warnings,
  };
};
