"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Eye, Lock } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Link 
              href="/"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </Link>
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-purple-600" />
              <span className="text-lg font-semibold text-gray-900">Privacy Policy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-12 text-white">
            <div className="flex items-center space-x-4 mb-4">
              <div className="bg-white/20 rounded-lg p-3">
                <Eye className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Privacy Policy</h1>
                <p className="text-purple-100 mt-2">Last updated: January 2025</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-12">
            <div className="prose prose-gray max-w-none">
              
              {/* Section 1 - Introduction */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="bg-purple-100 text-purple-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">1</span>
                  Introduction
                </h2>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-gray-700 leading-relaxed">
                    This Privacy Policy describes how Garnet AI Limited ("Garnet AI," "we," "us," or "our") collects, uses, discloses, and protects personal data when you visit or use https://www.garnetai.net/ (the "Website") or any of our related services (collectively, the "Service"). By accessing the Website or using the Service, you consent to the collection and use of information as described herein.
                  </p>
                </div>
              </section>

              {/* Section 2 - Information We Collect */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="bg-purple-100 text-purple-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">2</span>
                  Information We Collect
                </h2>
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                    <h3 className="font-semibold text-gray-900 mb-2">2.1. Account Information</h3>
                    <p className="text-gray-700">
                      When you register for an account, subscribe to our services, or contact support, we collect personal data such as your name, email address, company name, billing address, telephone number, and payment information.
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
                    <h3 className="font-semibold text-gray-900 mb-2">2.2. Usage Data</h3>
                    <p className="text-gray-700">
                      We collect information about how you use the Service and Website, including pages viewed, features accessed, session duration, and technical data (e.g., IP address, browser type, device identifiers) to monitor and improve our Service.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 3 - How We Use Your Information */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="bg-purple-100 text-purple-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">3</span>
                  How We Use Your Information
                </h2>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-gray-700 mb-4"><strong>We use personal data to:</strong></p>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-purple-500 mr-2">•</span>
                      Provide, operate, and maintain the Service.
                    </li>
                    <li className="flex items-start">
                      <span className="text-purple-500 mr-2">•</span>
                      Process transactions and send related information, including purchase confirmations and invoices.
                    </li>
                    <li className="flex items-start">
                      <span className="text-purple-500 mr-2">•</span>
                      Respond to your questions, comments, and requests for support.
                    </li>
                    <li className="flex items-start">
                      <span className="text-purple-500 mr-2">•</span>
                      Send you technical notices, updates, security alerts, and support and administrative messages.
                    </li>
                    <li className="flex items-start">
                      <span className="text-purple-500 mr-2">•</span>
                      Communicate with you about products, services, offers, promotions, and events offered by Garnet AI and others, and provide news and information we think will be of interest to you (you may opt out of these marketing communications at any time).
                    </li>
                    <li className="flex items-start">
                      <span className="text-purple-500 mr-2">•</span>
                      Monitor and analyze trends, usage, and activities to improve and personalize the Service, including developing new products and services.
                    </li>
                    <li className="flex items-start">
                      <span className="text-purple-500 mr-2">•</span>
                      Detect, investigate, and prevent fraudulent transactions and other illegal activities, and protect the rights and property of Garnet AI and others.
                    </li>
                    <li className="flex items-start">
                      <span className="text-purple-500 mr-2">•</span>
                      Carry out any other purpose described in this Privacy Policy or with your consent.
                    </li>
                  </ul>
                </div>
              </section>

              {/* Section 4 - Legal Bases for Processing (GDPR) */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="bg-purple-100 text-purple-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">4</span>
                  Legal Bases for Processing (GDPR)
                </h2>
                <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-400">
                  <p className="text-gray-700 mb-4">
                    If you are located in the European Economic Area ("EEA"), our lawful bases for collecting and using personal data under the General Data Protection Regulation ("GDPR") depend on the personal data concerned and the specific context in which we collect it. We rely on the following lawful bases:
                  </p>
                  <ul className="space-y-3 text-gray-700">
                    <li><strong>Consent:</strong> Where you have given us consent to process your personal data for a specific purpose.</li>
                    <li><strong>Performance of a Contract:</strong> Where processing is necessary for the performance of a contract to which you are a party or to take steps at your request before entering into a contract.</li>
                    <li><strong>Legal Obligation:</strong> Where processing is necessary for compliance with a legal obligation to which we are subject.</li>
                    <li><strong>Legitimate Interests:</strong> Where processing is necessary for our legitimate interests or those of a third party, provided those interests are not overridden by your rights or interests.</li>
                  </ul>
                </div>
              </section>

              {/* Section 5 - How We Share Your Information */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="bg-purple-100 text-purple-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">5</span>
                  How We Share Your Information
                </h2>
                <div className="space-y-4">
                  <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                    <h3 className="font-semibold text-gray-900 mb-2">5.1. Service Providers</h3>
                    <p className="text-gray-700">
                      We may share personal data with vendors, consultants, and other third-party service providers who perform services on our behalf, such as payment processing (e.g., Stripe), hosting and infrastructure (e.g., Amazon Web Services), analytics (e.g., Google Analytics), email delivery (e.g., SendGrid), customer support (e.g., Zendesk), and AI platform providers (e.g., OpenAI). These service providers are contractually obligated to only use your personal data in connection with the services they perform for us and to maintain confidentiality.
                    </p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-400">
                    <h3 className="font-semibold text-gray-900 mb-2">5.2. Legal Requirements and Protection of Rights</h3>
                    <p className="text-gray-700">
                      We may disclose personal data when required by law, regulation, legal process, or governmental request, or when we believe in good faith that disclosure is necessary to (a) protect our or others' rights, property, or safety; (b) enforce our Terms; or (c) investigate fraud.
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
                    <h3 className="font-semibold text-gray-900 mb-2">5.3. Business Transfers</h3>
                    <p className="text-gray-700">
                      In the event of a merger, acquisition, reorganization, sale of assets, or similar transaction involving all or part of our business, personal data may be transferred to the acquiring entity.
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">5.4. Aggregated or De-Identified Data</h3>
                    <p className="text-gray-700">
                      We may share aggregated or de-identified data with third parties for marketing, advertising, research, or other purposes.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 6 - Data Retention */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="bg-purple-100 text-purple-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">6</span>
                  Data Retention
                </h2>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-gray-700 leading-relaxed">
                    We retain personal data for as long as necessary to fulfill the purposes for which it was collected and to comply with our legal, accounting, or reporting obligations. When determining retention periods, we consider the amount, nature, and sensitivity of the personal data, the potential risk of harm from unauthorized use or disclosure, and the purposes for which we process it. After the retention period ends, we either delete or anonymize personal data or, if this is not possible (for example, because your personal data has been stored in backup archives), then we securely store your personal data and isolate it from any further processing.
                  </p>
                </div>
              </section>

              {/* Section 8 - Your Rights */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="bg-purple-100 text-purple-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">8</span>
                  Your Rights
                </h2>
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">8.1. Access, Rectification, and Deletion</h3>
                    <p className="text-gray-700">Depending on your jurisdiction, you may have the right to access, correct, update, or delete your personal data.</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">8.2. Data Portability</h3>
                    <p className="text-gray-700">If you are in the EEA, you can request a copy of your personal data in a structured, commonly used, and machine-readable format.</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">8.3. Restriction or Objection to Processing</h3>
                    <p className="text-gray-700">You may have the right to restrict or object to certain processing activities.</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">8.4. Withdraw Consent</h3>
                    <p className="text-gray-700">Where we rely on consent as a lawful basis for processing, you can withdraw that consent at any time (but this will not affect the lawfulness of processing prior to withdrawal).</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">8.5. Right to Lodge a Complaint</h3>
                    <p className="text-gray-700">If you are located in the EEA and believe we have infringed your rights under the GDPR, you have the right to lodge a complaint with a supervisory authority in your member state.</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">8.6. California Privacy Rights (CCPA)</h3>
                    <p className="text-gray-700">If you are a California resident, you may have additional rights under the California Consumer Privacy Act, including the right to know what personal data is collected, the right to request deletion of personal data, and the right to opt out of the sale of personal data.</p>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                  <p className="text-gray-700 text-sm">
                    <strong>To exercise any of these rights, please contact us as described in Section 13 below.</strong>
                  </p>
                </div>
              </section>

              {/* Section 9 - Security */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="bg-purple-100 text-purple-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">9</span>
                  Security
                </h2>
                <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
                  <div className="flex items-start space-x-3">
                    <Lock className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-gray-700 leading-relaxed">
                        We implement and maintain reasonable administrative, technical, and physical safeguards designed to protect personal data against unauthorized access, disclosure, alteration, or destruction. For example, we use encryption (TLS) to protect data in transit and store data in secure facilities with access controls. However, no security measure is 100% secure, and we cannot guarantee the absolute security of your personal data.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 10 - Third-Party Links and Services */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="bg-purple-100 text-purple-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">10</span>
                  Third-Party Links and Services
                </h2>
                <div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-400">
                  <p className="text-gray-700 leading-relaxed">
                    The Service may contain links to third-party websites, products, or services that are not owned or controlled by Garnet AI. We are not responsible for the privacy practices or content of those third parties. We recommend that you review the privacy policies of each third-party service you use.
                  </p>
                </div>
              </section>

              {/* Section 11 - Children's Privacy */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="bg-purple-100 text-purple-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">11</span>
                  Children's Privacy
                </h2>
                <div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-400">
                  <p className="text-gray-700 leading-relaxed">
                    Our Service is not directed to children under 16 years of age, and we do not knowingly collect personal data from children under 16. If we become aware that we have inadvertently collected personal data from a child under 16, we will take reasonable steps to promptly delete such data.
                  </p>
                </div>
              </section>

              {/* Section 12 - Changes to This Privacy Policy */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="bg-purple-100 text-purple-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">12</span>
                  Changes to This Privacy Policy
                </h2>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-gray-700 leading-relaxed">
                    We may update this Privacy Policy from time to time to reflect changes in our practices or applicable laws. If the changes are material, we will provide prominent notice (e.g., via email or a notice on the Website) before the changes take effect and update the "Last Updated" date at the top of this policy. Your continued use of the Service after such changes constitutes your acceptance of the revised Privacy Policy.
                  </p>
                </div>
              </section>

              {/* Section 13 - Contact Us */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="bg-purple-100 text-purple-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">13</span>
                  Contact Us
                </h2>
                <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-400">
                  <p className="text-gray-700 leading-relaxed">
                    If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:
                  </p>
                  <div className="mt-4">
                    <p className="text-gray-700"><strong>Email:</strong> rusha@garnetai.net</p>
                  </div>
                </div>
              </section>

            </div>

            {/* Contact Information */}
            <div className="mt-12 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Questions about this Privacy Policy?</h3>
              <p className="text-gray-700 mb-4">
                If you have any questions about how we handle your personal information, please don't hesitate to contact us:
              </p>
              <div className="space-y-2 text-gray-700">
                <p><strong>Email:</strong> rusha@garnetai.net</p>
                <p><strong>Company:</strong> Garnet AI Limited</p>
                <p><strong>Jurisdiction:</strong> Ireland</p>
                <p><strong>Data Protection:</strong> GDPR Compliant</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 