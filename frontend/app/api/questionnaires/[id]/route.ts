import { NextRequest, NextResponse } from 'next/server';

// For static export, we use static data instead of dynamic API routes
// Remove 'force-dynamic' and implement static alternatives

// Add generateStaticParams to support static export
export async function generateStaticParams() {
  // Return all possible IDs that this API route needs to handle
  const ids = [
    'demo_1',
    'demo_2', 
    'demo_3',
    'q_100',
    'q_101',
    'q_102',
    'q_security_assessment',
    'q_vendor_onboarding',
    'q_compliance_review',
    'q_risk_assessment',
    'q_data_protection',
    'q_2023_audit',
    'q_2024_audit'
  ];
  
  // Make sure each id is returned as a string in the proper format
  return ids.map(id => ({ id: String(id) }));
}

interface QuestionAnswer {
  question: string;
  answer: string;
}

interface Questionnaire {
  id: string;
  name: string;
  status: string;
  progress: number;
  dueDate: string;
  answers: QuestionAnswer[];
  createdAt?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // For static export, we'll return a mock questionnaire
    // In a real implementation, this would fetch from database
    const mockQuestionnaire: Questionnaire = {
      id,
      name: `Questionnaire ${id}`,
      status: 'Not Started',
      progress: 0,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      answers: [],
      createdAt: new Date().toISOString()
    };
    
