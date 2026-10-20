import { PlannerAgentService } from './agents/plannerAgentService';
import { ResearchAgentService } from './agents/researchAgentService';
import { CoderAgentService } from './agents/coderAgentService';
import { MemoryService } from './memoryService';

export interface AgentRunResult {
    plan: any;
    research: any[];
    execution: any[];
    finalOutput: string;
}

export class OrchestratorService {
    static async runGoal(userGoal: string, userId?: string): Promise<AgentRunResult> {
        console.log(`[Orchestrator] Starting run for goal: "${userGoal}"`);
        
        // 1. Planner Phase
        console.log(`[Orchestrator] Calling Planner Agent...`);
        const plan = await PlannerAgentService.generatePlan(userGoal);
        
        const researchResults: any[] = [];
        const executionResults: any[] = [];
        let finalOutputAggregator = `Execution Results for Goal: ${userGoal}\n\n`;

        // 2. Execution Loop
        for (const task of plan.tasks) {
            console.log(`[Orchestrator] Processing Task ${task.step}: ${task.description}`);
            
            // Optional: Pull context from Memory if userId is provided
            let context = "";
            if (userId) {
                context = await MemoryService.getRelevantPastMemory(userId, task.description, 2);
            }

            // 3. Research Phase
            console.log(`[Orchestrator] Calling Research Agent...`);
            const research = await ResearchAgentService.research(task.description, context);
            researchResults.push({ step: task.step, insights: research.insights });

            // 4. Coder / Execution Phase
            console.log(`[Orchestrator] Calling Coder Agent...`);
            const execution = await CoderAgentService.execute(task.description, research.insights);
            executionResults.push({ step: task.step, result: execution.result });

            finalOutputAggregator += `### Step ${task.step}\n**Task**: ${task.description}\n**Result**:\n${execution.result}\n\n`;
        }

        console.log(`[Orchestrator] Goal execution completed.`);

        return {
            plan,
            research: researchResults,
            execution: executionResults,
            finalOutput: finalOutputAggregator.trim()
        };
    }
}
