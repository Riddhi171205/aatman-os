import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ExecutionLayer")

def log_action(action, result):
    logger.info(f"ACTION: {action}")
    logger.info(f"RESULT: {result}")
