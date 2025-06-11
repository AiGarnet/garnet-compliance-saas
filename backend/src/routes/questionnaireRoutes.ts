import { Router } from 'express';
import { QuestionnaireController } from '../controllers/questionnaireController';

const router = Router();
const questionnaireController = new QuestionnaireController();

// Create a new questionnaire
router.post('/', questionnaireController.createQuestionnaire.bind(questionnaireController));

// Get all questionnaires
router.get('/', questionnaireController.getAllQuestionnaires.bind(questionnaireController));

// Get a specific questionnaire by ID
router.get('/:id', questionnaireController.getQuestionnaireById.bind(questionnaireController));

// Get questions for a specific questionnaire
router.get('/:id/questions', questionnaireController.getQuestionnaireQuestions.bind(questionnaireController));

// Update a specific questionnaire
router.put('/:id', questionnaireController.updateQuestionnaire.bind(questionnaireController));

// Update a specific question in a questionnaire
router.put('/:id/questions/:questionId', questionnaireController.updateQuestion.bind(questionnaireController));

// Delete a questionnaire
router.delete('/:id', questionnaireController.deleteQuestionnaire.bind(questionnaireController));

export default router; 