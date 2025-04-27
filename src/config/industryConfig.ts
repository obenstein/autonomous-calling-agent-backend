// src/config/industryConfigs.ts
import { AgentConfig, ConversationStage, ProductInfo, QualificationCriteria } from '../models/types';

// Base configuration factory
abstract class IndustryConfigFactory {
  protected companyName: string;
  
  constructor(companyName: string) {
    this.companyName = companyName;
  }
  
  abstract createProductInfo(): ProductInfo;
  abstract createQualificationCriteria(): QualificationCriteria;
  abstract createScriptTemplates(): Record<ConversationStage, string[]>;
  
  getConfig(): AgentConfig {
    return {
      companyName: this.companyName,
      industry: this.getIndustryName(),
      productInfo: this.createProductInfo(),
      qualificationCriteria: this.createQualificationCriteria(),
      scriptTemplates: this.createScriptTemplates()
    };
  }
  
  abstract getIndustryName(): string;
}

// Insurance industry configuration
export class InsuranceConfigFactory extends IndustryConfigFactory {
  private insuranceType: 'auto' | 'home' | 'life' | 'health';
  
  constructor(companyName: string, insuranceType: 'auto' | 'home' | 'life' | 'health' = 'auto') {
    super(companyName);
    this.insuranceType = insuranceType;
  }
  
  getIndustryName(): string {
    return 'insurance';
  }
  
  createProductInfo(): ProductInfo {
    switch (this.insuranceType) {
      case 'auto':
        return {
          name: 'Comprehensive Auto Insurance',
          keyFeatures: [
            'Accident forgiveness',
            '24/7 roadside assistance',
            'New car replacement',
            'Gap coverage'
          ],
          benefits: [
            'saving an average of $500 per year on premiums',
            'faster claims processing with our mobile app',
            'customized coverage tailored to your specific needs'
          ],
          targetCustomers: [
            'drivers with clean records',
            'families with multiple vehicles',
            'new car owners'
          ]
        };
        
      case 'home':
        return {
          name: 'Premium Home Insurance',
          keyFeatures: [
            'Full replacement cost coverage',
            'Water damage protection',
            'Personal property coverage',
            'Liability protection'
          ],
          benefits: [
            'comprehensive protection for your most valuable asset',
            'bundled discounts when combined with auto insurance',
            'quick response time for claims after disasters'
          ],
          targetCustomers: [
            'homeowners',
            'new home buyers',
            'condo owners'
          ]
        };
        
      case 'life':
        return {
          name: 'Term Life Insurance',
          keyFeatures: [
            'Affordable premiums',
            'Flexible coverage amounts',
            'No medical exam options',
            'Quick approval process'
          ],
          benefits: [
            'financial security for your family',
            'peace of mind knowing your loved ones are protected',
            'coverage that fits your budget'
          ],
          targetCustomers: [
            'new parents',
            'homeowners with mortgages',
            'family breadwinners'
          ]
        };
        
      case 'health':
        return {
          name: 'Comprehensive Health Plan',
          keyFeatures: [
            'Low deductibles',
            'Preventive care coverage',
            'Telehealth services',
            'Prescription drug coverage'
          ],
          benefits: [
            'access to top-rated healthcare providers',
            'affordable monthly premiums',
            'comprehensive coverage for you and your family'
          ],
          targetCustomers: [
            'families',
            'self-employed individuals',
            'small business owners'
          ]
        };
    }
  }
  
  createQualificationCriteria(): QualificationCriteria {
    const baseDisqualifiers = [
      'not interested',
      'do not call',
      'on do not call list'
    ];
    
    switch (this.insuranceType) {
      case 'auto':
        return {
          minimumInterestLevel: 0.6,
          requiredCustomerAttributes: {
            hasVehicle: true
          },
          disqualifyingFactors: [
            ...baseDisqualifiers,
            'no car',
            'no license',
            'under 18'
          ]
        };
        
      case 'home':
        return {
          minimumInterestLevel: 0.6,
          requiredCustomerAttributes: {
            ownsHome: true
          },
          disqualifyingFactors: [
            ...baseDisqualifiers,
            'renter',
            'not homeowner'
          ]
        };
        
      case 'life':
        return {
          minimumInterestLevel: 0.7,
          requiredCustomerAttributes: {
            hasFamily: true
          },
          disqualifyingFactors: [
            ...baseDisqualifiers,
            'terminal illness',
            'over 80 years old'
          ]
        };
        
      case 'health':
        return {
          minimumInterestLevel: 0.7,
          requiredCustomerAttributes: {},
          disqualifyingFactors: [
            ...baseDisqualifiers,
            'currently insured and satisfied',
            'already enrolled in medicare'
          ]
        };
    }
  }
  
