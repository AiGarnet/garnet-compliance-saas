import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Load the compliance data
let complianceData: any[] = [];
try {
  const dataPath = path.join(process.cwd(), 'public', 'data_new.json');
  if (fs.existsSync(dataPath)) {
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    complianceData = JSON.parse(rawData);
    console.log(`Loaded ${complianceData.length} compliance records`);
  }
} catch (error) {
  console.error('Error loading compliance data:', error);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, context } = body;
    
    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }
    
    // Simple keyword matching for demonstration
    // In a real implementation, you'd use a more sophisticated matching algorithm
    const relevantData = complianceData.filter(item => {
      const searchText = `${item.title} ${item.description} ${item.requirements}`.toLowerCase();
      const questionWords = question.toLowerCase().split(' ');
      return questionWords.some((word: string) => word.length > 3 && searchText.includes(word));
    });
    
    // Generate a contextual answer based on the compliance data
    let answer = '';
    if (relevantData.length > 0) {
      answer = `Based on the compliance requirements, here are the key considerations:\n\n`;
      relevantData.slice(0, 3).forEach((item, index) => {
        answer += `${index + 1}. **${item.title}**: ${item.description}\n`;
        if (item.requirements) {
          answer += `   Requirements: ${item.requirements}\n`;
        }
        answer += '\n';
      });
      
      answer += `\nFor your specific question: "${question}"\n\n`;
      answer += `You should ensure compliance with the above requirements and consider implementing appropriate controls and documentation.`;
    } else {
      answer = `I understand you're asking about: "${question}"\n\n`;
      answer += `While I don't have specific compliance data that directly matches your question, I recommend:\n\n`;
      answer += `1. Reviewing your organization's security policies\n`;
      answer += `2. Consulting with your compliance team\n`;
      answer += `3. Checking relevant industry standards (ISO 27001, SOC 2, etc.)\n`;
      answer += `4. Documenting your current practices and identifying gaps\n\n`;
      answer += `Please provide more specific details about your compliance framework or industry for more targeted guidance.`;
    }
    
    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 