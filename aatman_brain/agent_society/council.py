import logging
from datetime import datetime


class AgentCouncil:
    """
    Base class for all councils in the Agent Society.

    Provides:
    - Logging
    - Config support
    - Standard run interface
    - Utility helpers
    """

    def __init__(self, name="BaseCouncil", config=None):
        self.name = name
        self.config = config

        self.logger = logging.getLogger(self.name)

    def run(self, state):
        """
        Main execution method (must be overridden).
        """
        raise NotImplementedError(f"{self.name} must implement the run() method")

    # -------------------------
    # Utility Methods
    # -------------------------

    def log(self, message, level="info"):
        """
        Standard logging method
        """
        if level == "debug":
            self.logger.debug(message)
        elif level == "warning":
            self.logger.warning(message)
        elif level == "error":
            self.logger.error(message)
        else:
            self.logger.info(message)

    def timestamp(self):
        """
        Get current UTC timestamp
        """
        return datetime.utcnow().isoformat()

    def validate_state(self, state):
        """
        Basic validation for incoming state
        """
        if state is None:
            self.log("Received empty state", "warning")
            return False
        return True