  createScriptTemplates(): Record<ConversationStage, string[]> {
    const productName = this.createProductInfo().name;
    
    return {
      [ConversationStage.INTRODUCTION]: [
        `Hello, my name is Alex from ${this.companyName}. I'm calling to see if you might be interested in exploring options for ${productName} that could provide better coverage and savings. Do you have a few minutes to chat?`,
        `Hi there, this is Alex with ${this.companyName}. We're helping people in your area get better ${this.insuranceType} insurance coverage at competitive rates. Would you be interested in learning more?`
      ],
      [ConversationStage.QUALIFICATION]: this.getQualificationScripts(),
      [ConversationStage.ADDRESSING_OBJECTIONS]: [
        `I understand your concern. Many people feel that way at first, but our customers typically find that our coverage offers better value because of our unique features. Would you like to know more about those benefits?`,
        `That's a common reaction. What makes our ${productName} different is that we focus on personalized coverage that fits your specific needs. How does your current coverage compare to that approach?`
      ],
      [ConversationStage.INTEREST_CONFIRMATION]: [
        `Based on what you've shared, I think our ${productName} could be a great fit for you. Would you like to schedule a call with one of our specialists who can provide a personalized quote?`,
        `It sounds like you could benefit from our coverage. Would you be interested in having one of our specialists contact you with a customized quote that addresses your specific needs?`
      ],
      [ConversationStage.CLOSING]: [
        `Thank you for your time today. If your insurance needs change in the future, please don't hesitate to contact ${this.companyName}.`,
        `Great! I'll have one of our specialists reach out to you soon with more information about our ${productName}. What would be the best time for them to call?`
      ]
    };
  }
  
  private getQualificationScripts(): string[] {
    switch (this.insuranceType) {
      case 'auto':
        return [
          `Great! To find the best coverage options for you, may I ask what kind of vehicle you currently drive?`,
          `Excellent! Just to make sure our insurance options fit your needs, could you tell me about your current auto insurance situation?`
        ];
        
      case 'home':
        return [
          `Great! To provide the best home insurance options, could you tell me a bit about your property?`,
          `Excellent! To help us find the right coverage for you, what type of home do you own and how long have you owned it?`
        ];
        
      case 'life':
        return [
          `Great! To help us determine the right life insurance coverage for you, may I ask about your family situation?`,
          `Excellent! Life insurance needs vary based on individual circumstances. Could you share a bit about what you're looking to protect with life insurance?`
        ];
        
      case 'health':
        return [
          `Great! To help find the best health plan for you, could you tell me about your current healthcare needs?`,
          `Excellent! Health insurance is very personal. Could you share what's most important to you in a health insurance plan?`
        ];
    }
  }
}

// SaaS/Software industry configuration
export class SaaSConfigFactory extends IndustryConfigFactory {
  private softwareType: 'crm' | 'marketing' | 'accounting' | 'productivity';
  
  constructor(companyName: string, softwareType: 'crm' | 'marketing' | 'accounting' | 'productivity' = 'crm') {
    super(companyName);
    this.softwareType = softwareType;
  }
  
  getIndustryName(): string {
    return 'software';
  }
  
  createProductInfo(): ProductInfo {
    switch (this.softwareType) {
      case 'crm':
        return {
          name: 'Customer Relationship Management Platform',
          keyFeatures: [
            'Unified customer database',
            'Sales pipeline management',
            'Email integration',
            'Performance analytics'
          ],
          benefits: [
            'increasing sales conversion rates by 25%',
            'reducing customer churn through better follow-up',
            'saving time on administrative tasks'
          ],
          targetCustomers: [
            'small to medium businesses',
            'sales teams',
            'customer service departments'
          ]
        };
        
      case 'marketing':
        return {
          name: 'Digital Marketing Suite',
          keyFeatures: [
            'Email campaign management',
            'Social media scheduling',
            'SEO optimization tools',
            'Analytics dashboard'
          ],
          benefits: [
            'reaching more customers with less effort',
            'measuring campaign ROI accurately',
            'creating consistent brand messaging across channels'
          ],
          targetCustomers: [
            'marketing teams',
            'small business owners',
            'digital agencies'
          ]
        };
        
      case 'accounting':
        return {
          name: 'Financial Management Software',
          keyFeatures: [
            'Automated bookkeeping',
            'Expense tracking',
            'Invoice generation',
            'Tax preparation'
          ],
          benefits: [
            'reducing accounting errors',
            'saving time on financial reporting',
            'simplifying tax preparation'
          ],
          targetCustomers: [
            'small business owners',
            'freelancers',
            'accounting departments'
          ]
        };
        
      case 'productivity':
        return {
          name: 'Team Collaboration Platform',
          keyFeatures: [
            'Project management',
            'Document sharing',
            'Team chat',
            'Video conferencing'
          ],
          benefits: [
            'improving team communication',
            'centralizing project information',
            'enabling remote work efficiency'
          ],
          targetCustomers: [
            'remote teams',
            'project managers',
            'growing companies'
          ]
        };
    }
  }
  
