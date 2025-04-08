export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export type TransformResult<T> = {
  query: T;
  warnings: string[];
};

export type PropertyMapping = Record<string, string>;

export interface TransformerContext {
  propertyMapping: PropertyMapping;
  typesenseSchema?: TypesenseSchema;
  elasticSchema?: ElasticSchema;
  negated?: boolean;
  defaultScoreField?: string;
}

// Define ElasticsearchQuery as a recursive type that can handle nested objects
export type ElasticsearchQuery = {
  [key: string]: unknown;
};

export type TypesenseQuery = {
  q?: string; // Making q optional to fix type errors in tests
  filter_by?: string;
  sort_by?: string;
  per_page?: number;
  page?: number;
  query_by?: string;
  query_by_weights?: string;
  [key: string]: unknown; // Allow additional properties
};

export interface TypesenseSchema {
  fields: Array<{ name: string; type: string }>;
}

export interface ElasticSchema {
  properties: Record<string, any>;
}

export interface TransformerOptions {
  propertyMapping?: PropertyMapping;
  typesenseSchema?: TypesenseSchema;
  elasticSchema?: ElasticSchema;
  autoMapProperties?: boolean;
  fieldMatchStrategy?: (
    elasticField: string,
    typesenseField: string
  ) => boolean;
  defaultQueryString?: string;
  defaultScoreField?: string;
}
