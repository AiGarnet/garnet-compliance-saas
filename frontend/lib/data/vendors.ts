import { Vendor, VendorStatus, RiskLevel, VendorsSchema } from '../types/vendor.types';

/**
 * Sample vendor data
 * In a real application, this would be fetched from an API
 */
export const vendorsData: Vendor[] = [
  {
    id: "1",
    name: "Acme Payments",
    status: VendorStatus.PENDING_REVIEW,
    questionnaireAnswers: [
      { questionId: "q1", question: "Do you store personal data?", answer: "Yes" },
      { questionId: "q2", question: "Is data encrypted at rest?", answer: "Yes" }
    ],
    riskScore: 65,
    riskLevel: RiskLevel.HIGH,
    createdAt: new Date("2023-05-15"),
    updatedAt: new Date("2023-06-10")
  },
  {
    id: "2",
    name: "TechSecure Solutions",
    status: VendorStatus.APPROVED,
    questionnaireAnswers: [
      { questionId: "q1", question: "Do you store personal data?", answer: "Yes" },
      { questionId: "q2", question: "Is data encrypted at rest?", answer: "Yes" },
      { questionId: "q3", question: "Do you have a data retention policy?", answer: "Yes" }
    ],
    riskScore: 25,
    riskLevel: RiskLevel.LOW,
    createdAt: new Date("2023-03-20"),
    updatedAt: new Date("2023-04-15")
  },
  {
    id: "3",
    name: "Global Data Services",
    status: VendorStatus.QUESTIONNAIRE_PENDING,
    questionnaireAnswers: [
      { questionId: "q1", question: "Do you store personal data?", answer: "No" }
    ],
    riskScore: 45,
    riskLevel: RiskLevel.MEDIUM,
    createdAt: new Date("2023-07-01")
  },
  {
    id: "4",
    name: "SecureCloud Inc",
    status: VendorStatus.IN_REVIEW,
    questionnaireAnswers: [
      { questionId: "q1", question: "Do you store personal data?", answer: "Yes" },
      { questionId: "q2", question: "Is data encrypted at rest?", answer: "Yes" },
      { questionId: "q3", question: "Do you have a data retention policy?", answer: "Yes" },
      { questionId: "q4", question: "Do you conduct regular security audits?", answer: "Yes" }
    ],
    riskScore: 30,
    riskLevel: RiskLevel.LOW,
    createdAt: new Date("2023-06-12"),
    updatedAt: new Date("2023-06-20")
  },
  {
    id: "5",
    name: "Oscorp Industries",
    status: VendorStatus.IN_REVIEW,
    questionnaireAnswers: [
      { questionId: "q1", question: "Do you store personal data?", answer: "Yes" },
      { questionId: "q2", question: "Is data encrypted at rest?", answer: "Partially" },
      { questionId: "q3", question: "Do you have a data retention policy?", answer: "No" }
    ],
    riskScore: 55,
    riskLevel: RiskLevel.MEDIUM,
    createdAt: new Date("2023-05-05"),
    updatedAt: new Date("2023-06-30")
  },
  {
    id: "6",
    name: "Umbrella Corporation",
    status: VendorStatus.APPROVED,
    questionnaireAnswers: [
      { questionId: "q1", question: "Do you store personal data?", answer: "Yes" },
      { questionId: "q2", question: "Is data encrypted at rest?", answer: "Yes" },
      { questionId: "q3", question: "Do you have a data retention policy?", answer: "Yes" },
      { questionId: "q4", question: "Do you conduct regular security audits?", answer: "Yes" },
      { questionId: "q5", question: "Do you have a disaster recovery plan?", answer: "Yes" }
    ],
    riskScore: 15,
    riskLevel: RiskLevel.LOW,
    createdAt: new Date("2023-02-10"),
    updatedAt: new Date("2023-03-05")
  }
];

/**
 * Validates vendor data at runtime
 * Throws an error if data is invalid
 */
export function getValidatedVendors(): Vendor[] {
  return VendorsSchema.parse(vendorsData);
}

/**
 * Get all vendors with validation
 */
export function getAllVendors(): Vendor[] {
  return getValidatedVendors();
}

/**
 * Get a vendor by ID
 * @param id - The vendor ID
 * @returns The vendor or undefined if not found
 */
export function getVendorById(id: string): Vendor | undefined {
  return getAllVendors().find(vendor => vendor.id === id);
} 