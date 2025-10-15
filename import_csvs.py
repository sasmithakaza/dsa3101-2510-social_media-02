import os
import time
import pandas as pd
from sqlalchemy import create_engine

# Wait for MySQL to be ready
time.sleep(10)

# Environment variables from docker-compose.yml
db_host = os.getenv("MYSQL_HOST", "mysql_db")
db_user = os.getenv("MYSQL_USER", "root")
db_password = os.getenv("MYSQL_PASSWORD", "root")
db_name = os.getenv("MYSQL_DATABASE", "mydatabase")

# Create SQLAlchemy connection
engine_str = f"mysql+pymysql://{db_user}:{db_password}@{db_host}:3306/{db_name}"
engine = create_engine(engine_str)

data_folder = "data"

# Import unlabelled data → redditposts
unlabelled_file = os.path.join(data_folder, "unlabelled_data_clean.csv")
if os.path.exists(unlabelled_file):
    print(f"📥 Importing {unlabelled_file} → table 'redditposts'")
    df_unlabelled = pd.read_csv(unlabelled_file)
    df_unlabelled.to_sql("redditposts", con=engine, if_exists="replace", index=False)

# Import labelled data → newsarticles
labelled_files = [f"labelled_data_part{i}.csv" for i in range(1, 11)]
newsarticles_df_list = []

for file in labelled_files:
    path = os.path.join(data_folder, file)
    if os.path.exists(path):
        print(f"📥 Reading {file} for newsarticles table")
        df = pd.read_csv(path)
        newsarticles_df_list.append(df)

if newsarticles_df_list:
    all_labelled_df = pd.concat(newsarticles_df_list, ignore_index=True)
    print(f"📥 Writing combined labelled data → table 'newsarticles'")
    all_labelled_df.to_sql("newsarticles", con=engine, if_exists="replace", index=False)

print("✅ All CSV files imported successfully!")