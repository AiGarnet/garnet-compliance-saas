# Document Analyzer Criteria & Enhancement Guide

## 🎯 **Overview**

This document outlines the comprehensive criteria and algorithms used in the enhanced document detection and analysis system for the vendor onboarding platform.

---

## 📋 **1. Document Requirement Detection Criteria**

### **During Question Extraction Phase**

The system analyzes each extracted question to determine if it requires a supporting document. Here are the criteria used:

#### **🔴 Definitive Document Requirements (95% Confidence)**
- **Keywords**: `upload`, `attach`, `submit document`, `provide document`, `send document`
- **Patterns**: `please upload`, `must upload`, `required to upload`
- **Why**: These words definitively indicate a document is required
- **Example**: "Please upload your business license" → 95% confidence

#### **🟠 Compliance & Certification (90% Confidence)**
- **Keywords**: `certificate`, `certification`, `license`, `permit`, `registration`
- **Additional**: `approval`, `authorization`, `accreditation`, `signed document`
- **Why**: Compliance documents are typically required as proof
- **Example**: "Provide your insurance certificate" → 90% confidence

#### **🟡 Business Document Categories (85% Confidence)**
- **Specific Documents**: `business license`, `tax id`, `ein number`, `w9 form`, `w8 form`
- **Contracts**: `vendor form`, `supplier agreement`, `nda`, `non-disclosure`
- **Why**: These are standard business verification documents
- **Example**: "Submit your W9 form" → 85% confidence

#### **🟢 Verification & Proof Keywords (80% Confidence)**
- **Keywords**: `proof`, `evidence`, `verification`, `confirmation`, `validation`
- **Phrases**: `proof of`, `evidence of`, `copy of`, `supporting document`
- **Why**: These terms typically require documentary evidence
- **Example**: "Provide proof of insurance" → 80% confidence

#### **🔵 Document Type Identifiers (75% Confidence)**
- **Types**: `form`, `application`, `report`, `record`, `file`, `copy`
- **Formats**: `scan`, `scanned`, `pdf`, `image`, `photo`, `screenshot`
- **Why**: These words suggest document submission
- **Example**: "Submit the completed form" → 75% confidence

#### **🟣 Advanced Pattern Matching (80-90% Confidence)**
- **Regex Patterns**:
  - `\b(copy|copies)\s+of\b` → 85% confidence
  - `\bsigned\s+\w+` → 80% confidence
  - `\bmust\s+(provide|submit|include|attach|upload)` → 90% confidence
  - `\bplease\s+(send|provide|submit|attach|upload)` → 80% confidence
- **Why**: Specific linguistic patterns indicating document requests

#### **❌ Negative Indicators (5-10% Confidence)**
- **Information Requests**: `what is your`, `company name`, `email address`, `phone number`
- **Simple Questions**: `how many`, `when did`, `where is`, `why do`
- **Selection Options**: `select from`, `choose from`, `yes or no`, `true or false`
- **Why**: These are simple data requests, not document requirements

---

## 📋 **2. Document Relevance Analysis Criteria**

### **When Documents Are Uploaded**

The system performs a comprehensive 5-step analysis to determine document relevance:

#### **Step 1: Pre-Analysis Rejection Checks**

**🚫 Empty Content (5% Score)**
- **Criteria**: Document content < 10 characters
- **Message**: "File appears to be empty or contains insufficient content"
- **Action**: Immediate rejection

**🚫 Corrupted Content (10% Score)**
- **Indicators**: `extraction failed`, `content extraction not yet supported`
- **Message**: "Unable to read document content"
- **Action**: Immediate rejection

**🚫 Template/Placeholder Content (15% Score)**
- **Indicators**: `lorem ipsum`, `[placeholder]`, `sample document`, `template document`
- **Message**: "This appears to be a template or placeholder document"
- **Action**: Immediate rejection

**🚫 Wrong Document Type (20% Score)**
- **Logic**: Question expects specific document type, but uploaded document is different
- **Example**: Question asks for "license" but document is "insurance policy"
- **Message**: "This question requires a [type], but document appears to be [other type]"
- **Action**: Immediate rejection

#### **Step 2: Keyword-Based Analysis (40% Weight)**

**Keyword Extraction Algorithm**:
1. Remove common words (the, and, or, but, etc.)
2. Extract meaningful terms (> 2 characters)
3. Remove duplicates
4. Compare question keywords vs document keywords

**Scoring Method**:
- Base Score = (Matched Keywords / Total Question Keywords)
- Bonus = +0.1 for each exact phrase match
- Final Score = min(Base Score + Bonus, 1.0)

#### **Step 3: AI-Powered Analysis (60% Weight)**

**AI Evaluation Criteria**:
1. **Content Relevance (40%)**: Does document answer the question?
2. **Document Type Match (30%)**: Is this the expected document type?
3. **Completeness (20%)**: Sufficient detail provided?
4. **Authenticity (10%)**: Genuine document (not template/sample)?

