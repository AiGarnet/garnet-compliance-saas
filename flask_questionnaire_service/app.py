from flask import Flask, request, jsonify
import requests
import os
import json
import time
import re
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Backend API URL - configurable via environment variable
BACKEND_API_URL = os.environ.get('BACKEND_API_URL', 'http://localhost:5000')

# Comprehensive fallback answers from the vendor's perspective (first-person)
FALLBACK_ANSWERS = {
    # Privacy and Data Protection
    "privacy policy": "Yes, our organization maintains a comprehensive Privacy Policy that is publicly available on our website. Our policy details what data we collect, how we use it, and the rights of data subjects. We regularly review and update it to reflect changes in regulations and our business practices.",
    
    "dpa": "Yes, our company has Data Processing Agreements (DPAs) signed with all our sub-processors. These agreements include provisions for data protection, security measures, and compliance with applicable regulations. We maintain a register of all DPAs and review them annually to ensure ongoing compliance.",
    
    "dpo": "Yes, our organization has appointed a qualified Data Protection Officer who oversees our data protection strategy and implementation. Our DPO has expertise in data protection law and practices, and is responsible for monitoring compliance, advising on Data Protection Impact Assessments, and serving as a contact point for data subjects and supervisory authorities.",
    
    "encrypt": "Yes, our company encrypts all personal data both at rest and in transit. We use industry-standard encryption protocols (AES-256 for data at rest and TLS 1.2+ for data in transit). Our encryption key management follows NIST guidelines, with regular rotation and secure storage of encryption keys.",
    
    "access control": "Yes, our organization implements strict access control and role-based permissions for all sensitive data. We grant access on a need-to-know basis with the principle of least privilege. We maintain access logs and conduct regular reviews to ensure appropriate access levels.",
    
    "dsar": "Our company handles Data Subject Access Requests (DSARs) through a dedicated process that verifies the requester's identity and delivers a comprehensive response within 30 days, as required by GDPR Article 15. Our DSAR handling system is automated to track requests, assign responsibilities, and ensure timely responses.",
    
    "retention": "Our organization has a comprehensive data retention and deletion policy. We keep data only as long as necessary for the purpose it was collected, and securely delete it when no longer needed. We define retention periods by data category and regularly review them to ensure compliance with relevant regulations.",
    
    "data breach": "Yes, our company notifies supervisory authorities and affected individuals within 72 hours of becoming aware of a data breach, as required by GDPR Article 33. Our incident response procedure includes a dedicated team that assesses the breach impact, prepares necessary documentation, and handles all required notifications within the statutory timeframe.",
    
    "consent": "Yes, our organization collects explicit consent before personal data is processed for specific purposes. We store consent records securely and include timestamp, method of collection, and the specific consent given. Our users can easily withdraw consent at any time through our privacy dashboard.",
    
    "cross-border": "Yes, our company is compliant with cross-border data transfer mechanisms including Standard Contractual Clauses (SCCs) and Binding Corporate Rules (BCRs) where applicable. We regularly assess the legal framework for international transfers and adapt our approach based on regulatory changes.",
    
    # Financial Crime and Compliance
    "audit": "Yes, our organization has conducted internal audits related to financial crime risk within the last 12 months. These audits assess our compliance with AML, CTF, and anti-fraud regulations. We document findings and address them through a formal remediation process.",
    
    "risk matrix": "Yes, our company maintains a country risk matrix aligned with FATF and EU listings. We regularly update this matrix based on changes to international risk assessments and use it to determine the appropriate level of due diligence for vendors and customers.",
    
    "opaque ownership": "Yes, our organization has procedures in place to conduct site visits or background verification in cases of opaque ownership. This includes enhanced due diligence measures such as engaging specialized third parties for verification and requiring additional documentation.",
    
    "beneficial ownership": "Yes, our company updates beneficial ownership records within 30 days of any changes. We have automated monitoring systems in place to track corporate registry changes and regular reviews to ensure accuracy of beneficial ownership information.",
    
    "conflict zones": "No, our organization has never operated in conflict zones or FATF-blacklisted jurisdictions. We conduct comprehensive jurisdictional risk assessments before entering new markets and maintain a prohibited jurisdictions list that is regularly updated.",
    
    # Data Storage and Processing
    "data location": "Our company clearly documents all data processing and storage locations. We primarily store data within the customer's jurisdiction, and any exceptions are transparently communicated with appropriate legal safeguards in place.",
    
    "legal basis": "Yes, our organization has a documented legal basis (e.g., SCCs, adequacy decision) for each cross-border data transfer. Our legal team regularly reviews these to ensure ongoing compliance with evolving regulatory requirements.",
    
    "local representative": "Yes, our company has appointed local representatives for GDPR/PDPA compliance in each applicable jurisdiction. These representatives act as a point of contact for data subjects and supervisory authorities in those jurisdictions.",
    
    # Cybersecurity and Incident Response
    "incident response": "Yes, our organization maintains an incident response plan that aligns with ISO 27035 and NIS2 directives. We test the plan regularly through tabletop exercises and simulations to ensure effectiveness.",
    
    "cybersecurity training": "Our company's cybersecurity awareness training is updated quarterly and enforced for all employees. We track training completion, and employees must achieve a minimum passing score on assessment tests.",
    
    "vulnerability assessment": "Yes, our organization conducts external vulnerability assessments by certified third parties bi-annually. These assessments follow industry standards such as OWASP and NIST frameworks, with all critical findings addressed within defined SLAs.",
    
    "breach reporting": "Yes, our company is required to report data breaches within timeframes that vary by jurisdiction (24/48/72 hours). Our incident response procedures are designed to meet the most stringent requirements applicable to our operations.",
    
    # Regulatory Compliance
    "enforcement action": "No, our organization has never been subject to enforcement action by a Data Protection Authority (DPA), OFAC, or equivalent body. We maintain a clean compliance record and proactively implement regulatory requirements.",
    
    "investigation": "None of our directors are currently under investigation or litigation in any jurisdiction. We conduct regular background checks on all directors and maintain a process for disclosure of any legal proceedings.",
    
    "anti-boycott": "Yes, our company has adopted a comprehensive policy on complying with international anti-boycott laws. This policy is part of our global trade compliance program and is regularly reviewed to ensure alignment with changing regulations.",
    
    # Due Diligence
    "ubo": "Yes, our organization has identified all Ultimate Beneficial Owners (UBOs) owning more than 25%. We verify this information through reliable and independent sources and update it regularly.",
    
    "enhanced due diligence": "Yes, our company conducts enhanced due diligence for vendors in high-risk jurisdictions. This includes additional verification steps, ongoing monitoring, and senior management approval.",
    
    "screening": "Yes, our organization screens all vendor owners against the EU 5AMLD UBO registry or equivalent. We use a combination of automated screening tools and manual verification to ensure accuracy.",
    
    "kyb": "Yes, our company follows a documented Know Your Business (KYB) process that includes verification of business legitimacy, ownership structure, and risk assessment.",
    
    "risk-based approach": "Yes, our organization screens vendors using a risk-based approach as per FATF guidance. We determine the level of due diligence by risk factors including jurisdiction, industry, and transaction volume.",
    
    # Anti-Money Laundering
    "transaction monitoring": "Yes, our company has transaction monitoring in place to detect suspicious vendor activity. Our systems use both rule-based and AI-based detection methods that are regularly updated to address emerging risks.",
    
    "aml records": "Yes, our organization maintains AML/CFT compliance records for a minimum of 5 years as required by regulation. We store these records securely with appropriate access controls.",
    
    "pep screening": "Yes, our company screens all vendor directors and UBOs against international PEP databases. We automatically trigger enhanced due diligence for any positive matches.",
    
    "sanctions": "Yes, our organization checks all vendors against OFAC, UN, UK (HMT), and EU sanctions lists. We conduct screening both at onboarding and on an ongoing basis to capture any changes.",
    
    # Anti-Bribery and Corruption
    "anti-bribery": "Yes, all our vendors have signed an anti-bribery and corruption declaration as part of our onboarding process. We renew this declaration annually to ensure ongoing commitment.",
    
    "government officials": "No, none of our directors, owners, or employees are government officials. We maintain a conflicts of interest register that is regularly updated and reviewed.",
    
    "training": "Yes, our company has a company-wide anti-bribery training program that is mandatory for all employees. The training is role-specific with enhanced modules for high-risk positions.",
    
    "code of conduct": "Yes, our organization has reviewed the vendor's code of conduct and ethics policy. We ensure all partners adhere to ethical standards that align with our own corporate values.",
    
    # Security Features
    "mfa": "Yes, our company supports multi-factor authentication (MFA) for all users. MFA is mandatory for administrative access and strongly recommended for all user accounts.",
    
    "access review": "Yes, our organization has a formal internal access review process conducted quarterly. This includes verification of appropriate access levels and removal of unnecessary privileges.",
    
    "security incidents": "Yes, our company reports security incidents to customers within contractually defined SLA timelines. Our standard SLA for critical incidents is 24 hours or less.",
    
    "security audit": "Yes, our organization conducts independent third-party security audits annually. These audits cover all aspects of our security program and are performed by reputable security firms."
}

