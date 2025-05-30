import React, { useState, useEffect } from 'react';
import { QuestionnaireService } from '../services/questionnaireService';
import { VendorService } from '../services/vendorService';
import { Vendor } from '../types/vendor.types';

/**
 * Component that demonstrates how to generate answers to questions
 * and save them to a vendor
 */
export function VendorQuestionnaireExample() {
  // State for form inputs
  const [questions, setQuestions] = useState<string[]>([
    "Does your company have a data protection policy?",
    "How do you handle data breaches?",
    "What is your data retention policy?"
  ]);
  const [vendorId, setVendorId] = useState<string>("");
  const [vendorName, setVendorName] = useState<string>("");
  const [isCreatingNewVendor, setIsCreatingNewVendor] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  
  // Fetch vendors when component mounts
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const vendorData = await VendorService.getAllVendors();
        setVendors(vendorData);
      } catch (err) {
        console.error("Error fetching vendors:", err);
      }
    };
    
    fetchVendors();
  }, []);
  
  // Handle toggling between existing and new vendor
  const toggleVendorMode = () => {
    setIsCreatingNewVendor(!isCreatingNewVendor);
    setVendorId("");
    setVendorName("");
  };
  
  // Handle adding a new question
  const addQuestion = () => {
    setQuestions([...questions, ""]);
  };
  
  // Handle updating a question
  const updateQuestion = (index: number, value: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = value;
    setQuestions(updatedQuestions);
  };
  
  // Handle removing a question
  const removeQuestion = (index: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions.splice(index, 1);
    setQuestions(updatedQuestions);
  };
  
  // Process the questionnaire
  const processQuestionnaire = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setResult(null);
      
      // Filter out empty questions
      const validQuestions = questions.filter(q => q.trim() !== "");
      
      if (validQuestions.length === 0) {
        setError("Please add at least one question");
        setIsLoading(false);
        return;
      }
      
      if (isCreatingNewVendor && !vendorName.trim()) {
        setError("Please enter a vendor name");
        setIsLoading(false);
        return;
      }
      
      if (!isCreatingNewVendor && !vendorId) {
        setError("Please select a vendor");
        setIsLoading(false);
        return;
      }
      
      // Step 1: Generate answers to questions
      const answersResult = await QuestionnaireService.generateAnswers(validQuestions);
      
      if (!answersResult.success || !answersResult.data) {
        throw new Error(answersResult.error || "Failed to generate answers");
      }
      
      // Step 2: Save answers to vendor
      const saveResult = await QuestionnaireService.saveQuestionnaireToVendor(
        isCreatingNewVendor ? null : vendorId,
        isCreatingNewVendor ? vendorName : null,
        answersResult.data.answers
      );
      
      if (!saveResult.success) {
        throw new Error(saveResult.error || "Failed to save questionnaire to vendor");
      }
      
      // Step 3: Get the updated/created vendor
      const updatedVendor = await VendorService.getVendorById(saveResult.vendorId!);
      
      setResult({
        vendor: updatedVendor,
        answers: answersResult.data.answers,
        metadata: answersResult.data.metadata
      });
      
    } catch (err: any) {
      setError(err.message || "An error occurred");
      console.error("Error processing questionnaire:", err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Vendor Questionnaire</h1>
      
      {/* Vendor Selection */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <label className="font-medium">
            <input
              type="radio"
              checked={!isCreatingNewVendor}
              onChange={toggleVendorMode}
              className="mr-2"
            />
            Existing Vendor
          </label>
          <label className="font-medium">
            <input
              type="radio"
              checked={isCreatingNewVendor}
              onChange={toggleVendorMode}
              className="mr-2"
            />
            New Vendor
          </label>
        </div>
        
        {isCreatingNewVendor ? (
          <div>
            <label className="block text-sm font-medium mb-1">Vendor Name</label>
            <input
              type="text"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              className="border rounded-md px-3 py-2 w-full"
              placeholder="Enter vendor name"
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium mb-1">Select Vendor</label>
            <select
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              className="border rounded-md px-3 py-2 w-full"
            >
              <option value="">-- Select a vendor --</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      {/* Questions */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-medium">Questions</h2>
          <button
            type="button"
            onClick={addQuestion}
            className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm"
          >
            Add Question
          </button>
        </div>
        
        {questions.map((question, index) => (
          <div key={index} className="mb-3 flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => updateQuestion(index, e.target.value)}
              className="border rounded-md px-3 py-2 flex-grow"
              placeholder="Enter your question"
            />
            <button
              type="button"
              onClick={() => removeQuestion(index)}
              className="px-3 py-1 bg-red-600 text-white rounded-md text-sm"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      
      {/* Submit Button */}
      <div className="mb-6">
        <button
          type="button"
          onClick={processQuestionnaire}
          disabled={isLoading}
          className={`px-4 py-2 rounded-md text-white ${
            isLoading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {isLoading ? "Processing..." : "Generate Answers & Save to Vendor"}
        </button>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {/* Results Display */}
      {result && (
        <div className="border rounded-md p-4">
          <h2 className="text-lg font-medium mb-2">Results</h2>
          
          <div className="mb-4">
            <h3 className="font-medium">Vendor Information</h3>
            <p>Name: {result.vendor.name}</p>
            <p>ID: {result.vendor.id}</p>
            <p>Status: {result.vendor.status}</p>
            <p>Risk Level: {result.vendor.riskLevel}</p>
          </div>
          
          <div className="mb-4">
            <h3 className="font-medium">Answers</h3>
            {result.answers.map((item: any, index: number) => (
              <div key={index} className="mb-3 p-3 bg-gray-50 rounded-md">
                <p className="font-medium">Q: {item.question}</p>
                <p className="mt-1">A: {item.answer}</p>
              </div>
            ))}
          </div>
          
          <div>
            <h3 className="font-medium">Metadata</h3>
            <p>Total Questions: {result.metadata.totalQuestions}</p>
            <p>Processing Time: {result.metadata.processingTimeMs}ms</p>
            <p>Timestamp: {result.metadata.timestamp}</p>
          </div>
        </div>
      )}
    </div>
  );
} 