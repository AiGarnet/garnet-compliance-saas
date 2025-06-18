import { Injectable } from '@nestjs/common';
import { Vendor, QuestionnaireAnswer, VendorWork, RiskLevel, AnswerStatus, WorkStatus } from '../entities/vendor.entity';

export interface RiskFactor {
  factor: string;
  score: number; // 0-100 (higher = more risky)
  weight: number; // 0-1 (importance multiplier)
  details: string;
}

export interface RiskAssessment {
  overallScore: number; // 0-100
  riskLevel: RiskLevel;
  factors: RiskFactor[];
  recommendations: string[];
  lastAssessed: Date;
}

@Injectable()
export class RiskAssessmentService {
  
  /**
   * Calculate comprehensive risk score for a vendor
   */
  calculateRiskAssessment(vendor: Vendor, questionnaireAnswers?: QuestionnaireAnswer[], vendorWorks?: VendorWork[]): RiskAssessment {
    try {
      if (!vendor) {
        throw new Error('Vendor data is required for risk assessment');
      }

      const factors: RiskFactor[] = [];
      
      // Ensure arrays are properly initialized
      const answers = questionnaireAnswers || vendor.questionnaireAnswers || [];
      const works = vendorWorks || [];
      
      // 1. Questionnaire Completion Risk (25% weight)
      factors.push(this.assessQuestionnaireCompletion(answers));
      
      // 2. Compliance Indicators Risk (30% weight)
      factors.push(this.assessComplianceIndicators(answers));
      
      // 3. Security Posture Risk (25% weight)
      factors.push(this.assessSecurityPosture(answers));
      
      // 4. Business Context Risk (10% weight)
      factors.push(this.assessBusinessContext(vendor));
      
      // 5. Track Record Risk (10% weight)
      factors.push(this.assessTrackRecord(works));
      
      // Calculate weighted risk score
      const overallScore = this.calculateWeightedScore(factors);
      const riskLevel = this.determineRiskLevel(overallScore);
      const recommendations = this.generateRecommendations(factors, riskLevel);
      
      return {
        overallScore,
        riskLevel,
        factors,
        recommendations,
        lastAssessed: new Date()
      };
    } catch (error) {
      console.error('Error calculating risk assessment:', error);
      
      // Return a default high-risk assessment on error
      return {
        overallScore: 75,
        riskLevel: RiskLevel.HIGH,
        factors: [{
          factor: 'Assessment Error',
          score: 75,
          weight: 1.0,
          details: `Risk assessment failed: ${error.message}`
        }],
        recommendations: ['Risk assessment failed - manual review required'],
        lastAssessed: new Date()
      };
    }
  }

  /**
   * Assess risk based on questionnaire completion rate and answer quality
   */
  private assessQuestionnaireCompletion(answers: QuestionnaireAnswer[]): RiskFactor {
    try {
      const safeAnswers = Array.isArray(answers) ? answers : [];
      const totalAnswers = safeAnswers.length;
      const completedAnswers = safeAnswers.filter(a => a && a.status === AnswerStatus.COMPLETED).length;
      const pendingAnswers = totalAnswers - completedAnswers;
      
      let score = 0;
      let details = '';
      
      if (totalAnswers === 0) {
        score = 95; // Very high risk - no questionnaire data
        details = 'No questionnaire responses available';
      } else {
        const completionRate = completedAnswers / totalAnswers;
        
        if (completionRate >= 0.9) {
          score = 10; // Low risk
          details = `${completedAnswers}/${totalAnswers} questions completed (${Math.round(completionRate * 100)}%)`;
        } else if (completionRate >= 0.7) {
          score = 30; // Medium risk
          details = `${completedAnswers}/${totalAnswers} questions completed (${Math.round(completionRate * 100)}%) - ${pendingAnswers} pending`;
        } else if (completionRate >= 0.5) {
          score = 60; // High risk
          details = `Only ${completedAnswers}/${totalAnswers} questions completed (${Math.round(completionRate * 100)}%) - significant gaps`;
        } else {
          score = 85; // Very high risk
          details = `Poor completion rate: ${completedAnswers}/${totalAnswers} (${Math.round(completionRate * 100)}%) - major concerns`;
        }
      }
      
      return {
        factor: 'Questionnaire Completion',
        score,
        weight: 0.25,
        details
      };
    } catch (error) {
      console.error('Error in questionnaire completion assessment:', error);
      return {
        factor: 'Questionnaire Completion',
        score: 90, // High risk on error
        weight: 0.25,
        details: 'Error assessing questionnaire completion'
      };
    }
  }

