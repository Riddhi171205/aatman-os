import { ToolRegistry } from './toolRegistry';

export class ExecutionController {
    static async handleAction(action: string, params: any): Promise<{ status: 'success' | 'error', result: string }> {
        console.log(`[ExecutionController] Received action request: ${action}`);
        
        try {
            const tool = ToolRegistry.getTool(action);
            
            if (!tool) {
                console.warn(`[ExecutionController] Unknown action requested: ${action}`);
                return {
                    status: 'error',
                    result: `Action '${action}' is not registered.`
                };
            }

            // Basic validation: ensure all required parameters are present
            for (const paramKey of Object.keys(tool.params)) {
                if (!(paramKey in params)) {
                    throw new Error(`Missing required parameter: '${paramKey}' for action '${action}'`);
                }
            }

            // Execute the tool
            console.log(`[ExecutionController] Executing tool: ${action}`);
            const result = await tool.handler(params);
            
            console.log(`[ExecutionController] Execution successful.`);
            return {
                status: 'success',
                result: result
            };

        } catch (error: any) {
            console.error(`[ExecutionController] Execution failed:`, error.message);
            return {
                status: 'error',
                result: error.message || 'Unknown execution error occurred.'
            };
        }
    }
}
