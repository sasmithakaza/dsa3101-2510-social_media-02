# Use Python slim image
FROM python:3.11-slim

WORKDIR /app

# Copy only the requirements.txt first to leverage Docker's cache
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the database initialization script and data files
COPY . .

# Run the database seeding script when the container starts
CMD ["python", "create_tables.py"]