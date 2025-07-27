import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';

@Entity('checklists')
export class Checklist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'vendor_id' })
  vendorId: string;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('varchar', { length: 50, name: 'file_type' })
  fileType: string;

  @Column('integer', { name: 'file_size', nullable: true })
  fileSize: number;

  @Column('varchar', { length: 255, name: 'original_filename' })
  originalFilename: string;

  @Column('text', { name: 'file_content', nullable: true })
  fileContent: string;

  @Column('varchar', { length: 20, name: 'extraction_status', default: 'pending' })
  extractionStatus: string;

  @Column('integer', { name: 'question_count', default: 0 })
  questionCount: number;

  @Column('timestamp', { name: 'upload_date', default: () => 'CURRENT_TIMESTAMP' })
  uploadDate: Date;

  @Column('uuid', { name: 'uploaded_by', nullable: true })
  uploadedBy: string;

  @Column('text', { name: 'spaces_key', nullable: true })
  spacesKey: string;

  @Column('text', { name: 'spaces_url', nullable: true })
  spacesUrl: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => ChecklistQuestion, question => question.checklist)
  questions: ChecklistQuestion[];
}

@Entity('checklist_questions')
export class ChecklistQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'checklist_id' })
  checklistId: string;

  @Column('uuid', { name: 'vendor_id' })
  vendorId: string;

  @Column('text', { name: 'question_text' })
  questionText: string;

  @Column('integer', { name: 'question_order' })
  questionOrder: number;

  @Column('varchar', { length: 20, default: 'pending' })
  status: string;

  @Column('text', { name: 'ai_answer', nullable: true })
  aiAnswer: string;

  @Column('decimal', { precision: 3, scale: 2, name: 'confidence_score', nullable: true })
  confidenceScore: number;

  @Column('boolean', { name: 'requires_document', default: false })
  requiresDocument: boolean;

  @Column('text', { name: 'document_description', nullable: true })
  documentDescription: string;

  @Column('decimal', { precision: 3, scale: 2, name: 'requires_document_confidence_score', nullable: true })
  requiresDocumentConfidenceScore: number;

  @Column('text', { name: 'requires_document_reason', nullable: true })
  requiresDocumentReason: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Checklist, checklist => checklist.questions)
  @JoinColumn({ name: 'checklist_id' })
  checklist: Checklist;

  @OneToMany(() => ChecklistSupportingDocument, document => document.question)
  supportingDocuments: ChecklistSupportingDocument[];
}

@Entity('checklist_supporting_documents')
export class ChecklistSupportingDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'question_id' })
  questionId: string;

  @Column('uuid', { name: 'vendor_id' })
  vendorId: string;

  @Column('varchar', { length: 255 })
  filename: string;

  @Column('varchar', { length: 50, name: 'file_type', nullable: true })
  fileType: string;

  @Column('integer', { name: 'file_size', nullable: true })
  fileSize: number;

  @Column('text', { name: 'file_path', nullable: true })
  filePath: string;

  @Column('timestamp', { name: 'uploaded_at', default: () => 'CURRENT_TIMESTAMP' })
  uploadedAt: Date;

  @Column('uuid', { name: 'uploaded_by', nullable: true })
  uploadedBy: string;

  @Column('text', { name: 'spaces_key', nullable: true })
  spacesKey: string;

  @Column('text', { name: 'spaces_url', nullable: true })
  spacesUrl: string;

  @ManyToOne(() => ChecklistQuestion, question => question.supportingDocuments)
  @JoinColumn({ name: 'question_id' })
  question: ChecklistQuestion;
} 