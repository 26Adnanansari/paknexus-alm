from slowapi import Limiter
from slowapi.util import get_remote_address

# Initialize the limiter
# key_func=get_remote_address uses the client's IP address as the key for rate limiting
limiter = Limiter(key_func=get_remote_address)
