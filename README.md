# Elastic to Typesense

A utility library for converting Elasticsearch queries to Typesense format.

⚠️ **WARNING: This library is under active development and not ready for production use.** ⚠️

This library is designed to translate Elasticsearch 6.8 queries to Typesense v28 format, helping you migrate your search functionality without rewriting all your queries.

## Features

- Transform Elasticsearch queries to Typesense syntax
- Support for common query types:
  - Match queries
  - Term queries
  - Range queries
  - Bool queries (must, should, must_not)
  - Exists queries
  - Function score queries
  - Multi-match queries (across multiple fields)
  - Prefix queries (for prefix matching)
- Mapping between Elasticsearch and Typesense field names
- Auto-generation of field mappings
- Support for geo sorting
- Customizable default score field
- Detailed warnings for unsupported query types

## Installation

```bash
npm install elasticsearch-to-typesense
```

## Getting Started

To use the library, you need to create a transformer instance with your desired configuration:

```typescript
import { createTransformer } from 'elasticsearch-to-typesense';

const transformer = createTransformer({
  // Configuration options here
  propertyMapping: {
    'es_field': 'typesense_field',
    'another_field': 'mapped_field'
  }
});
```

## Example Usage

### Basic Query Transformation

```typescript
import { createTransformer } from 'elasticsearch-to-typesense';

// Initialize the transformer
const transformer = createTransformer({
  propertyMapping: {
    'title': 'title',
    'description': 'description',
    'price': 'price',
    'category': 'category_id'
  }
});

// Elasticsearch query
const esQuery = {
  query: {
    bool: {
      must: [
        { match: { title: "smartphone" } },
        { range: { price: { gte: 200, lte: 800 } } }
      ],
      filter: [
        { term: { category: "electronics" } }
      ]
    }
  },
  sort: [
    { price: { order: "asc" } }
  ],
  from: 0,
  size: 20
};

// Transform to Typesense query
const result = transformer.transform(esQuery);

if (result.ok) {
  console.log('Typesense query:', result.value.query);
  console.log('Warnings:', result.value.warnings);
  
  // Use the transformed query with Typesense client
  const typesenseClient = getTypesenseClient(); // Your Typesense client initialization
  const searchResults = await typesenseClient
    .collections('products')
    .documents()
    .search(result.value.query);
} else {
  console.error('Error:', result.error);
}
```

### Multi-Match and Prefix Queries

```typescript
import { createTransformer } from 'elasticsearch-to-typesense';

const transformer = createTransformer({
  propertyMapping: {
    'title': 'title',
    'description': 'description',
    'tags': 'tags',
    'brand': 'brand_name'
  }
});

// Multi-match query (search across multiple fields with weights)
const multiMatchQuery = {
  query: {
    multi_match: {
      query: "wireless headphones",
      fields: ["title^3", "description", "tags^2"],
      type: "best_fields",
      fuzziness: 1
    }
  }
};

// Prefix query (for autocomplete/suggestions)
const prefixQuery = {
  query: {
    prefix: {
      brand: {
        value: "app",
        boost: 2.0
      }
    }
  }
};

// Transform queries
const multiMatchResult = transformer.transform(multiMatchQuery);
const prefixResult = transformer.transform(prefixQuery);

if (multiMatchResult.ok) {
  // Will generate query_by and query_by_weights for Typesense
  console.log('Multi-match query:', multiMatchResult.value.query);
  // Example output: { q: "wireless headphones", query_by: "title,description,tags", query_by_weights: "3,1,2" }
}

if (prefixResult.ok) {
  // Will add wildcard for prefix matching
  console.log('Prefix query:', prefixResult.value.query);
  // Example output: { q: "app*", query_by: "brand_name", query_by_weights: "2" }
}
```

### Using with Typesense Schema

