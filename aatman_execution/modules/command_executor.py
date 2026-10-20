import subprocess

class CommandExecutor:
    def run(self, cmd, retries=2):
        for attempt in range(retries):
            try:
                output = subprocess.getoutput(cmd)
                return {"status": "success", "output": output}
            except Exception as e:
                if attempt == retries - 1:
                    return {"status": "error", "message": str(e)}
        return {"status": "error", "message": "Max retries exceeded"}
