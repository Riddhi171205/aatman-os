import requests


class APIController:
    def call(self, action):
        try:
            url = action.get("url")
            method = action.get("method", "GET").upper()

            if method == "GET":
                res = requests.get(url)
                return {"status": "success", "data": res.json()}

            return {"status": "error", "message": "Unsupported method"}

        except Exception as e:
            return {"status": "error", "message": str(e)}
