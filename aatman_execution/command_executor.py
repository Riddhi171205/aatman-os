import subprocess


class CommandExecutor:
    def run(self, cmd):
        try:
            output = subprocess.getoutput(cmd)
            return {"status": "success", "output": output}
        except Exception as e:
            return {"status": "error", "message": str(e)}