  createQualificationCriteria(): QualificationCriteria {
    const baseDisqualifiers = [
      'not interested',
      'do not call',
      'no budget',
      'just signed with competitor'
    ];
    
    switch (this.softwareType) {
      case 'crm':
        return {
          minimumInterestLevel: 0.6,
          requiredCustomerAttributes: {
            hasCustomers: true
          },
          disqualifyingFactors: [
            ...baseDisqualifiers,
            'one-person company',
            'no sales team'
          ]
        };
        
      case 'marketing':
        return {
          minimumInterestLevel: 0.6,
          requiredCustomerAttributes: {
            needsMarketing: true
          },
          disqualifyingFactors: [
            ...baseDisqualifiers,
            'outsourced marketing',
            'too small for digital marketing'
          ]
        };
        
      case 'accounting':
        return {
          minimumInterestLevel: 0.6,
          requiredCustomerAttributes: {
            hasBusiness: true
          },
          disqualifyingFactors: [
            ...baseDisqualifiers,
            'using accountant',
            'happy with current solution'
          ]
        };
        
      case 'productivity':
        return {
          minimumInterestLevel: 0.6,
          requiredCustomerAttributes: {
            hasTeam: true
          },
          disqualifyingFactors: [
            ...baseDisqualifiers,
            'solo entrepreneur',
            'no remote work'
          ]
        };
    }
  }
  
  createScriptTemplates(): Record<ConversationStage, string[]> {
    const productName = this.createProductInfo().name;
    
    return {
      [ConversationStage.INTRODUCTION]: [
        `Hello, my name is Alex from ${this.companyName}. I'm calling to see if you might be interested in our ${productName} that helps businesses improve their efficiency and results. Do you have a moment to chat?`,
        `Hi there, this is Alex with ${this.companyName}. We're helping companies like yours optimize their ${this.softwareType} processes. Would you be interested in learning how our solution could benefit your business?`
      ],
      [ConversationStage.QUALIFICATION]: this.getQualificationScripts(),
      [ConversationStage.ADDRESSING_OBJECTIONS]: [
        `I understand your concern. Many businesses have that reaction at first, but our customers typically see ROI within the first three months. Would you like to know more about how that works?`,
        `That's a common question. What makes our ${productName} different is that we focus on ease of implementation and quick time-to-value. How does your current process handle these challenges?`
      ],
      [ConversationStage.INTEREST_CONFIRMATION]: [
        `Based on what you've shared, I think our ${productName} could really help address your current challenges. Would you like to schedule a demo with one of our product specialists?`,
        `It sounds like our solution could be a good fit for your needs. Would you be interested in having one of our specialists show you how the platform works with your specific use case?`
      ],
      [ConversationStage.CLOSING]: [
        `Thank you for your time today. If your business needs change in the future, please don't hesitate to contact ${this.companyName}.`,
        `Great! I'll have one of our specialists reach out to schedule a personalized demo of our ${productName}. What would be the best time for them to contact you?`
      ]
    };
  }
  
  private getQualificationScripts(): string[] {
    switch (this.softwareType) {
      case 'crm':
        return [
          `Great! To understand if our CRM would be a good fit, could you tell me how you're currently managing your customer relationships?`,
          `Excellent! What are the biggest challenges you're facing with your current customer management process?`
        ];
        
      case 'marketing':
        return [
          `Great! To help determine if our marketing suite would benefit you, could you share what marketing channels you're currently using?`,
          `Excellent! What are your main marketing goals right now, and what challenges are you facing in achieving them?`
        ];
        
      case 'accounting':
        return [
          `Great! To see if our financial software would be helpful, could you tell me how you're currently handling your accounting needs?`,
          `Excellent! What aspects of financial management take up the most time in your business right now?`
        ];
        
      case 'productivity':
        return [
          `Great! To understand if our platform would help your team, could you tell me how you're currently collaborating on projects?`,
          `Excellent! What are the biggest communication or workflow challenges your team is facing right now?`
        ];
    }
  }
}

// Factory creator function for easy config generation
export function createIndustryConfig(
  industry: 'insurance' | 'software',
  companyName: string,
  subType?: string
): AgentConfig {
  switch (industry) {
    case 'insurance':
      return new InsuranceConfigFactory(
        companyName,
        subType as 'auto' | 'home' | 'life' | 'health'
      ).getConfig();
      
    case 'software':
      return new SaaSConfigFactory(
        companyName,
        subType as 'crm' | 'marketing' | 'accounting' | 'productivity'
      ).getConfig();
      
    default:
      throw new Error(`Unsupported industry: ${industry}`);
  }
}

// Updated version of the config getter in the main app
export function getAgentConfig(): AgentConfig {
  const industry = process.env.INDUSTRY || 'insurance';
  const companyName = process.env.COMPANY_NAME || 'DefaultCo';
  const subType = process.env.INDUSTRY_SUBTYPE;
  
  try {
    return createIndustryConfig(
      industry as 'insurance' | 'software',
      companyName,
      subType
    );
  } catch (error) {
    console.error('Error creating industry config:', error);
    // Fallback to default insurance config
    return new InsuranceConfigFactory(companyName).getConfig();
  }
}