  /**
   * Assess risk based on compliance-related answers
   */
  private assessComplianceIndicators(answers: QuestionnaireAnswer[]): RiskFactor {
    const complianceKeywords = [
      'gdpr', 'ccpa', 'sox', 'pci', 'hipaa', 'iso', 'soc', 'compliance',
      'audit', 'certification', 'framework', 'regulation', 'standard'
    ];
    
    const securityKeywords = [
      'encryption', 'authentication', 'access control', 'firewall',
      'security policy', 'incident response', 'vulnerability', 'penetration test'
    ];
    
    const negativeIndicators = [
      'no policy', 'not implemented', 'under development', 'planned',
      'manual process', 'ad-hoc', 'informal', 'none', 'not applicable'
    ];
    
    let complianceScore = 0;
    let securityScore = 0;
    let negativeScore = 0;
    let totalRelevantAnswers = 0;
    
    answers.forEach(answer => {
      if (answer.status === AnswerStatus.COMPLETED && answer.answer.trim()) {
        const answerText = answer.answer.toLowerCase();
        
        // Check for compliance indicators
        const complianceMatches = complianceKeywords.filter(keyword => 
          answerText.includes(keyword)
        ).length;
        
        // Check for security indicators
        const securityMatches = securityKeywords.filter(keyword => 
          answerText.includes(keyword)
        ).length;
        
        // Check for negative indicators
        const negativeMatches = negativeIndicators.filter(indicator => 
          answerText.includes(indicator)
        ).length;
        
        if (complianceMatches > 0 || securityMatches > 0 || negativeMatches > 0) {
          totalRelevantAnswers++;
          complianceScore += complianceMatches;
          securityScore += securityMatches;
          negativeScore += negativeMatches;
        }
      }
    });
    
    let score = 50; // Default medium risk
    let details = '';
    
    if (totalRelevantAnswers === 0) {
      score = 70; // High risk - no relevant compliance information
      details = 'No compliance or security information provided';
    } else {
      const positiveIndicators = complianceScore + securityScore;
      const ratio = positiveIndicators / Math.max(negativeScore + 1, 1);
      
      if (ratio >= 3 && positiveIndicators >= 5) {
        score = 15; // Low risk - strong compliance posture
        details = `Strong compliance indicators (${positiveIndicators} positive, ${negativeScore} negative)`;
      } else if (ratio >= 2 && positiveIndicators >= 3) {
        score = 30; // Medium-low risk
        details = `Good compliance indicators (${positiveIndicators} positive, ${negativeScore} negative)`;
      } else if (ratio >= 1) {
        score = 50; // Medium risk
        details = `Moderate compliance indicators (${positiveIndicators} positive, ${negativeScore} negative)`;
      } else {
        score = 75; // High risk - more negative than positive indicators
        details = `Concerning compliance gaps (${positiveIndicators} positive, ${negativeScore} negative)`;
      }
    }
    
    return {
      factor: 'Compliance Indicators',
      score,
      weight: 0.30,
      details
    };
  }