# Helper function to find best fallback answer
def get_fallback_answer(question):
    # Convert question to lowercase for case-insensitive matching
    question_lower = question.lower()
    
    # First try to find an exact phrase match
    for key, value in FALLBACK_ANSWERS.items():
        if key in question_lower:
            return value
    
    # If no exact match, try to find related keywords
    keywords = extract_keywords(question_lower)
    for keyword in keywords:
        for key, value in FALLBACK_ANSWERS.items():
            if keyword in key:
                return value
    
    # If still no match, provide a generic answer from the vendor perspective
    return "Our organization handles this in accordance with our company policies and applicable regulations. We ensure compliance with all relevant laws and industry best practices. For specific details, please contact our compliance team who can provide you with more information."

# Extract meaningful keywords from a question
def extract_keywords(question):
    # Remove common words and keep only potential compliance-related terms
    common_words = {'do', 'does', 'is', 'are', 'have', 'has', 'the', 'a', 'an', 'your', 'you', 
                   'organization', 'company', 'compliance', 'and', 'or', 'for', 'in', 'with', 
                   'to', 'what', 'how', 'when', 'where', 'why', 'who', 'which'}
    
    # Split the question into words
    words = re.findall(r'\b\w+\b', question.lower())
    
    # Filter out common words and keep only words longer than 3 characters
    keywords = [word for word in words if word not in common_words and len(word) > 3]
    
    return keywords

