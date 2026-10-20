import logging
from typing import Any


class BaseEngine:
    """
    Base class for all intelligence engines.
    Provides logging, standard interfaces, and shared utilities.
    """

    def __init__(self, name: str = "BaseEngine"):
        self.name = name
        self.logger = logging.getLogger(f"AATMAN_ENGINE.{name}")

    def log(self, message: str, level: str = "info", **kwargs: Any) -> None:
        """Standardized logging method for engines."""
        if level == "debug":
            self.logger.debug(message, **kwargs)
        elif level == "warning":
            self.logger.warning(message, **kwargs)
        elif level == "error":
            self.logger.error(message, exc_info=True, **kwargs)
        else:
            self.logger.info(message, **kwargs)
