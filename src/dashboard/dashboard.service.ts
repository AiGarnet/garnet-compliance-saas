import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface PendingTask {
  id: string;
  type: 'checklist_upload' | 'question_generation' | 'supporting_docs' | 'trust_portal_submission';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  vendorId: number;
  vendorName: string;
  checklistId?: string;
  checklistName?: string;
  questionCount?: number;
  completedQuestions?: number;
  missingDocuments?: number;
  createdAt: Date;
  navigationUrl: string;
  actionText: string;
}

export interface FeedbackNavigation {
  feedbackId: number;
  feedbackType: string;
  subject: string;
  vendorId: number;
  vendorName: string;
  navigationUrl: string;
  actionText: string;
  description: string;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Get pending tasks for a user's organization
   */
  async getPendingTasks(userId: string): Promise<PendingTask[]> {
    try {
      // Get user's organization
      const userQuery = `
        SELECT organization_id, organization
        FROM users
        WHERE id = $1
      `;
      
      const userResult = await this.databaseService.query(userQuery, [userId]);
      
      if (userResult.rows.length === 0 || !userResult.rows[0].organization_id) {
        return [];
      }
      
      const organizationId = userResult.rows[0].organization_id;
      const tasks: PendingTask[] = [];

      // 1. Check for uploaded checklists without questions generated
      const checklistsNeedingExtraction = await this.databaseService.query(`
        SELECT 
          c.id,
          c.name,
          c.vendor_id,
          c.extraction_status,
          c.question_count,
          c.upload_date,
          v.company_name as vendor_name
        FROM checklists c
        INNER JOIN vendors v ON c.vendor_id = v.uuid
        WHERE v.organization_id = $1
          AND c.extraction_status IN ('pending', 'extracting')
        ORDER BY c.upload_date DESC
      `, [organizationId]);

      for (const checklist of checklistsNeedingExtraction.rows) {
        tasks.push({
          id: `checklist_extraction_${checklist.id}`,
          type: 'question_generation',
          title: 'Question Generation Pending',
          description: `Checklist "${checklist.name}" is still processing. Question extraction is ${checklist.extraction_status}.`,
          priority: checklist.extraction_status === 'pending' ? 'medium' : 'high',
          vendorId: checklist.vendor_id,
          vendorName: checklist.vendor_name,
          checklistId: checklist.id,
          checklistName: checklist.name,
          createdAt: checklist.upload_date,
          navigationUrl: `/checklists?vendor=${checklist.vendor_id}&checklist=${checklist.id}`,
          actionText: 'View Checklist'
        });
      }

      // 2. Check for checklists with questions but no AI answers
      const checklistsNeedingAnswers = await this.databaseService.query(`
        SELECT 
          c.id,
          c.name,
          c.vendor_id,
          c.question_count,
          c.upload_date,
          v.company_name as vendor_name,
          COUNT(cq.id) as total_questions,
          COUNT(CASE WHEN cq.status = 'completed' AND cq.ai_answer IS NOT NULL THEN 1 END) as completed_questions
        FROM checklists c
        INNER JOIN vendors v ON c.vendor_id = v.uuid
        LEFT JOIN checklist_questions cq ON c.id = cq.checklist_id
        WHERE v.organization_id = $1
          AND c.extraction_status = 'completed'
          AND c.question_count > 0
        GROUP BY c.id, c.name, c.vendor_id, c.question_count, c.upload_date, v.company_name
        HAVING COUNT(CASE WHEN cq.status = 'completed' AND cq.ai_answer IS NOT NULL THEN 1 END) < COUNT(cq.id)
        ORDER BY c.upload_date DESC
      `, [organizationId]);

      for (const checklist of checklistsNeedingAnswers.rows) {
        const pendingQuestions = checklist.total_questions - checklist.completed_questions;
        tasks.push({
          id: `checklist_answers_${checklist.id}`,
          type: 'question_generation',
          title: 'AI Answer Generation Pending',
          description: `${pendingQuestions} questions in "${checklist.name}" need AI answers generated.`,
          priority: 'medium',
          vendorId: checklist.vendor_id,
          vendorName: checklist.vendor_name,
          checklistId: checklist.id,
          checklistName: checklist.name,
          questionCount: checklist.total_questions,
          completedQuestions: checklist.completed_questions,
          createdAt: checklist.upload_date,
          navigationUrl: `/checklists?vendor=${checklist.vendor_id}&checklist=${checklist.id}`,
          actionText: 'Generate Answers'
        });
      }

      // 3. Check for questions requiring supporting documents
      const questionsNeedingDocs = await this.databaseService.query(`
        SELECT 
          c.id as checklist_id,
          c.name as checklist_name,
          c.vendor_id,
          v.company_name as vendor_name,
          COUNT(cq.id) as questions_needing_docs,
          COUNT(csd.id) as documents_uploaded
        FROM checklists c
        INNER JOIN vendors v ON c.vendor_id = v.uuid
        INNER JOIN checklist_questions cq ON c.id = cq.checklist_id
        LEFT JOIN checklist_supporting_documents csd ON cq.id = csd.question_id
        WHERE v.organization_id = $1
          AND cq.requires_document = true
          AND cq.status = 'completed'
          AND cq.ai_answer IS NOT NULL
        GROUP BY c.id, c.name, c.vendor_id, v.company_name
        HAVING COUNT(csd.id) < COUNT(cq.id)
        ORDER BY c.upload_date DESC
      `, [organizationId]);

      for (const checklist of questionsNeedingDocs.rows) {
        const missingDocs = checklist.questions_needing_docs - checklist.documents_uploaded;
        tasks.push({
          id: `checklist_docs_${checklist.checklist_id}`,
          type: 'supporting_docs',
          title: 'Supporting Documents Required',
          description: `${missingDocs} questions in "${checklist.checklist_name}" require supporting documents.`,
          priority: 'high',
          vendorId: checklist.vendor_id,
          vendorName: checklist.vendor_name,
          checklistId: checklist.checklist_id,
          checklistName: checklist.checklist_name,
          missingDocuments: missingDocs,
          createdAt: new Date(),
          navigationUrl: `/checklists?vendor=${checklist.vendor_id}&checklist=${checklist.checklist_id}&tab=documents`,
          actionText: 'Upload Documents'
        });
      }

      // 4. Check for completed checklists not sent to Trust Portal
      const checklistsReadyForTrustPortal = await this.databaseService.query(`
        SELECT 
          c.id,
          c.name,
          c.vendor_id,
          c.question_count,
          c.upload_date,
          v.company_name as vendor_name,
          COUNT(cq.id) as total_questions,
          COUNT(CASE WHEN cq.status = 'completed' AND cq.ai_answer IS NOT NULL THEN 1 END) as completed_questions,
          COUNT(CASE WHEN cq.requires_document = true THEN 1 END) as questions_needing_docs,
          COUNT(csd.id) as documents_uploaded
        FROM checklists c
        INNER JOIN vendors v ON c.vendor_id = v.uuid
        INNER JOIN checklist_questions cq ON c.id = cq.checklist_id
        LEFT JOIN checklist_supporting_documents csd ON cq.id = csd.question_id AND cq.requires_document = true
        LEFT JOIN trust_portal_items tpi ON c.id = tpi.questionnaire_id
        WHERE v.organization_id = $1
          AND c.extraction_status = 'completed'
          AND c.question_count > 0
          AND tpi.id IS NULL  -- Not yet sent to trust portal
        GROUP BY c.id, c.name, c.vendor_id, c.question_count, c.upload_date, v.company_name
        HAVING 
          COUNT(CASE WHEN cq.status = 'completed' AND cq.ai_answer IS NOT NULL THEN 1 END) = COUNT(cq.id)
          AND (
            COUNT(CASE WHEN cq.requires_document = true THEN 1 END) = 0 
            OR COUNT(csd.id) = COUNT(CASE WHEN cq.requires_document = true THEN 1 END)
          )
        ORDER BY c.upload_date DESC
      `, [organizationId]);

      for (const checklist of checklistsReadyForTrustPortal.rows) {
        tasks.push({
          id: `checklist_trust_portal_${checklist.id}`,
          type: 'trust_portal_submission',
          title: 'Ready for Trust Portal',
          description: `Checklist "${checklist.name}" is complete and ready to be shared on Trust Portal.`,
          priority: 'low',
          vendorId: checklist.vendor_id,
          vendorName: checklist.vendor_name,
          checklistId: checklist.id,
          checklistName: checklist.name,
          questionCount: checklist.total_questions,
          completedQuestions: checklist.completed_questions,
          createdAt: checklist.upload_date,
          navigationUrl: `/checklists?vendor=${checklist.vendor_id}&checklist=${checklist.id}&tab=trust-portal`,
          actionText: 'Send to Trust Portal'
        });
      }

      return tasks.sort((a, b) => {
        // Sort by priority first, then by date
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

    } catch (error) {
      this.logger.error(`Failed to get pending tasks: ${error.message}`);
      return [];
    }
  }

  /**
   * Get smart navigation info for feedback
   */
  async getFeedbackNavigation(feedbackId: number): Promise<FeedbackNavigation | null> {
    try {
      const query = `
        SELECT 
          f.id,
          f.feedback_type,
          f.subject,
          f.message,
          f.vendor_id,
          v.company_name as vendor_name,
          v.uuid as vendor_uuid
        FROM trust_portal_feedback f
        INNER JOIN vendors v ON f.vendor_id = v.vendor_id
        WHERE f.id = $1
      `;

      const result = await this.databaseService.query(query, [feedbackId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const feedback = result.rows[0];
      let navigationUrl = `/dashboard`;
      let actionText = 'View Dashboard';
      let description = 'Navigate to relevant section';

      // Smart navigation based on feedback type and content
      switch (feedback.feedback_type) {
        case 'document_request':
          navigationUrl = `/checklists?vendor=${feedback.vendor_uuid}&tab=documents`;
          actionText = 'Upload Documents';
          description = 'Upload the requested supporting documents';
          break;
        
        case 'clarification':
          // Check if it's about specific questions
          if (feedback.message.toLowerCase().includes('question') || 
              feedback.message.toLowerCase().includes('questionnaire')) {
            navigationUrl = `/questionnaires?vendor=${feedback.vendor_uuid}`;
            actionText = 'View Questionnaire';
            description = 'Review and clarify questionnaire answers';
          } else {
            navigationUrl = `/checklists?vendor=${feedback.vendor_uuid}`;
            actionText = 'View Checklists';
            description = 'Review compliance checklists';
          }
          break;
        
        case 'compliance_issue':
          navigationUrl = `/compliance?vendor=${feedback.vendor_uuid}`;
          actionText = 'View Compliance';
          description = 'Address compliance concerns';
          break;
        
        case 'follow_up':
          navigationUrl = `/trust-portal?vendor=${feedback.vendor_uuid}`;
          actionText = 'View Trust Portal';
          description = 'Follow up on trust portal submission';
          break;
        
        default: // 'general'
          navigationUrl = `/vendors/${feedback.vendor_uuid}`;
          actionText = 'View Vendor';
          description = 'View vendor details and status';
      }

      return {
        feedbackId: feedback.id,
        feedbackType: feedback.feedback_type,
        subject: feedback.subject,
        vendorId: feedback.vendor_id,
        vendorName: feedback.vendor_name,
        navigationUrl,
        actionText,
        description
      };

    } catch (error) {
      this.logger.error(`Failed to get feedback navigation: ${error.message}`);
      return null;
    }
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(userId: string): Promise<{
    totalVendors: number;
    totalChecklists: number;
    completedChecklists: number;
    pendingTasks: number;
    totalFeedback: number;
    unreadFeedback: number;
  }> {
    try {
      // Get user's organization
      const userQuery = `
        SELECT organization_id
        FROM users
        WHERE id = $1
      `;
      
      const userResult = await this.databaseService.query(userQuery, [userId]);
      
      if (userResult.rows.length === 0 || !userResult.rows[0].organization_id) {
        return {
          totalVendors: 0,
          totalChecklists: 0,
          completedChecklists: 0,
          pendingTasks: 0,
          totalFeedback: 0,
          unreadFeedback: 0
        };
      }
      
      const organizationId = userResult.rows[0].organization_id;

      // Get all stats in parallel
      const [
        vendorStats,
        checklistStats,
        feedbackStats,
        pendingTasks
      ] = await Promise.all([
        this.databaseService.query(`
          SELECT COUNT(*) as total_vendors
          FROM vendors
          WHERE organization_id = $1
        `, [organizationId]),
        
        this.databaseService.query(`
          SELECT 
            COUNT(*) as total_checklists,
            COUNT(CASE WHEN extraction_status = 'completed' THEN 1 END) as completed_checklists
          FROM checklists c
          INNER JOIN vendors v ON c.vendor_id = v.uuid
          WHERE v.organization_id = $1
        `, [organizationId]),
        
        this.databaseService.query(`
          SELECT 
            COUNT(*) as total_feedback,
            COUNT(CASE WHEN f.status = 'pending' THEN 1 END) as unread_feedback
          FROM trust_portal_feedback f
          INNER JOIN vendors v ON f.vendor_id = v.vendor_id
          WHERE v.organization_id = $1
        `, [organizationId]),
        
        this.getPendingTasks(userId)
      ]);

      return {
        totalVendors: parseInt(vendorStats.rows[0].total_vendors),
        totalChecklists: parseInt(checklistStats.rows[0].total_checklists),
        completedChecklists: parseInt(checklistStats.rows[0].completed_checklists),
        pendingTasks: pendingTasks.length,
        totalFeedback: parseInt(feedbackStats.rows[0].total_feedback),
        unreadFeedback: parseInt(feedbackStats.rows[0].unread_feedback)
      };

    } catch (error) {
      this.logger.error(`Failed to get dashboard stats: ${error.message}`);
      return {
        totalVendors: 0,
        totalChecklists: 0,
        completedChecklists: 0,
        pendingTasks: 0,
        totalFeedback: 0,
        unreadFeedback: 0
      };
    }
  }
} 