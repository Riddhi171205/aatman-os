import time
import threading


class TaskScheduler:
    """
    Basic task scheduler for delayed or repeated execution.
    """

    def schedule(self, delay, func, *args, **kwargs):
        def wrapper():
            time.sleep(delay)
            func(*args, **kwargs)

        thread = threading.Thread(target=wrapper)
        thread.start()

        return {"status": "scheduled", "delay": delay}
