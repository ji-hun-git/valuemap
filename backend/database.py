"""Database configuration for Atlas of Value."""

from os import getenv


DATABASE_URL = getenv("DATABASE_URL", "postgresql+psycopg2://localhost/atlas_of_value")
