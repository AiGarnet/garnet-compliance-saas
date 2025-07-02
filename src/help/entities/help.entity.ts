import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('help_requests')
export class HelpRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'vendor_id' })
  vendorId: string;

  @Column('text', { name: 'user_question' })
  userQuestion: string;

  @Column('text', { name: 'ai_response' })
  aiResponse: string;

  @Column('varchar', { length: 50 })
  category: string;

  @Column('decimal', { 
    precision: 3, 
    scale: 2, 
    name: 'confidence_score',
    nullable: true 
  })
  confidenceScore: number;

  @Column('boolean', { 
    name: 'is_compliance_related', 
    default: true 
  })
  isComplianceRelated: boolean;

  @Column('jsonb', { 
    name: 'conversation_context', 
    nullable: true 
  })
  conversationContext: any;

  @Column('jsonb', { nullable: true })
  metadata: any;

  @Column('varchar', { length: 20, default: 'resolved' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
} 