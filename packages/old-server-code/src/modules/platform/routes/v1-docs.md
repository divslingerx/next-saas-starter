# Platform API v1 Documentation

## Overview

The Platform API v1 provides RESTful endpoints for managing CRM objects (contacts, companies, deals, etc.) following HubSpot API patterns. All endpoints are versioned and require authentication.

## Base URL

```
/api/v1
```

## Authentication

All endpoints require authentication via session cookies. Include credentials in your requests.

## Generic Object Management

### Get Objects
```http
GET /api/v1/objects/{objectType}?limit=100&after=cursor
```
Retrieve a paginated list of objects.

**Parameters:**
- `objectType` (path): Type of object (client, company, contact, deal, etc.)
- `limit` (query, optional): Number of records to return (max 100, default 100)
- `after` (query, optional): Cursor for pagination

**Response:**
```json
{
  "results": [
    {
      "id": 123,
      "properties": {
        "name": "Example Company",
        "email": "contact@example.com"
      },
      "createdAt": "2023-01-01T00:00:00Z",
      "updatedAt": "2023-01-01T00:00:00Z",
      "archived": false
    }
  ],
  "paging": {
    "next": {
      "after": "456"
    }
  }
}
```

### Create Object
```http
POST /api/v1/objects/{objectType}
```

**Request Body:**
```json
{
  "properties": {
    "name": "New Company",
    "email": "new@example.com"
  }
}
```

### Get Single Object
```http
GET /api/v1/objects/{objectType}/{recordId}
```

### Update Object
```http
PATCH /api/v1/objects/{objectType}/{recordId}
```

**Request Body:**
```json
{
  "properties": {
    "name": "Updated Company Name"
  }
}
```

### Delete Object
```http
DELETE /api/v1/objects/{objectType}/{recordId}
```

## Batch Operations

### Batch Create
```http
POST /api/v1/objects/{objectType}/batch/create
```

**Request Body:**
```json
{
  "inputs": [
    {
      "properties": {
        "name": "Company 1",
        "email": "company1@example.com"
      }
    },
    {
      "properties": {
        "name": "Company 2",
        "email": "company2@example.com"
      }
    }
  ]
}
```

**Response:**
```json
{
  "success": 2,
  "failed": 0,
  "skipped": 0,
  "errors": []
}
```

### Batch Update
```http
POST /api/v1/objects/{objectType}/batch/update
```

**Request Body:**
```json
{
  "inputs": [
    {
      "id": 123,
      "properties": {
        "name": "Updated Company 1"
      }
    },
    {
      "id": 124,
      "properties": {
        "name": "Updated Company 2"
      }
    }
  ]
}
```

## Search

### Search Objects
```http
POST /api/v1/objects/{objectType}/search
```

**Request Body:**
```json
{
  "filterGroups": [
    {
      "filters": [
        {
          "field": "name",
          "operator": "CONTAINS_TOKEN",
          "value": "example"
        }
      ]
    }
  ],
  "sorts": [
    {
      "propertyName": "createdate",
      "direction": "DESCENDING"
    }
  ],
  "query": "search term",
  "limit": 50,
  "after": "cursor"
}
```

**Filter Operators:**
- `EQ` - Equals
- `NEQ` - Not equals
- `GT` - Greater than
- `GTE` - Greater than or equal
- `LT` - Less than
- `LTE` - Less than or equal
- `CONTAINS_TOKEN` - Contains (case-insensitive)
- `NOT_CONTAINS_TOKEN` - Does not contain
- `IN` - In array
- `NOT_IN` - Not in array

## Archive Operations

### Archive Object
```http
POST /api/v1/objects/{objectType}/{recordId}/archive
```

### Unarchive Object
```http
POST /api/v1/objects/{objectType}/{recordId}/unarchive
```

## Client-Specific Endpoints

### Get Clients
```http
GET /api/v1/clients
```

### Create Client
```http
POST /api/v1/clients
```

### Search Clients
```http
POST /api/v1/clients/search
```

### Get Clients by Lifecycle Stage
```http
GET /api/v1/clients/lifecycle/{stage}
```

**Stages:**
- `lead`
- `marketing-qualified-lead`
- `sales-qualified-lead`
- `opportunity`
- `customer`

### Get Clients by Lead Status
```http
GET /api/v1/clients/lead-status/{status}
```

**Statuses:**
- `new`
- `open`
- `in-progress`
- `open-deal`
- `unqualified`
- `attempted-to-contact`
- `connected`
- `bad-timing`

### Get Recent Clients
```http
GET /api/v1/clients/recent?days=30
```

### Advance Client Lifecycle Stage
```http
POST /api/v1/clients/{clientId}/advance-stage
```

### Convert Client to Customer
```http
POST /api/v1/clients/{clientId}/convert-to-customer
```

### Mark Client as Unqualified
```http
POST /api/v1/clients/{clientId}/mark-unqualified
```

**Request Body:**
```json
{
  "reason": "Not a good fit"
}
```

### Bulk Update Client Lifecycle Stages
```http
POST /api/v1/clients/bulk/update-lifecycle
```

**Request Body:**
```json
{
  "clientIds": [123, 124, 125],
  "newStage": "sales-qualified-lead"
}
```

### Import Clients
```http
POST /api/v1/clients/bulk/import
```

**Request Body:**
```json
{
  "clients": [
    {
      "name": "Client 1",
      "email": "client1@example.com",
      "company": "Company 1"
    }
  ],
  "updateExisting": true
}
```

### Get Client Statistics
```http
GET /api/v1/clients/stats
```

**Response:**
```json
{
  "total": 150,
  "by_lifecycle_stage": {
    "lead": 50,
    "marketing-qualified-lead": 30,
    "sales-qualified-lead": 25,
    "opportunity": 20,
    "customer": 25
  },
  "by_lead_status": {
    "new": 40,
    "open": 35,
    "in-progress": 25,
    "connected": 15,
    "unqualified": 35
  },
  "recent_count": 12
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Must be a valid email"
    }
  ]
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden (permission denied)
- `404` - Not Found
- `422` - Unprocessable Entity
- `500` - Internal Server Error