```typescript
import { createTransformer } from 'elasticsearch-to-typesense';

// Define your Typesense schema
const typesenseSchema = {
  fields: [
    { name: 'title', type: 'string' },
    { name: 'description', type: 'string' },
    { name: 'price', type: 'float' },
    { name: 'category_id', type: 'string' },
    { name: 'location', type: 'geopoint' }
  ]
};

// Define your Elasticsearch schema
const elasticSchema = {
  properties: {
    title: { type: 'text' },
    description: { type: 'text' },
    price: { type: 'float' },
    category: { type: 'keyword' },
    location: { type: 'geo_point' }
  }
};

// Initialize the transformer with auto-mapping
const transformer = createTransformer({
  typesenseSchema,
  elasticSchema,
  autoMapProperties: true,
  defaultScoreField: 'quality_score:desc'
});

// Elasticsearch query with geo sorting
const esQuery = {
  query: {
    match: { title: "restaurant" }
  },
  sort: [
    {
      _geo_distance: {
        location: { lat: 40.712, lon: -74.006 },
        order: "asc",
        unit: "km"
      }
    }
  ],
  size: 10
};

// Transform to Typesense query
const result = transformer.transform(esQuery);

if (result.ok) {
  console.log('Typesense query:', result.value.query);
  // This would include geo sorting: location(40.712,-74.006):asc
}
```

## Configuration Options

The `createTransformer` function accepts the following options:

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `propertyMapping` | `Record<string, string>` | Maps Elasticsearch field names to Typesense field names | `{}` |
| `typesenseSchema` | `TypesenseSchema` | Typesense schema object with field definitions | `undefined` |
| `elasticSchema` | `ElasticSchema` | Elasticsearch mapping schema | `undefined` |
| `autoMapProperties` | `boolean` | Whether to auto-generate field mappings based on schema names | `false` |
| `fieldMatchStrategy` | `(elasticField: string, typesenseField: string) => boolean` | Custom function to determine if fields match for auto-mapping | `undefined` |
| `defaultQueryString` | `string` | Default search query string | `*` |
| `defaultScoreField` | `string` | Default field to use for scoring/ranking | `_text_match:desc` |

## Typesense Query Parameters

The following Typesense search parameters are supported in the transformation:

| Parameter | Description |
|-----------|-------------|
| `q` | The search query (defaults to "*" for match all) |
| `filter_by` | Filter conditions (generated from match, term, range, etc.) |
| `sort_by` | Sort order (generated from Elasticsearch sort) |
| `per_page` | Number of results per page (from Elasticsearch size) |
| `page` | Page number (calculated from Elasticsearch from/size) |
| `query_by` | Fields to search in (used by multi_match and prefix queries) |
| `query_by_weights` | Relative weights for fields (used by multi_match with boost values) |

### TypesenseSchema

```typescript
interface TypesenseSchema {
  fields: Array<{ name: string; type: string }>;
}
```

### ElasticSchema

```typescript
interface ElasticSchema {
  properties: Record<string, any>;
}
```

## Supported Query Types

| Elasticsearch Query | Typesense Equivalent |
|---------------------|----------------------|
| `match` | Filter by equality |
| `term` | Filter by exact match (singular value) |
| `terms` | Filter by array of values |
| `range` | Filter by range operators (gt, gte, lt, lte) |
| `bool` | Combination of filter clauses with AND/OR/NOT operators |
| `exists` | Filter by field presence |
| `function_score` | Base query (functions not supported) |
| `multi_match` | Search across multiple fields with weights |
| `prefix` | Prefix search with wildcard matching |

## Limitations

- Not all Elasticsearch query types are supported
- Function score modifiers are not supported in Typesense
- Some complex nested queries may not translate perfectly
- Typesense has different syntax and capabilities than Elasticsearch

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup

1. Clone the repository:
```bash
git clone https://github.com/alexberriman/elasticsearch-to-typesense.git
cd elasticsearch-to-typesense
```

2. Install dependencies:
```bash
npm install
```

3. Run tests:
```bash
# Run unit tests
npm test

# Run tests in watch mode during development
npm run test:watch

# Run integration tests (requires a running Typesense instance)
npm run test:integration

# Run a specific integration test (e.g., test query #2)
npm run test:integration:single --index=2
```

4. Build the package:
```bash
npm run build
```

### Release Process

This package uses [semantic-release](https://github.com/semantic-release/semantic-release) for versioning and releasing. Commits should follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

- `feat: add new feature` (triggers a minor release)
- `fix: fix a bug` (triggers a patch release)
- `docs: update documentation` (no release)
- `test: add tests` (no release)
- `chore: update build process` (no release)
- Breaking changes should include `BREAKING CHANGE:` in the commit body (triggers a major release)

## License

ISC