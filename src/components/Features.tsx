
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "Automated Compliance",
    description: "Save time with automated assessments that evaluate your security posture against industry standards.",
  },
  {
    title: "Continuous Monitoring",
    description: "Receive real-time alerts on security vulnerabilities and compliance gaps.",
  },
  {
    title: "Evidence Collection",
    description: "Automatically gather and organize evidence required for security audits.",
  },
  {
    title: "Risk Management",
    description: "Identify, assess, and remediate security risks before they become threats.",
  }
];

const Features = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border-t-4 border-t-garnet">
              <CardHeader>
                <CardTitle className="text-xl font-bold">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
