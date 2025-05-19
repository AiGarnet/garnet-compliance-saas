export interface Vendor {
  id: string;
  name: string;
  status: "Questionnaire Pending" | "In Review" | "Approved" | "Pending Review";
  questionnaireAnswers: { question: string; answer: string }[];
  riskScore?: number;
  riskLevel?: "Low" | "Medium" | "High";
}

export const vendors: Vendor[] = [
  {
    id: "1",
    name: "Acme Payments",
    status: "Pending Review",
    questionnaireAnswers: [
      { question: "Do you store personal data?", answer: "Yes" },
      { question: "Is data encrypted at rest?", answer: "Yes" }
    ],
    riskScore: 65,
    riskLevel: "High"
  },
  {
    id: "2",
    name: "TechSecure Solutions",
    status: "Approved",
    questionnaireAnswers: [
      { question: "Do you store personal data?", answer: "Yes" },
      { question: "Is data encrypted at rest?", answer: "Yes" },
      { question: "Do you have a data retention policy?", answer: "Yes" }
    ],
    riskScore: 25,
    riskLevel: "Low"
  },
  {
    id: "3",
    name: "Global Data Services",
    status: "Questionnaire Pending",
    questionnaireAnswers: [
      { question: "Do you store personal data?", answer: "No" }
    ],
    riskScore: 45,
    riskLevel: "Medium"
  },
  {
    id: "4",
    name: "SecureCloud Inc",
    status: "In Review",
    questionnaireAnswers: [
      { question: "Do you store personal data?", answer: "Yes" },
      { question: "Is data encrypted at rest?", answer: "Yes" },
      { question: "Do you have a data retention policy?", answer: "Yes" },
      { question: "Do you conduct regular security audits?", answer: "Yes" }
    ],
    riskScore: 30,
    riskLevel: "Low"
  }
];