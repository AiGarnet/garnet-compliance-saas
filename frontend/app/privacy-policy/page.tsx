"use client";

import React from 'react';
import Link from 'next/link';

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center text-white hover:text-purple-200 transition-colors mb-6 group">
            <svg className="h-5 w-5 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-lg text-purple-100">Last Updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 lg:p-12">
          <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-headings:font-semibold prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-p:text-gray-700 prose-p:leading-relaxed prose-li:text-gray-700 prose-strong:text-gray-900 prose-a:text-purple-600 prose-a:no-underline hover:prose-a:text-purple-800 hover:prose-a:underline">
          <h2>1. Introduction</h2>
          <p>
            This Privacy Policy describes how Garnet AI Limited ("Garnet AI," "we," "us," or "our") collects, uses, discloses, and protects personal data when you visit or use <a href="https://www.garnetai.net/" className="text-purple-600 hover:text-purple-800">https://www.garnetai.net/</a> (the "Website") or any of our related services (collectively, the "Service"). By accessing the Website or using the Service, you consent to the collection and use of information as described herein.
          </p>

          <h2>2. Information We Collect</h2>
          <h3>2.1. Account Information</h3>
          <p>
            When you register for an account, subscribe to our services, or contact support, we collect personal data such as your name, email address, company name, billing address, telephone number, and payment information.
          </p>
          
          <h3>2.2. Usage Data</h3>
          <p>
            We collect information about how you use the Service and Website, including pages viewed, features accessed, session duration, and technical data (e.g., IP address, browser type, device identifiers) to monitor and improve our Service.
          </p>

          <h2>3. How We Use Your Information</h2>
          <p>We use personal data to:</p>
          <ul>
            <li>Provide, operate, and maintain the Service.</li>
            <li>Process transactions and send related information, including purchase confirmations and invoices.</li>
            <li>Respond to your questions, comments, and requests for support.</li>
            <li>Send you technical notices, updates, security alerts, and support and administrative messages.</li>
            <li>Communicate with you about products, services, offers, promotions, and events offered by Garnet AI and others, and provide news and information we think will be of interest to you (you may opt out of these marketing communications at any time).</li>
            <li>Monitor and analyze trends, usage, and activities to improve and personalize the Service, including developing new products and services.</li>
            <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities, and protect the rights and property of Garnet AI and others.</li>
            <li>Carry out any other purpose described in this Privacy Policy or with your consent.</li>
          </ul>

          <h2>4. Legal Bases for Processing (GDPR)</h2>
          <p>
            If you are located in the European Economic Area ("EEA"), our lawful bases for collecting and using personal data under the General Data Protection Regulation ("GDPR") depend on the personal data concerned and the specific context in which we collect it. We rely on the following lawful bases:
          </p>
          <ul>
            <li><strong>Consent:</strong> Where you have given us consent to process your personal data for a specific purpose.</li>
            <li><strong>Performance of a Contract:</strong> Where processing is necessary for the performance of a contract to which you are a party or to take steps at your request before entering into a contract.</li>
            <li><strong>Legal Obligation:</strong> Where processing is necessary for compliance with a legal obligation to which we are subject.</li>
            <li><strong>Legitimate Interests:</strong> Where processing is necessary for our legitimate interests or those of a third party, provided those interests are not overridden by your rights or interests.</li>
          </ul>

          <h2>5. How We Share Your Information</h2>
          <h3>5.1. Service Providers</h3>
          <p>
            We may share personal data with vendors, consultants, and other third-party service providers who perform services on our behalf, such as payment processing (e.g., Stripe), hosting and infrastructure (e.g., Amazon Web Services), analytics (e.g., Google Analytics), email delivery (e.g., SendGrid), customer support (e.g., Zendesk), and AI platform providers (e.g., OpenAI). These service providers are contractually obligated to only use your personal data in connection with the services they perform for us and to maintain confidentiality.
          </p>
          
          <h3>5.2. Legal Requirements and Protection of Rights</h3>
          <p>
            We may disclose personal data when required by law, regulation, legal process, or governmental request, or when we believe in good faith that disclosure is necessary to (a) protect our or others' rights, property, or safety; (b) enforce our Terms; or (c) investigate fraud.
          </p>
          
          <h3>5.3. Business Transfers</h3>
          <p>
            In the event of a merger, acquisition, reorganization, sale of assets, or similar transaction involving all or part of our business, personal data may be transferred to the acquiring entity.
          </p>
          
          <h3>5.4. Aggregated or De-Identified Data</h3>
          <p>
            We may share aggregated or de-identified data with third parties for marketing, advertising, research, or other purposes.
          </p>

          <h2>6. Data Retention</h2>
          <p>
            We retain personal data for as long as necessary to fulfill the purposes for which it was collected and to comply with our legal, accounting, or reporting obligations. When determining retention periods, we consider the amount, nature, and sensitivity of the personal data, the potential risk of harm from unauthorized use or disclosure, and the purposes for which we process it. After the retention period ends, we either delete or anonymize personal data or, if this is not possible (for example, because your personal data has been stored in backup archives), then we securely store your personal data and isolate it from any further processing.
          </p>

          <h2>8. Your Rights</h2>
          <h3>8.1. Access, Rectification, and Deletion</h3>
          <p>Depending on your jurisdiction, you may have the right to access, correct, update, or delete your personal data.</p>
          
          <h3>8.2. Data Portability</h3>
          <p>If you are in the EEA, you can request a copy of your personal data in a structured, commonly used, and machine-readable format.</p>
          
          <h3>8.3. Restriction or Objection to Processing</h3>
          <p>You may have the right to restrict or object to certain processing activities.</p>
          
          <h3>8.4. Withdraw Consent</h3>
          <p>Where we rely on consent as a lawful basis for processing, you can withdraw that consent at any time (but this will not affect the lawfulness of processing prior to withdrawal).</p>
          
          <h3>8.5. Right to Lodge a Complaint</h3>
          <p>If you are located in the EEA and believe we have infringed your rights under the GDPR, you have the right to lodge a complaint with a supervisory authority in your member state.</p>
          
          <h3>8.6. California Privacy Rights (CCPA)</h3>
          <p>If you are a California resident, you may have additional rights under the California Consumer Privacy Act, including the right to know what personal data is collected, the right to request deletion of personal data, and the right to opt out of the sale of personal data.</p>
          
          <p>To exercise any of these rights, please contact us as described in Section 12 below.</p>

          <h2>9. Security</h2>
          <p>
            We implement and maintain reasonable administrative, technical, and physical safeguards designed to protect personal data against unauthorized access, disclosure, alteration, or destruction. For example, we use encryption (TLS) to protect data in transit and store data in secure facilities with access controls. However, no security measure is 100% secure, and we cannot guarantee the absolute security of your personal data.
          </p>

          <h2>10. Third-Party Links and Services</h2>
          <p>
            The Service may contain links to third-party websites, products, or services that are not owned or controlled by Garnet AI. We are not responsible for the privacy practices or content of those third parties. We recommend that you review the privacy policies of each third-party service you use.
          </p>

          <h2>11. Children's Privacy</h2>
          <p>
            Our Service is not directed to children under 16 years of age, and we do not knowingly collect personal data from children under 16. If we become aware that we have inadvertently collected personal data from a child under 16, we will take reasonable steps to promptly delete such data.
          </p>

          <h2>12. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time to reflect changes in our practices or applicable laws. If the changes are material, we will provide prominent notice (e.g., via email or a notice on the Website) before the changes take effect and update the "Last Updated" date at the top of this policy. Your continued use of the Service after such changes constitutes your acceptance of the revised Privacy Policy.
          </p>

          <h2>13. Contact Us</h2>
          <p>
            If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:
          </p>
          <p>
            <strong>Email:</strong> <a href="mailto:rusha@garnetai.net" className="text-purple-600 hover:text-purple-800">rusha@garnetai.net</a>
          </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t border-gray-200 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-600">
            © {new Date().getFullYear()} Garnet AI Limited. All rights reserved.
          </p>
          <div className="mt-4 space-x-6">
            <Link href="/privacy-policy" className="text-purple-600 hover:text-purple-800">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="text-purple-600 hover:text-purple-800">
              Terms and Conditions
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage; 