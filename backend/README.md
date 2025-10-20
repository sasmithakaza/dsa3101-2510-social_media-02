# Backend

This folder contains the backend setup for the project, including model scripts, database configurations, and API endpoints used to serve bias label predictions, threshold detections, and post recommendations to the frontend.

## Structure Overview
>  Note: The folder structure below serves as a rough placeholder for final deployment and does not reflect our current organization. Some files (e.g., Docker configurations or exported models) may not exist yet as the project is currently in the development and testing phase.

```
backend/
├── api/
│   ├── app.py                 # main API entry point
│   ├── routes/                # route definitions for posting frontend data to backend & fetching backend data to frontend
│   └── __init__.py
├── models/
│   ├── bias_model.py          # bias model logic (can be removed or kept in side branch once .pkl file is generated)
│   ├── bias_model.ipynb       # bias model logic (can be removed or kept in side branch once .pkl file is generated)
│   └── bias_model.pkl
├── database/
│   └── import_csvs.py
│   └── requirements.txt
│   └── Dockerfile
│   └── docker-compose.yml  
│   └── README.md      
├── Dockerfile
├── docker-compose.yml         # orchestrates model + DB containers
├── requirements.txt
└── README.md
```
