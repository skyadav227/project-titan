# API Documentation

## Overview

This document describes the backend API surface for the TITAN platform.

## Base URL

- Development: `http://localhost:5000/api`
- Production: to be defined

## Authentication

Most user-facing endpoints require a valid JWT token.

### Headers

```http
Authorization: Bearer <token>
Content-Type: application/json
```

## Common Endpoints

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`

### Users

- `GET /users/:id`
- `PUT /users/:id`
- `DELETE /users/:id`

### Resumes

- `POST /resumes/upload`
- `GET /resumes`
- `GET /resumes/:id`

### Interviews

- `POST /interviews/start`
- `GET /interviews/:id`
- `POST /interviews/:id/answer`
- `POST /interviews/:id/submit`

### Reports

- `GET /reports`
- `GET /reports/:id`
- `POST /reports/:id/share`

## Response Format

```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully"
}
```

## Error Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request body is invalid"
  }
}
```

## Notes

- All endpoints should validate request payloads
- Use consistent HTTP status codes
- Return descriptive errors for failed operations
- Log important operations for debugging and monitoring
