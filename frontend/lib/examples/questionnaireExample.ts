import { QuestionnaireService } from '../services/questionnaireService';
import { Question, QuestionResponseType } from '../types/questionnaire.types';

/**
 * Example demonstrating how to use the QuestionnaireService
 */
export async function questionnaireExample() {
  // Example 1: Generate an answer for a single question
  const singleQuestion = "Does your company have a data protection policy?";
  console.log(`Asking: ${singleQuestion}`);
  
  try {
    const singleResult = await QuestionnaireService.generateAnswer(singleQuestion);
    
    if (singleResult.success && singleResult.data) {
      console.log("Answer:", singleResult.data.answer);
    } else {
      console.error("Error:", singleResult.error);
    }
  } catch (error) {
    console.error("Exception:", error);
  }
  
  // Example 2: Generate answers for multiple questions
  const multipleQuestions = [
    "How do you handle data breaches?",
    "What is your data retention policy?",
    "Do you comply with GDPR requirements?"
  ];
  
  console.log("\nAsking multiple questions:");
  multipleQuestions.forEach(q => console.log(`- ${q}`));
  
  try {
    const batchResult = await QuestionnaireService.generateAnswers(multipleQuestions);
    
    if (batchResult.success && batchResult.data) {
      console.log("\nAnswers:");
      batchResult.data.answers.forEach(item => {
        console.log(`Q: ${item.question}`);
        console.log(`A: ${item.answer}`);
        console.log("---");
      });
      
      console.log("Metadata:", batchResult.data.metadata);
    } else {
      console.error("Error:", batchResult.error);
    }
  } catch (error) {
    console.error("Exception:", error);
  }
}

/**
 * Example showing how to integrate the service with a questionnaire
 */
export async function processQuestionnaire(questions: Question[]) {
  // Extract just the text of each question
  const questionTexts = questions.map(q => q.text);
  
  try {
    // Generate answers for all questions
    const result = await QuestionnaireService.generateAnswers(questionTexts);
    
    if (result.success && result.data) {
      // Map the answers back to the original questions
      const answeredQuestions = questions.map((question, index) => {
        const answerData = result.data!.answers[index];
        return {
          ...question,
          answer: answerData.answer || "No answer available",
          answeredAt: new Date().toISOString()
        };
      });
      
      return {
        success: true,
        answeredQuestions,
        metadata: result.data.metadata
      };
    } else {
      return {
        success: false,
        error: result.error || "Failed to generate answers"
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "An exception occurred"
    };
  }
} 