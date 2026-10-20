class SystemController:
    """
    Handles OS-level system mode changes, such as Antigravity Mode.
    """

    def handle_mode(self, action: dict):
        try:
            # Action could come with params nested or flat depending on routing
            params = action.get("params", action)
            mode = params.get("mode", "unknown")
            state = params.get("state", "off")

            return {
                "status": "success",
                "message": f"System mode '{mode}' switched {state}",
                "mode": mode,
                "state": state
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}
