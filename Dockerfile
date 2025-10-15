# Use Python slim image
FROM python:3.11-slim

WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy importer script
COPY import_csvs.py .

# Run the script when container starts
CMD ["python", "import_csvs.py"]