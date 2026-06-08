from app.core.auth.models import User
print("SQLAlchemy columns for User:", [c.name for c in User.__table__.columns])