@app.route('/')
def home():
    """Home endpoint that returns basic information about the service."""
    return jsonify({
        "service": "Flask Questionnaire Service",
        "status": "running",
        "endpoints": ["/", "/health", "/questionnaire/answer", "/ask", "/batch-ask"],
        "backend_integration": BACKEND_API_URL
    })

@app.route('/health')
def health():
    """Health check endpoint."""
    return jsonify({"status": "healthy"})

@app.route('/questionnaire/answer', methods=['POST'])
def process_questionnaire():
    """
    Process a questionnaire by forwarding the request to the backend API.
    
    This endpoint expects a JSON payload with a 'question' field.
    It forwards the request to the backend's /api/answer endpoint
    and returns the response.
    """
    # Get the question from the request
    data = request.json
    
    if not data or 'question' not in data:
        return jsonify({"error": "Question is required"}), 400
    
    question = data['question']
    
    try:
        # Forward the request to the backend API
        response = requests.post(
            f"{BACKEND_API_URL}/api/answer",
            json=data,
            headers={"Content-Type": "application/json"},
            timeout=15  # Add timeout to prevent long waiting times
        )
        
        # Check if the request was successful
        response.raise_for_status()
        
        # Return the response from the backend
        return jsonify(response.json())
    
    except requests.exceptions.RequestException as e:
        # Handle any errors from the backend
        fallback_answer = get_fallback_answer(question)
        
        return jsonify({
            "question": question,
            "answer": fallback_answer,
            "error": "Failed to process questionnaire",
            "details": str(e),
            "is_fallback": True
        }), 200  # Return 200 so the UI can still display the fallback answer