    return NextResponse.json(mockQuestionnaire);
  } catch (error) {
    console.error('Error fetching questionnaire:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    // For static export, we'll just return the updated data
    // In a real implementation, this would update the database
    const updatedQuestionnaire = {
      id,
      ...body,
      updatedAt: new Date().toISOString()
    };
    
    return NextResponse.json(updatedQuestionnaire);
  } catch (error) {
    console.error('Error updating questionnaire:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // For static export, we'll just return success
    // In a real implementation, this would delete from database
    return NextResponse.json({ message: 'Questionnaire deleted successfully' });
  } catch (error) {
    console.error('Error deleting questionnaire:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateQuestionnaireData(id: string) {
  // Different questionnaire templates based on ID
  const templates = {
    security: {
      title: 'Security Assessment Questionnaire',
      categories: ['Security Policy', 'Access Control', 'Data Protection', 'Incident Response', 'Training'],
      questions: [
        {
          text: "Does your organization have a written information security policy?",
          category: "Security Policy",
          isRequired: true,
          answer: "Yes, our organization maintains a comprehensive information security policy that is reviewed annually and approved by senior management. The policy covers all aspects of information security including data classification, access controls, and incident response procedures."
        },
        {
          text: "How does your organization handle data breach incidents?",
          category: "Incident Response",
          isRequired: true,
          answer: "We have a formal incident response plan that includes immediate containment, assessment, notification procedures, and post-incident review. Our security team is trained to respond within 2 hours of detection."
        },
        {
          text: "What encryption standards does your organization use for data at rest?",
          category: "Data Protection",
          isRequired: true,
          answer: ""
        },
        {
          text: "Describe your organization's access control procedures.",
          category: "Access Control",
          isRequired: true,
          answer: "We implement role-based access control (RBAC) with regular access reviews conducted quarterly. Multi-factor authentication is required for all administrative access and sensitive systems."
        },
        {
          text: "How often does your organization conduct security awareness training?",
          category: "Training",
          isRequired: false,
          answer: "Security awareness training is conducted quarterly for all employees, with additional specialized training for IT staff. We also conduct phishing simulation exercises monthly."
        },
        {
          text: "What measures are in place to protect against unauthorized access to facilities?",
          category: "Physical Security",
          isRequired: true,
          answer: "Our facilities employ multi-layered physical security including badge access, security cameras, visitor management systems, and 24/7 monitoring by security personnel."
        },
        {
          text: "How do you ensure secure disposal of sensitive data?",
          category: "Data Protection",
          isRequired: true,
          answer: ""
        },
        {
          text: "What backup and recovery procedures are in place?",
          category: "Business Continuity",
          isRequired: true,
          answer: "We maintain automated daily backups with offsite storage. Recovery testing is performed quarterly with documented RTO of 4 hours and RPO of 1 hour for critical systems."
        }
      ]
    },
    compliance: {
      title: 'Compliance Review Questionnaire',
      categories: ['Regulatory Compliance', 'Data Privacy', 'Financial Controls', 'Quality Management'],
      questions: [
        {
          text: "Which regulatory frameworks does your organization comply with?",
          category: "Regulatory Compliance",
          isRequired: true,
          answer: "Our organization complies with SOC 2 Type II, GDPR, CCPA, and ISO 27001. We undergo annual audits to maintain these certifications."
        },
        {
          text: "How do you handle personal data processing and storage?",
          category: "Data Privacy",
          isRequired: true,
          answer: "We follow data minimization principles, implement purpose limitation, and maintain detailed data processing records. Personal data is encrypted both in transit and at rest."
        },
        {
          text: "What financial controls are in place for vendor payments?",
          category: "Financial Controls",
          isRequired: true,
          answer: ""
        },
        {
          text: "Describe your quality management processes.",
          category: "Quality Management",
          isRequired: false,
          answer: "We maintain an ISO 9001 certified quality management system with documented procedures, regular internal audits, and continuous improvement processes."
        },
        {
          text: "How do you ensure data subject rights are protected?",
          category: "Data Privacy",
          isRequired: true,
          answer: ""
        }
      ]
    },
    vendor: {
      title: 'Vendor Onboarding Questionnaire',
      categories: ['Company Information', 'Security Practices', 'Compliance', 'Service Delivery'],
      questions: [
        {
          text: "Provide a detailed description of your organization and services.",
          category: "Company Information",
          isRequired: true,
          answer: "We are a cloud-based software provider specializing in enterprise solutions with over 10 years of experience serving Fortune 500 companies."
        },
        {
          text: "What security certifications does your organization hold?",
          category: "Security Practices",
          isRequired: true,
          answer: "We maintain SOC 2 Type II, ISO 27001, and PCI DSS certifications. All certifications are audited annually by independent third parties."
        },
        {
          text: "How do you ensure service availability and uptime?",
          category: "Service Delivery",
          isRequired: true,
          answer: ""
        },
        {
          text: "What is your incident escalation process?",
          category: "Service Delivery",
          isRequired: true,
          answer: "We have a 24/7 support team with defined escalation procedures. Critical incidents are escalated to senior management within 30 minutes."
        },
        {
          text: "How do you handle confidential customer data?",
          category: "Security Practices",
          isRequired: true,
          answer: ""
        }
      ]
    }
  };

  // Determine template based on ID
  let template = templates.security; // default
  if (id.includes('compliance') || id.includes('audit')) {
    template = templates.compliance;
  } else if (id.includes('vendor') || id.includes('onboarding')) {
    template = templates.vendor;
  }

  // Generate questions with proper structure
  const questions = template.questions.map((q, index) => ({
    id: `${id}_q_${index + 1}`,
    text: q.text,
    answer: q.answer,
    category: q.category,
    isRequired: q.isRequired,
    status: q.answer ? 'answered' : (Math.random() > 0.7 ? 'needs_attention' : 'pending')
  }));

  // Calculate progress
  const answeredQuestions = questions.filter(q => q.answer && q.answer.trim() !== '');
  const progress = Math.round((answeredQuestions.length / questions.length) * 100);

  // Generate due date (random future date)
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 30) + 7);

  // Determine status based on progress
  let status = 'Not Started';
  if (progress === 100) status = 'Completed';
  else if (progress > 75) status = 'In Review';
  else if (progress > 25) status = 'In Progress';
  else if (progress > 0) status = 'Draft';

  return {
    id,
    title: template.title,
    name: `${template.title.split(' ')[0]} #${id.split('_').pop()}`,
    status,
    progress,
    dueDate: dueDate.toISOString().split('T')[0],
    questions,
    categories: template.categories,
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {
      totalQuestions: questions.length,
      answeredQuestions: answeredQuestions.length,
      requiredQuestions: questions.filter(q => q.isRequired).length,
      completionRate: progress / 100
    }
  };
} 