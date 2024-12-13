import sys
import os
import logging

# Configure basic logging to stderr
logging.basicConfig(
    stream=sys.stderr,
    level=logging.DEBUG,
    format='%(asctime)s %(levelname)s: %(message)s'
)

logger = logging.getLogger(__name__)

# Log current environment
logger.debug(f"Current working directory: {os.getcwd()}")
logger.debug(f"Directory contents: {os.listdir('.')}")
logger.debug(f"Python path: {sys.path}")

# Add the application directory to the Python path
project_dir = os.path.dirname(os.path.abspath(__file__))
if project_dir not in sys.path:
    sys.path.insert(0, project_dir)

from app import app as application

# Log application startup
logger.info("WSGI application starting up")
