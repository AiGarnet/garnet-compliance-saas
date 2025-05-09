
import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { RadioGroup } from '@radix-ui/react-radio-group';
import { Checkbox } from '@/components/ui/checkbox';

const QuestionnaireSection = ({ title, description, children }: { 
  title: string;
  description?: string;
  children: React.ReactNode;
}) => (
  <Card className="mb-6">
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      {description && <CardDescription>{description}</CardDescription>}
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

interface QuestionProps {
  id: string;
  question: string;
  type: 'text' | 'radio' | 'checkbox';
  options?: string[];
}

const Question = ({ id, question, type, options = [] }: QuestionProps) => {
  const [answer, setAnswer] = useState<string>('');
  
  return (
    <div className="mb-6 pb-6 border-b last:border-0">
      <FormLabel htmlFor={id} className="block mb-3">{question}</FormLabel>
      
      {type === 'text' && (
        <Input 
          id={id}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="max-w-md"
        />
      )}
      
      {type === 'radio' && options.length > 0 && (
        <div className="space-y-2">
          {options.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="radio"
                id={`${id}-${index}`}
                name={id}
                value={option}
                checked={answer === option}
                onChange={() => setAnswer(option)}
                className="h-4 w-4 border-gray-300 text-garnet focus:ring-garnet"
              />
              <label htmlFor={`${id}-${index}`} className="text-sm">{option}</label>
            </div>
          ))}
        </div>
      )}
      
      {type === 'checkbox' && options.length > 0 && (
        <div className="space-y-2">
          {options.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Checkbox id={`${id}-${index}`} />
              <label htmlFor={`${id}-${index}`} className="text-sm">{option}</label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Questionnaire = () => {
  const form = useForm();
  const frameworks = [
    { id: 'soc2', name: 'SOC 2' },
    { id: 'hipaa', name: 'HIPAA' },
    { id: 'iso27001', name: 'ISO 27001' },
    { id: 'gdpr', name: 'GDPR' }
  ];
  
  const [activeFramework, setActiveFramework] = useState('soc2');
  
  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Security Questionnaire</h1>
        <Button variant="outline">Save Progress</Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Frameworks</CardTitle>
            </CardHeader>
            <CardContent className="px-2">
              <div className="space-y-1">
                {frameworks.map((framework) => (
                  <button 
                    key={framework.id}
                    onClick={() => setActiveFramework(framework.id)}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      activeFramework === framework.id 
                        ? 'bg-garnet/10 text-garnet font-medium' 
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {framework.name}
                  </button>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm font-medium mb-2">Completion</div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-garnet rounded-full"
                    style={{ width: '45%' }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">45% Complete</div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main content */}
        <div className="md:col-span-3">
          <Form {...form}>
            <form>
              <QuestionnaireSection 
                title="Organization Information" 
                description="Basic information about your organization"
              >
                <Question 
                  id="company-name"
                  question="What is your organization's legal name?"
                  type="text"
                />
                <Question 
                  id="company-size"
                  question="What is the size of your organization?"
                  type="radio"
                  options={['1-10 employees', '11-50 employees', '51-200 employees', '201-1000 employees', '1000+ employees']}
                />
                <Question 
                  id="company-industry"
                  question="What industry does your organization operate in?"
                  type="text"
                />
              </QuestionnaireSection>
              
              <QuestionnaireSection 
                title="Data Security"
                description="Information about how your organization handles data security"
              >
                <Question 
                  id="data-encryption"
                  question="Do you encrypt data in transit and at rest?"
                  type="radio"
                  options={['Yes', 'No', 'Partially']}
                />
                <Question 
                  id="data-backup"
                  question="How often do you perform data backups?"
                  type="radio"
                  options={['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annually']}
                />
                <Question 
                  id="security-controls"
                  question="Which security controls do you have in place? (Select all that apply)"
                  type="checkbox"
                  options={[
                    'Firewalls', 
                    'Intrusion Detection/Prevention', 
                    'Multi-factor Authentication', 
                    'Anti-malware', 
                    'Data Loss Prevention'
                  ]}
                />
              </QuestionnaireSection>
              
              <div className="flex justify-between mt-6">
                <Button variant="outline">Previous Section</Button>
                <Button className="bg-garnet hover:bg-garnet-dark">Next Section</Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Questionnaire;
