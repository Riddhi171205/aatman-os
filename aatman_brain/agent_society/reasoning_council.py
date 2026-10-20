from .council import AgentCouncil

class ReasoningCouncil(AgentCouncil):
    """Responsible for high-level reasoning and planning."""
    
    def __init__(self, config=None):
        super().__init__(name="ReasoningCouncil", config=config)

    def run(self, state):
        self.log("Running reasoning pipeline")
        return {"plan": ["Review context", "Formulate strategy", "Execute plan"]}
