# pg-indexer-reader

## Getting Started

### Requirements
- Node 14+
- Docker
- pnpm

To start a local indexer on foundry chain run:

```bash
pnpm start:local
```

To properly remove docker networks and volumes run:

```bash
pnpm docker:clean
```

## Endpoints

### 1. GET `/api/logs`

This endpoint retrieves blockchain logs based on specified filters. It returns data in a chunked stream format for efficient processing.

#### Request Parameters

- `input`: JSON string specifying filters for the logs. It should conform to the [`filterSchema`](#filter-schema).

#### Response

- Returns a stream of chunked JSON data, each containing a subset of the logs.
- Each JSON object includes `blockNumber`, `chunk`, `totalChunks`, and `logs`.

### 2. GET `/api/queryLogs`

An endpoint for querying logs based on a specific database query structure. This endpoint also chunks the response for efficient processing.

#### Request Parameters

- `input`: JSON string specifying the address and queries for the database. It should conform to the [`dbQuerySchema`](#db-query-schema).

#### Response

- Similar to `/api/logs`, this returns a stream of chunked JSON data with blockchain logs.

## Installation and Running

[Provide instructions on how to install, configure, and run your API.]

## Schemas

### Filter Schema

The `filterSchema` is used to define the structure of filters for querying logs. Below is the documentation of its properties:

| Property  | Type             | Optional | Description                                                                |
| --------- | ---------------- | -------- | -------------------------------------------------------------------------- |
| `address` | String           | Yes      | A hexadecimal string representing the address. Must be a valid hex string. |
| `filters` | Array of Objects | No       | An array of filter objects. Each object can have the following properties: |

#### Filter Object Properties

Each object in the `filters` array has the following properties:

| Property  | Type   | Optional | Description                                                                   |
| --------- | ------ | -------- | ----------------------------------------------------------------------------- |
| `tableId` | String | No       | A hexadecimal string representing the table ID. Must be a valid hex string.   |
| `key0`    | String | Yes      | A hexadecimal string representing the first key. Must be a valid hex string.  |
| `key1`    | String | Yes      | A hexadecimal string representing the second key. Must be a valid hex string. |

Default for `filters` is an empty array (`[]`).

---

## DB Query Schema

The `dbQuerySchema` is used for constructing database queries. It consists of two main properties:

| Property  | Type             | Description                                                                |
| --------- | ---------------- | -------------------------------------------------------------------------- |
| `address` | String           | A hexadecimal string representing the address. Must be a valid hex string. |
| `queries` | Array of Objects | An array of `querySchema` objects.                                         |

### Query Schema

Each object in the `queries` array adheres to the following structure:

| Property    | Type                         | Optional | Description                                                                          |
| ----------- | ---------------------------- | -------- | ------------------------------------------------------------------------------------ |
| `tableName` | String                       | No       | The name of the table to query.                                                      |
| `namespace` | String                       | Yes      | The namespace of the table, with a default value of an empty string.                 |
| `tableType` | Enum                         | Yes      | The type of the table, either `offchainTable` or `table`, with a default of `table`. |
| `where`     | `whereClauseSchema`          | Yes      | A single `where` clause object.                                                      |
| `and`       | Array of `whereClauseSchema` | Yes      | An array of `where` clause objects combined with AND logic.                          |
| `or`        | Array of `whereClauseSchema` | Yes      | An array of `where` clause objects combined with OR logic.                           |

### Where Clause Schema

The `whereClauseSchema` is used to define conditions in the query. It has the following properties:

| Property    | Type   | Description                                                                                                                                                                       |
| ----------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `column`    | String | The name of the column to apply the condition to.                                                                                                                                 |
| `operation` | Enum   | The operation to perform. Valid options: `eq` (equal), `neq` (not equal), `lt` (less than), `lte` (less than or equal to), `gt` (greater than), `gte` (greater than or equal to). |
| `value`     | String | The value to compare the column against.                                                                                                                                          |

Note: Only one of `where`, `and`, or `or` can be defined at a time in a `querySchema` object.