  /**
   * Assess security posture based on specific security-related questions
   */
  private assessSecurityPosture(answers: QuestionnaireAnswer[]): RiskFactor {
    const securityQuestions = [
      'encryption', 'password', 'access control', 'firewall', 'antivirus',
      'backup', 'incident response', 'security training', 'vulnerability',
      'penetration test', 'monitoring', 'logging'
    ];
    
    const strongSecurityIndicators = [
      'multi-factor', 'mfa', '2fa', 'role-based', 'rbac', 'least privilege',
      'encryption at rest', 'encryption in transit', 'aes-256', 'tls',
      'automated backup', 'disaster recovery', 'incident response plan',
      'security awareness training', 'penetration testing', 'vulnerability scanning'
    ];
    
    let securityAnswerCount = 0;
    let strongSecurityCount = 0;
    
    answers.forEach(answer => {
      if (answer.status === AnswerStatus.COMPLETED && answer.answer.trim()) {
        const answerText = answer.answer.toLowerCase();
        const questionText = answer.question.toLowerCase();
        
        // Check if this is a security-related question
        const isSecurityQuestion = securityQuestions.some(keyword => 
          questionText.includes(keyword) || answerText.includes(keyword)
        );
        
        if (isSecurityQuestion) {
          securityAnswerCount++;
          
          // Check for strong security indicators
          const hasStrongSecurity = strongSecurityIndicators.some(indicator => 
            answerText.includes(indicator)
          );
          
          if (hasStrongSecurity) {
            strongSecurityCount++;
          }
        }
      }
    });
    
    let score = 60; // Default medium-high risk
    let details = '';
    
    if (securityAnswerCount === 0) {
      score = 80; // High risk - no security information
      details = 'No security-related information provided';
    } else {
      const securityRatio = strongSecurityCount / securityAnswerCount;
      
      if (securityRatio >= 0.8 && securityAnswerCount >= 4) {
        score = 20; // Low risk - strong security posture
        details = `Strong security posture (${strongSecurityCount}/${securityAnswerCount} security measures)`;
      } else if (securityRatio >= 0.6 && securityAnswerCount >= 3) {
        score = 35; // Medium-low risk
        details = `Good security measures (${strongSecurityCount}/${securityAnswerCount} measures)`;
      } else if (securityRatio >= 0.4) {
        score = 55; // Medium risk
        details = `Moderate security measures (${strongSecurityCount}/${securityAnswerCount} measures)`;
      } else {
        score = 75; // High risk - weak security
        details = `Weak security posture (${strongSecurityCount}/${securityAnswerCount} measures)`;
      }
    }
    
    return {
      factor: 'Security Posture',
      score,
      weight: 0.25,
      details
    };
  }

  /**
   * Assess risk based on business context (industry, region, etc.)
   */
  private assessBusinessContext(vendor: Vendor): RiskFactor {
    let score = 40; // Default medium-low risk
    let details = '';
    const riskFactors: string[] = [];
    
    try {
      // Industry-based risk assessment
      const highRiskIndustries = ['finance', 'healthcare', 'government', 'defense', 'banking'];
      const mediumRiskIndustries = ['technology', 'retail', 'education', 'insurance'];
      
      if (vendor.industry && typeof vendor.industry === 'string') {
        const industry = vendor.industry.toLowerCase().trim();
        
        if (highRiskIndustries.some(risky => industry.includes(risky))) {
          score += 15;
          riskFactors.push(`High-risk industry: ${vendor.industry}`);
        } else if (mediumRiskIndustries.some(medium => industry.includes(medium))) {
          score += 5;
          riskFactors.push(`Medium-risk industry: ${vendor.industry}`);
        } else {
          riskFactors.push(`Industry: ${vendor.industry}`);
        }
      } else {
        score += 10;
        riskFactors.push('Industry not specified');
      }
      
      // Region-based assessment (basic example)
      if (vendor.region && typeof vendor.region === 'string') {
        // High-risk regions might have different compliance requirements
        const complexRegions = ['eu', 'california', 'canada'];
        if (complexRegions.some(region => vendor.region.toLowerCase().includes(region))) {
          score += 5;
          riskFactors.push(`Complex regulatory region: ${vendor.region}`);
        }
      }
      
      details = riskFactors.join(', ') || 'Business context assessment';
    } catch (error) {
      console.error('Error in business context assessment:', error);
      score = 50; // Default to medium risk on error
      details = 'Business context assessment error';
    }
    
    return {
      factor: 'Business Context',
      score: Math.min(score, 100),
      weight: 0.10,
      details
    };
  }

