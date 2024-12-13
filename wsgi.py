import sys
import os
import logging

# Configure basic logging to stderr (PythonAnywhere will capture this)
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
project_dir = '/home/sheen11/smart-city-dashboard'
if project_dir not in sys.path:
    sys.path.insert(0, project_dir)
    logger.debug(f"Added {project_dir} to Python path")

def application(environ, start_response):
    # Get the requested path
    path_info = environ.get('PATH_INFO', '')
    
    # Log the request for debugging
    logger.debug(f"Requested path: {path_info}")
    
    if path_info.startswith('/static/'):
        # Let Apache handle static files
        return None
    
    # For all other paths, serve index.html
    try:
        status = '200 OK'
        headers = [
            ('Content-type', 'text/html'),
            ('Cache-Control', 'no-cache, no-store, must-revalidate'),
            ('Pragma', 'no-cache'),
            ('Expires', '0')
        ]
        start_response(status, headers)
        
        with open(os.path.join(project_dir, 'index.html'), 'rb') as f:
            return [f.read()]
    except Exception as e:
        logger.error(f"Error serving index.html: {str(e)}")
        status = '500 Internal Server Error'
        headers = [('Content-type', 'text/plain')]
        start_response(status, headers)
        return [str(e).encode('utf-8')]
