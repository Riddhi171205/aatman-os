import { ChatService } from '../chatService';
import { AgentUtils } from './agentUtils';

export interface PlannerOutput {
    tasks: { step: number; description: string }[];
}

export class PlannerAgentService {
    static async generatePlan(goal: string): Promise<PlannerOutput> {
        const prompt = `You are a planning agent for a multi-agent AI system. 
Your goal is to break the following user goal into a sequence of structured tasks.
Output ONLY valid JSON in the exact format shown below, with no markdown, no explanation, and no prefix/suffix.

Format:
{
  "tasks": [
    { "step": 1, "description": "..." },
    { "step": 2, "description": "..." }
  ]
}

User Goal:
"${goal}"`;

        const responseText = await ChatService.generateCompletion(prompt);
        return AgentUtils.parseJsonFromResponse<PlannerOutput>(responseText, { tasks: [{ step: 1, description: goal }] });
    }
}