  /**
   * Assess risk based on vendor's track record and works
   */
  private assessTrackRecord(works: VendorWork[]): RiskFactor {
    let score = 50; // Default medium risk
    let details = '';
    
    if (works.length === 0) {
      score = 60;
      details = 'No track record available';
    } else {
      const completedWorks = works.filter(w => w.status === WorkStatus.COMPLETED).length;
      const inProgressWorks = works.filter(w => w.status === WorkStatus.IN_PROGRESS).length;
      const totalWorks = works.length;
      
      const completionRate = completedWorks / totalWorks;
      
      if (completionRate >= 0.8 && totalWorks >= 3) {
        score = 25; // Low risk - good track record
        details = `Strong track record: ${completedWorks}/${totalWorks} completed projects`;
      } else if (completionRate >= 0.6 && totalWorks >= 2) {
        score = 40; // Medium-low risk
        details = `Good track record: ${completedWorks}/${totalWorks} completed, ${inProgressWorks} in progress`;
      } else if (totalWorks >= 1) {
        score = 55; // Medium risk
        details = `Limited track record: ${completedWorks}/${totalWorks} completed`;
      } else {
        score = 70; // High risk - very limited experience
        details = 'Very limited project history';
      }
    }
    
    return {
      factor: 'Track Record',
      score,
      weight: 0.10,
      details
    };
  }

  /**
   * Calculate weighted overall risk score
   */
  private calculateWeightedScore(factors: RiskFactor[]): number {
    const totalWeightedScore = factors.reduce((sum, factor) => {
      return sum + (factor.score * factor.weight);
    }, 0);
    
    return Math.round(totalWeightedScore);
  }

  /**
   * Determine risk level based on score
   */
  private determineRiskLevel(score: number): RiskLevel {
    if (score <= 30) {
      return RiskLevel.LOW;
    } else if (score <= 60) {
      return RiskLevel.MEDIUM;
    } else {
      return RiskLevel.HIGH;
    }
  }

  /**
   * Generate recommendations based on risk assessment
   */
  private generateRecommendations(factors: RiskFactor[], riskLevel: RiskLevel): string[] {
    const recommendations: string[] = [];
    
    factors.forEach(factor => {
      if (factor.score > 60) {
        switch (factor.factor) {
          case 'Questionnaire Completion':
            recommendations.push('Complete all pending questionnaire items to improve risk assessment');
            break;
          case 'Compliance Indicators':
            recommendations.push('Provide more detailed compliance framework information and certifications');
            break;
          case 'Security Posture':
            recommendations.push('Implement stronger security controls and provide detailed security documentation');
            break;
          case 'Business Context':
            recommendations.push('Provide complete business context and industry-specific compliance information');
            break;
          case 'Track Record':
            recommendations.push('Document completed projects and provide references from previous clients');
            break;
        }
      }
    });
    
    // General recommendations based on risk level
    switch (riskLevel) {
      case RiskLevel.HIGH:
        recommendations.push('Requires immediate attention and comprehensive risk mitigation plan');
        recommendations.push('Consider additional security audits and compliance verification');
        break;
      case RiskLevel.MEDIUM:
        recommendations.push('Monitor closely and address identified gaps');
        recommendations.push('Regular compliance check-ins recommended');
        break;
      case RiskLevel.LOW:
        recommendations.push('Maintain current standards and conduct periodic reviews');
        break;
    }
    
    return recommendations;
  }

  /**
   * Quick risk level calculation for display purposes
   */
  getQuickRiskLevel(vendor: Vendor): RiskLevel {
    const assessment = this.calculateRiskAssessment(vendor);
    return assessment.riskLevel;
  }
} 