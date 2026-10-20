import os
import platform


class AppController:
    def open(self, app_name):
        try:
            system = platform.system()

            if system == "Windows":
                os.system(f"start {app_name}")
            elif system == "Darwin":  # macOS
                os.system(f"open -a {app_name}")
            elif system == "Linux":
                os.system(f"{app_name} &")

            return {"status": "success", "app": app_name}

        except Exception as e:
            return {"status": "error", "message": str(e)}
