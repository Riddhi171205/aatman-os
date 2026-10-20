import asyncio
from collections import deque

class TaskQueue:
    def __init__(self):
        self.queue = deque()

    def add_task(self, task):
        self.queue.append(task)

    def get_task(self):
        if self.queue:
            return self.queue.popleft()
        return None

class Worker:
    def __init__(self, executor):
        self.executor = executor
        self.running = False

    async def start(self, queue: TaskQueue):
        self.running = True

        while self.running:
            task = queue.get_task()

            if task:
                print("⚙️ Executing:", task)
                result = await self.executor.execute_async(task)
                print("✅ Result:", result)

            await asyncio.sleep(0.5)

    def stop(self):
        self.running = False
