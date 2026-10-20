from .council import AgentCouncil


class FeedbackCouncil(AgentCouncil):
    """
    Responsible for reviewing outputs and providing improvements.

    - Evaluates output quality
    - Detects issues
    - Suggests improvements
    - Decides approval/rejection
    """

    def __init__(self, config=None):
        super().__init__(name="FeedbackCouncil", config=config)

    def analyze_output(self, output):
        """
        Analyze output and detect issues
        """
        feedback = []
        score = 0

        if not output:
            return ["Empty output detected"], 0

        # Basic checks (expand later)
        if isinstance(output, dict):
            score += 1
        else:
            feedback.append("Output should be structured (dict preferred)")

        if "error" in str(output).lower():
            feedback.append("Errors detected in output")
        else:
            score += 1

        if len(str(output)) < 10:
            feedback.append("Output too short or lacks detail")
        else:
            score += 1

        return feedback, score

    def suggest_improvements(self, feedback):
        """
        Convert feedback into actionable improvements
        """
        improvements = []

        for issue in feedback:
            if "structured" in issue:
                improvements.append("Ensure output follows structured JSON format")

            elif "Errors" in issue:
                improvements.append("Improve error handling and validation")

            elif "too short" in issue:
                improvements.append("Provide more detailed and meaningful output")

            else:
                improvements.append("General improvement needed")

        return improvements

    def run(self, state):
        """
        Main feedback loop:
        Analyze → Suggest → Approve/Reject
        """

        self.log("Running feedback and review")

        output = getattr(state, "result", None)

        # Step 1: Analyze
        issues, score = self.analyze_output(output)

        # Step 2: Suggest improvements
        improvements = self.suggest_improvements(issues)

        # Step 3: Approval logic
        approved = score >= 2  # simple threshold

        return {
            "approved": approved,
            "score": score,
            "issues": issues,
            "improvements": improvements
        }
