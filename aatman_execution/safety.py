class SafetyGuard:
    """
    Prevents dangerous or harmful execution
    """

    BLOCKED_COMMANDS = ["rm -rf", "shutdown", "reboot", "format"]

    def validate(self, action):
        if not isinstance(action, dict):
            return False, "Invalid action format"

        if action.get("type") == "command":
            cmd = action.get("cmd", "").lower()

            for blocked in self.BLOCKED_COMMANDS:
                if blocked in cmd:
                    return False, f"Blocked dangerous command: {blocked}"

        # Prevent external unknown APIs
        if action.get("type") == "api":
            url = action.get("url", "")
            if not url.startswith("https://"):
                return False, "Only HTTPS APIs allowed"

        return True, "Safe"
