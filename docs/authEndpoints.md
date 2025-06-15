# Authentication API Endpoints

## 1. Student Registration
**Endpoint:** `POST /api/auth/register`
**Description:** Register a new student account
**Access:** Public

**Sample Request:**
```json
{
  "name": "John Doe",
  "email": "john.doe@student.com",
  "matricule": "FE21A123",
  "faculty": "COT",
  "program": "CEC",
  "phone": "+237670000000",
  "password": "password123"
}
```

**Success Response (201):**
```json
{
  "id": "user_id",
  "name": "John Doe",
  "email": "john.doe@student.com",
  "matricule": "FE21A123",
  "role": "student",
  "faculty": "COT",
  "program": "CEC",
  "status": "Active",
  "createdDate": "2024-01-24T12:00:00.000Z",
  "token": "jwt_token"
}
```

## 2. User Login
**Endpoint:** `POST /api/auth/login`
**Description:** Login for any user type
**Access:** Public

**Sample Request:**
```json
{
  "identifier": "admin@atcms.com",
  "password": "admin123"
}
```
// Alternative using matricule
```json
{
  "identifier": "FE21A123",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "id": "user_id",
  "name": "System Admin",
  "email": "admin@atcms.com",
  "role": "admin",
  "status": "Active",
  "token": "jwt_token"
}
```

## 3. Admin Create User
**Endpoint:** `POST /api/auth/admin/users`
**Description:** Create any type of user (admin only)
**Access:** Protected (Admin only)
**Headers Required:** 
- Authorization: Bearer {token}

### Sample Requests by Role:

#### A. Create Admin
```json
{
  "name": "New Admin",
  "email": "newadmin@atcms.com",
  "password": "admin123",
  "role": "admin",
  "phone": "+237670000001"
}
```

#### B. Create Coordinator
```json
{
  "name": "New Coordinator",
  "email": "coordinator@atcms.com",
  "password": "coord123",
  "role": "coordinator",
  "faculty": "COT",
  "phone": "+237670000002"
}
```

#### C. Create HOD
```json
{
  "name": "New HOD",
  "email": "hod@atcms.com",
  "password": "hod123",
  "role": "hod",
  "faculty": "COT",
  "program": "CEC",
  "phone": "+237670000003"
}
```

#### D. Create Student
```json
{
  "name": "New Student",
  "email": "student@atcms.com",
  "matricule": "FE21A124",
  "password": "student123",
  "role": "student",
  "faculty": "COT",
  "program": "CEC",
  "phone": "+237670000004"
}
```

**Success Response (201):**
```json
{
  "id": "user_id",
  "name": "New User",
  "email": "user@atcms.com",
  "role": "specified_role",
  "status": "Active",
  "createdDate": "2024-01-24T12:00:00.000Z"
}
```

## Error Responses

### Validation Error (400)
```json
{
  "error": "Validation error",
  "message": [
    {
      "param": "field_name",
      "msg": "Error message"
    }
  ],
  "code": 400
}
```

### Unauthorized (401)
```json
{
  "error": "Unauthorized",
  "message": "Invalid credentials",
  "code": 401
}
```

### Forbidden (403)
```json
{
  "error": "Forbidden",
  "message": "Account inactive",
  "code": 403
}
```

### Conflict (409)
```json
{
  "error": "Conflict",
  "message": "Email or matricule already exists",
  "code": 409
}
```
