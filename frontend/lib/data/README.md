# Vendor Data Format

This document describes the vendor data structure used throughout the application.

## Vendor Format

Vendors are represented with the following structure:

```typescript
interface Vendor {
  id: string; /* UUID */
  name: string;
  status: VendorStatus;
  questionnaireAnswers: QuestionnaireAnswer[];
  riskScore: number;
  riskLevel: RiskLevel;
  createdAt?: Date;
  updatedAt?: Date;
}
```

### Key Components

- **VendorStatus**: Enum representing stages in the vendor approval process
  - `QUESTIONNAIRE_PENDING`: Initial state, waiting for vendor to complete questionnaire
  - `IN_REVIEW`: Questionnaire submitted, currently being reviewed
  - `PENDING_REVIEW`: Waiting to be reviewed
  - `APPROVED`: Vendor has been approved

- **RiskLevel**: Enum for risk classification
  - `LOW`: Low risk (scores 0-30)
  - `MEDIUM`: Medium risk (scores 31-60)
  - `HIGH`: High risk (scores 61-100)

- **QuestionnaireAnswer**: Represents answers to security/compliance questions
  ```typescript
  interface QuestionnaireAnswer {
    questionId: string;
    question: string;
    answer: 'Yes' | 'No' | 'Partially' | string;
  }
  ```

## Using Vendor Data

### Import

```typescript
import { VendorService } from '../services/vendorService';
// or
import { getAllVendors, getVendorById } from '../data/vendors';
```

### Example Usage

```typescript
// Get all vendors
const allVendors = VendorService.getAllVendors();

// Get a single vendor
const vendor = VendorService.getVendorById('1');

// Filter vendors by status
const pendingVendors = VendorService.getVendorsByStatus(VendorStatus.PENDING_REVIEW);

// Get high risk vendors
const highRiskVendors = VendorService.getHighRiskVendors();

// Get statistics
const averageRisk = VendorService.getAverageRiskScore();
const statusCounts = VendorService.countVendorsByStatus();
```

## Validation

Vendors data is validated at runtime using Zod. If you need to add new vendors or modify existing ones, ensure they conform to the `VendorSchema` defined in `../types/vendor.types.ts`.

## Data Source

In production, this data would be retrieved from an API. The current implementation simulates this with static data. 