from .council import AgentCouncil


class ExecutionCouncil(AgentCouncil):
    """
    Responsible for taking action and executing plans.

    - Validates plans
    - Converts plans into executable actions
    - Tracks execution success/failure
    """

    def validate_plan(self, plan):
        """
        Ensure the plan is executable
        """
        if not plan:
            return False, "Empty plan"

        if not isinstance(plan, (dict, list, str)):
            return False, "Unsupported plan format"

        return True, "Valid plan"

    def prepare_action(self, plan):
        """
        Convert plan into structured execution action
        """
        # If already structured (from agents)
        if isinstance(plan, dict) and "type" in plan:
            return plan

        # Basic fallback conversion
        return {
            "type": "command",
            "cmd": str(plan)
        }

    def execute(self, action):
        """
        Simulate execution (actual execution handled by Execution Layer)
        """
        self.log(f"Executing action: {action}")

        try:
            # This is just simulation — real execution happens elsewhere
            result = {
                "status": "success",
                "action": action
            }
            return result

        except Exception as e:
            self.log(f"Execution failed: {str(e)}", "error")

            return {
                "status": "failed",
                "error": str(e)
            }

    def run(self, state):
        """
        Main execution flow:
        Validate → Prepare → Execute → Return result
        """

        if not self.validate_state(state):
            return {"status": "error", "message": "Invalid state"}

        plan = getattr(state, "plan", None)

        # Step 1: Validate plan
        is_valid, msg = self.validate_plan(plan)
        if not is_valid:
            return {"status": "error", "message": msg}

        # Step 2: Prepare action
        action = self.prepare_action(plan)

        # Step 3: Execute
        result = self.execute(action)

        return {
            "status": "completed",
            "action": action,
            "result": result
        }
