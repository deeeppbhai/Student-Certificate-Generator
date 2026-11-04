import random
import time

def generate_certificate_id(prefix: str = "CERT") -> str:
    timestamp = time.strftime("%Y%m")
    random_num = random.randint(1000, 9999)
    return f"{prefix}-{timestamp}-{random_num}"
