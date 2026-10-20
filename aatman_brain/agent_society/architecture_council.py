from .council import AgentCouncil


class ArchitectureCouncil(AgentCouncil):
    """
    Responsible for system architecture evolution and self-improvement.
    Analyzes system performance and suggests structural improvements.
    """

    def evaluate_system(self, state):
        """
        Analyze current system state and identify improvement areas.
        """
        insights = []

        if not state:
            return ["No state available for evaluation"]

        # Example checks (can be expanded)
        if len(state.history) > 50:
            insights.append("Memory size is growing; consider pruning or summarization.")

        if getattr(state, 'error_count', 0) > 5:
            insights.append("High error rate detected; improve error handling.")

        if not getattr(state, 'last_execution_success', True):
            insights.append("Execution failures detected; refine execution strategies.")

        if not insights:
            insights.append("System is stable. No major architectural changes needed.")

        return insights

    def suggest_improvements(self, insights):
        """
        Convert insights into actionable improvements.
        """
        suggestions = []

        for insight in insights:
            if "Memory size" in insight:
                suggestions.append("Implement memory compression or vector-based storage.")

            elif "error rate" in insight:
                suggestions.append("Add retry logic and better exception handling.")

            elif "Execution failures" in insight:
                suggestions.append("Improve task validation before execution.")

            else:
                suggestions.append("Maintain current architecture.")

        return suggestions

    def run(self, state):
        """
        Main execution method:
        Evaluate → Suggest → Return structured improvement plan
        """
        insights = self.evaluate_system(state)
        improvements = self.suggest_improvements(insights)

        return {
            "insights": insights,
            "improvements": improvements
        }
