# Project Overview
It's a platform to connect Sponsors and Influencers so that sponsors can get their product/service advertised and influencers can get monetary benefit. 

## Frameworks to be used
These are the mandatory frameworks on which the project has to be built.
 - Flask for application code
 - Jinja2 templates + Bootstrap for HTML generation and styling
 - SQLite for data storage

# Project Setup

This guide covers the setup for the complete development environment including flask and all the flask libraries used.

## Prerequisites

Ensure you have Python installed on your machine.

## Installation Steps

First, clone the repository to your local machine and navigate into the project directory.

### Create a virtual environment
#### for macOS/Linux
```bash
python3 -m venv venv
```

### Activate the virtual environment
#### for macOS/Linux
```bash
source venv/bin/activate
```

### Install the dependencies
```bash
pip install -r requirements.txt
```

### Run the Flask application
```bash
python3 App.py
```

### Mailhog
Start Mailhog server (ensure you have Mailhog installed and properly configured):
```bash
~MailHog
```

### Redis Server
Start the Redis server:
```bash
redis-server
```

### Celery Worker
Start the Celery worker process:
```bash
celery -A App.celery worker -l info
```

### Celery Beat
Start the Celery beat process for periodic tasks:
```bash
celery -A App.celery beat --max-interval 1 -l info
```