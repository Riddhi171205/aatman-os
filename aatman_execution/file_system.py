class FileSystemController:
    def handle(self, action):
        try:
            op = action.get("action")
            path = action.get("path")

            if op == "read":
                with open(path, "r") as f:
                    return {"status": "success", "data": f.read()}

            elif op == "write":
                with open(path, "w") as f:
                    f.write(action.get("content", ""))
                return {"status": "success"}

            return {"status": "error", "message": "Unsupported file operation"}

        except Exception as e:
            return {"status": "error", "message": str(e)}