**AI Prompt Structure**:
```
QUESTION: "[question text]"
DOCUMENT CONTENT: "[first 2000 chars]"

Evaluate based on:
- Content Relevance (40%)
- Document Type Match (30%) 
- Completeness (20%)
- Authenticity (10%)

Format:
RELEVANCE_SCORE: [0.0 to 1.0]
REASONING: [explanation]
RECOMMENDATIONS: [if score < 0.75]
```

#### **Step 4: Combined Scoring**

**Weighted Formula**:
- Final Score = (Keyword Analysis × 0.4) + (AI Analysis × 0.6)
- Threshold for acceptance: 75%

#### **Step 5: Response Message Generation**

**✅ Acceptance Messages**:
- **90%+**: "Excellent match! Document strongly corresponds to requirements"
- **80-89%**: "Good match. Document appears to address requirements adequately"
- **75-79%**: "Acceptable match. Document seems relevant but may not fully address all aspects"

**❌ Rejection Messages**:
- **<30%**: "Poor match. Document does not appear relevant. Please upload document that addresses: [question snippet]"
- **30-49%**: "Weak relevance. Document doesn't sufficiently address requirements. Please upload more appropriate document"
- **50-74%**: "Below threshold. Document shows some relevance but doesn't meet 75% confidence requirement"

---

## 📋 **3. Document Type Recognition**

### **Question Type Identification**
```javascript
// Business License Questions
if (question.includes('license') || question.includes('permit')) → 'license'

// Certificate Questions  
if (question.includes('certificate') || question.includes('certification')) → 'certificate'

// Insurance Questions
if (question.includes('insurance') || question.includes('policy')) → 'insurance policy'

// Contract Questions
if (question.includes('contract') || question.includes('agreement')) → 'contract'

// Tax Documents
if (question.includes('tax') || question.includes('w9') || question.includes('w8')) → 'tax document'

// Financial Statements
if (question.includes('financial') || question.includes('statement')) → 'financial statement'

// Audit Reports
if (question.includes('audit') || question.includes('report')) → 'audit report'
```

### **Document Content Recognition**
```javascript
// License Detection
if (content.includes('license') && content.includes('issued')) → 'license'

// Certificate Detection
if (content.includes('certificate') && content.includes('certif')) → 'certificate'

// Insurance Policy Detection
if (content.includes('policy') && (content.includes('insurance') || content.includes('coverage'))) → 'insurance policy'

// Contract Detection
if (content.includes('agreement') || content.includes('contract')) → 'contract'

// Tax Document Detection
if (content.includes('tax') || content.includes('irs') || content.includes('ein')) → 'tax document'
```

---

## 📋 **4. Performance Optimization**

### **Algorithmic Efficiency**
1. **Early Termination**: Stop at first definitive match (95% confidence)
2. **Hierarchical Processing**: Check highest confidence patterns first
3. **Regex Compilation**: Pre-compile patterns for better performance
4. **Content Truncation**: Limit AI analysis to first 2000 characters

### **Accuracy Improvements**
1. **Multi-Layer Analysis**: Keyword + AI analysis combination
2. **Context Awareness**: Consider question type when evaluating documents
3. **Pattern Recognition**: Use regex for complex linguistic patterns
4. **Negative Detection**: Actively identify non-document questions

---

## 📋 **5. Testing & Validation**

### **Test Categories**
1. **Definitive Document Questions**: Should score 90%+ confidence
2. **Business Documents**: Should correctly identify document types
3. **Negative Cases**: Should properly reject non-document questions
4. **Edge Cases**: Handle ambiguous or complex questions
5. **Document Validation**: Test various document types and quality

### **Quality Metrics**
- **Precision**: % of documents marked as "requires document" that actually do
- **Recall**: % of actual document requirements that are detected
- **Accuracy**: % of correct classifications (both positive and negative)
- **Relevance Score Distribution**: Analysis of score distribution for accepted/rejected documents

---

## 📋 **6. Future Enhancements**

### **Planned Improvements**
1. **PDF/DOCX Extraction**: Implement proper content extraction libraries
2. **OCR Integration**: Add image-to-text conversion for scanned documents
3. **Machine Learning**: Train custom models on vendor onboarding data
4. **Context Learning**: Improve detection based on historical patterns
5. **Multi-language Support**: Handle documents in different languages

### **Advanced Features**
1. **Document Quality Assessment**: Check for readability, completeness
2. **Fraud Detection**: Identify potentially fake or altered documents
3. **Compliance Checking**: Verify documents meet specific regulatory requirements
4. **Automated Data Extraction**: Pull key information from approved documents

---

## 🎯 **Summary**

The enhanced document detection and analysis system uses:

- **7 confidence tiers** for document requirement detection (5% to 95%)
- **5-step analysis process** for document relevance checking
- **Combined AI + keyword analysis** with weighted scoring (40%/60%)
- **Comprehensive rejection criteria** with specific error messages
- **Pattern matching** using regex for complex linguistic structures
- **Document type recognition** for better context-aware analysis

This system provides **significantly improved accuracy** over simple keyword matching while maintaining **fast performance** and **clear explainability** for both acceptance and rejection decisions. 