# Backend

This folder contains the backend setup for the project, including model scripts, database configurations, and API endpoints used to serve bias label predictions, threshold detections, and post recommendations to the frontend.

## Overview

This backend consists of three main components:

1. **API Service** (`/api`) - FastAPI application providing REST endpoints
2. **Database Service** (`/database`) - MySQL database initialization and data loading
3. **Labelling Model** (`/labelling_model`) - Machine learning model for bias detection

## Architecture

```
backend/
├── api/                          # FastAPI REST API service
│   ├── combined_api.py           # Main API application
│   ├── Dockerfile                # API container configuration
│   ├── requirements.txt          # API dependencies
│   ├── .env                      # Environment variables (not in Git)
│   ├── .dockerignore
│   ├── .gitignore
│   └── README.md                 # API documentation
│
├── database/                     # Database initialization service
│   ├── create_tables.py          # DB setup and data loading
│   ├── Dockerfile                # Database service container
│   ├── requirements.txt          # Database service dependencies
│   ├── data/                     # CSV data files
│   │   ├── unlabelled_data_clean.csv
│   │   └── labelled_data_part[1-10].csv
│   ├── .gitignore
│   └── README.md                 # Database documentation
│
└── labelling_model/              # ML model for bias detection
    ├── bias_model.py             # Model implementation
    └── bias_model.ipynb          # Model development notebook
```

## Prerequisites

- Docker
- Python 3.11+ (for local development)
- MySQL 8.0+

## Components

### API Service

The API service provides REST endpoints for:
- User activity tracking
- Reddit post retrieval
- News article access
- Bias detection integration
- Recommendation system

**Documentation**: See [`api/README.md`](./api/README.md)

**Access**: 
- Base URL: `http://localhost:8001`
- API Docs: `http://localhost:8001/docs`
- ReDoc: `http://localhost:8001/redoc`

### Database Service

Manages database initialization including:
- MySQL connection with retry logic
- Loading unlabelled Reddit posts
- Loading labelled news articles (10 CSV files)
- Creating user activity tracking tables

**Documentation**: See [`database/README.md`](./database/README.md)

**Database Schema**:
- `redditposts` - Unlabelled social media posts
- `newsarticles` - Labelled news articles with bias classifications
- `user_activity` - User interaction and recommendation tracking

### Labelling Model

Machine learning model for detecting bias in social media content.

**Files**:
- `bias_model.py` - Production model implementation
- `bias_model.ipynb` - Development and training notebook

Note: Model is hosted on AWS.

## Environment Variables

All services use the following database connection variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | MySQL host | `mysql` |
| `DB_USER` | Database username | `root` |
| `DB_PASSWORD` | Database password | `root` |
| `DB_NAME` | Database name | `mydatabase` |
| `DB_PORT` | Database port | `3306` |

Additional service-specific variables may be documented in individual README files.

## Data Files

The database service requires the following CSV files in `database/data/`:

- `unlabelled_data_clean.csv` - Reddit posts without bias labels
- `labelled_data_part1.csv` through `labelled_data_part10.csv` - News articles with bias labels

These files are loaded automatically during database initialization.

## Production Considerations

- Use Docker secrets or environment variable management for credentials
- Set up proper database backups
- Configure logging and monitoring
- Use reverse proxy (nginx) for API
- Implement rate limiting
- Set up SSL/TLS certificates
- Configure proper network isolation

## Contributing

When contributing to the backend:

1. Make changes in the appropriate service directory
2. Update relevant README files
3. Test locally before committing
4. Ensure all services build successfully
5. Update this main README if adding new services


## Support

For service-specific issues, refer to individual README files:
- API issues: [`api/README.md`](./api/README.md)
- Database issues: [`database/README.md`](./database/README.md)