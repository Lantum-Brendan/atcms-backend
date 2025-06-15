# Complaint Management System Documentation

## Data Models

### Complaint
```typescript
interface Complaint {
  id: string;
  studentName: string;
  matricule: string;
  program: string;
  complaintType: string;  // CA Mark, Exam Mark, Course Not Appearing, Data, etc.
  courseCode: string;
  subject: string;
  description: string;
  status: 'New' | 'Processing' | 'Resolved' | 'Escalated' | 'Pending Admin Action';
  date: string;
  level?: string;  // L100-L700
  comments?: string[];
  attachedFiles?: string[];  // File paths/URLs
  statusHistory?: { 
    status: string; 
    timestamp: string; 
  }[];
}
```

## Access Control

### Student
- Can submit new complaints
- Can view their own complaint history
- Can attach supporting documents (PDF/images, max 2MB per file)
- Can track complaint status
- Receives in-app notifications for status updates

### Head of Department (HOD)
- Can view complaints from their program only
- Can update complaint status (New → Processing → Resolved)
- Can add comments and attach files
- Can escalate to Coordinator with instructions
- Can resolve with mandatory file attachment and reason
- Can perform bulk resolution for similar complaints
- Sees program-specific analytics

### Faculty/Program Coordinator
- Can view complaints from all programs in their faculty
- Can handle escalated complaints from HODs
- Can update complaint status
- Can add comments and attach files
- Can send instructions to System Admin
- Can notify students directly
- Can perform bulk resolution across programs
- Sees faculty-wide analytics with program-wise sorting

### System Admin
- Full access to all complaints
- Can handle escalated complaints from Coordinators
- Can perform system-wide actions
- Access to system-wide analytics

## Workflow

### 1. Complaint Submission
1. Student fills mandatory fields:
   - Name (pre-filled)
   - Matricule (pre-filled)
   - Level
   - Phone Number
   - Subject
   - Body
   - Recipient (defaults to HOD)
2. Student can attach multiple files (PDF/images, 2MB limit per file)
3. Complaint is created with status "New"

### 2. HOD Processing
1. HOD receives notification of new complaint
2. Options:
   - Mark as "Processing" while reviewing
   - Resolve with mandatory file and reason
   - Escalate to Coordinator with:
     - Optional instructions
     - Optional new files or forward student's files
3. Can perform bulk resolution for similar complaints

### 3. Coordinator Processing
1. Receives escalated complaints from HODs
2. Options:
   - Process complaint
   - Resolve with evidence
   - Send instructions to System Admin
   - Notify student if unresolvable
3. Can perform bulk resolution across programs

### 4. Status Transitions
```
New → Processing → Resolved
   ↘ Escalated → Pending Admin Action
```

## File Attachments
- Supported formats: PDF, Images
- Maximum size: 2MB per file
- Multiple files allowed
- Required for resolution proof
- Optional for escalation

## Analytics

### HOD Dashboard
- Program-specific metrics
- Time series graphs (semester/yearly)
- Top 5 complaint types
- Top 5 courses with complaints

### Coordinator Dashboard
- Faculty-wide metrics
- Filterable by program
- Time series analysis
- Common complaints chart
- Course frequency analysis

## Notifications
- In-app only (no email/SMS)
- New complaint alerts
- Status change notifications
- Resolution confirmations
- Escalation notifications

## Semester Structure
- First Semester
- First Semester Resit
- Second Semester
- Second Semester Resit

## Implementation Notes

### API Endpoints Required
```
POST /api/complaints - Create new complaint
GET /api/complaints - List complaints with filters
GET /api/complaints/:id - Get complaint details
PATCH /api/complaints/:id - Update complaint status
POST /api/complaints/:id/comments - Add comment
POST /api/complaints/:id/files - Upload files
POST /api/complaints/:id/escalate - Escalate complaint
POST /api/complaints/bulk-resolve - Bulk resolve complaints
GET /api/complaints/analytics - Get analytics data
```

### File Storage
- Implement secure file storage system
- Maintain file size limits
- Support multiple file uploads
- Implement file validation
- Store file metadata in complaint record

### Security Requirements
- Role-based access control
- Program/Faculty level data isolation
- Audit logging for all actions
- File upload validation
- Input sanitization