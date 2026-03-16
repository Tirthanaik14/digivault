# app/models/__init__.py
# Importing here makes SQLAlchemy aware of all models when create_all_tables() runs.
from app.models.user import User
from app.models.transaction import Transaction
from app.models.institution import Institution
from app.models.blacklist import Blacklist

__all__ = ["User", "Transaction", "Institution", "Blacklist"]