@app.route('/ask', methods=['POST'])
def ask():
    """
    Process a question using the backend's /ask endpoint.
    
    This endpoint expects a JSON payload with a 'question' field.
    It forwards the request to the backend's /ask endpoint
    and returns the response.
    """
    # Get the question from the request
    data = request.json
    
    if not data or 'question' not in data:
        return jsonify({"error": "Question is required"}), 400
    
    question = data['question']
    
    # Add delay for retries
    max_retries = 2
    retry_count = 0
    
    while retry_count <= max_retries:
        try:
            # Forward the request to the backend API
            response = requests.post(
                f"{BACKEND_API_URL}/ask",
                json=data,
                headers={"Content-Type": "application/json"},
                timeout=30  # Increased timeout for more comprehensive answers
            )
            
            # Check if the request was successful
            response.raise_for_status()
            
            # Return the response from the backend
            return jsonify(response.json())
        
        except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as e:
            # Retry on timeout or connection error
            retry_count += 1
            if retry_count <= max_retries:
                time.sleep(1)  # Wait before retrying
                continue
            
            # If all retries failed, return fallback
            fallback_answer = get_fallback_answer(question)
            return jsonify({
                "question": question,
                "answer": fallback_answer,
                "is_fallback": True
            })
        
        except requests.exceptions.RequestException as e:
            # Handle other errors from the backend
            fallback_answer = get_fallback_answer(question)
            
            return jsonify({
                "question": question,
                "answer": fallback_answer,
                "error": "Failed to process question",
                "details": str(e),
                "is_fallback": True
            })

@app.route('/batch-ask', methods=['POST'])
def batch_ask():
    """
    Process multiple questions in batch using the backend's /api/batch-answers endpoint.
    
    This endpoint expects a JSON payload with a 'questions' array field.
    It forwards the request to the backend's /api/batch-answers endpoint
    and returns the response.
    """
    # Get the questions from the request
    data = request.json
    
    if not data or 'questions' not in data or not isinstance(data['questions'], list):
        return jsonify({"error": "Questions array is required"}), 400
    
    questions = data['questions']
    
    try:
        # Forward the request to the backend API
        response = requests.post(
            f"{BACKEND_API_URL}/api/batch-answers",
            json=data,
            headers={"Content-Type": "application/json"},
            timeout=60  # Longer timeout for batch processing with comprehensive answers
        )
        
        # Check if the request was successful
        response.raise_for_status()
        
        # Return the response from the backend
        return jsonify(response.json())
    
    except requests.exceptions.RequestException as e:
        # Handle any errors from the backend
        fallback_answers = []
        for question in questions:
            fallback_answer = get_fallback_answer(question)
            fallback_answers.append({
                "question": question,
                "answer": fallback_answer,
                "error": str(e),
                "is_fallback": True
            })
        
        return jsonify({
            "answers": fallback_answers,
            "error": "Failed to process batch questions",
            "details": str(e),
            "is_fallback": True
        })

if __name__ == '__main__':
    # Get the port from the environment or use a default
    port = int(os.environ.get('PORT', 5001))
    
    # Run the Flask app
    app.run(host='0.0.0.0', port=port, debug=False) 