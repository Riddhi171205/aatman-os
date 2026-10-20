import { ChatService } from '../chatService';
import { AgentUtils } from './agentUtils';

export interface CoderOutput {
    result: string;
}

export class CoderAgentService {
    static async execute(taskDescription: string, insights: string[]): Promise<CoderOutput> {
        const insightsText = insights.length > 0 ? insights.map(i => `- ${i}`).join('\n') : "None";
        
        const prompt = `You are a coding agent. Your job is to execute technical tasks, write code, logic, or structured output.
Use the provided research insights to inform your solution.
Output ONLY valid JSON in the exact format shown below, with no markdown outside of the JSON string, no explanation, and no prefix/suffix.

Format:
{
  "result": "Your final code or implementation here. Escape newlines properly if needed."
}

Task Description:
"${taskDescription}"

Research Insights:
${insightsText}
`;

        const responseText = await ChatService.generateCompletion(prompt);
        return AgentUtils.parseJsonFromResponse<CoderOutput>(responseText, { result: "Failed to generate result." });
    }
}
