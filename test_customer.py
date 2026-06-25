import requests
import jwt
from datetime import datetime, timedelta

# Create a dev token
SECRET_KEY = "bcore_nexus_super_secret_local_key_development_only"
ALGORITHM = "HS256"
# User ID can be arbitrary if we don't strict-check in DB, or we can fetch a user
# Actually, the global_ws_stream checks user in DB, but does the router check user? 
# The CRM router uses Depends(require_workspace_access("crm"))

payload = {
    "sub": "00000000-0000-0000-0000-000000000001",
    "exp": datetime.utcnow() + timedelta(minutes=60)
}
token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

# In case the mock user doesn't have workspace access or user ID doesn't exist, we might get 403.
# Let's see what happens.
url = "http://localhost:8005/api/v1/workspaces/crm/customers"
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
data = {
  "company_name": "Test Company",
  "contact_name": "Test Contact",
  "email": "test456@test.com",
  "phone": "1234567890",
  "lifecycle_status": "LEAD",
  "custom_attributes": {}
}

response = requests.post(url, headers=headers, json=data)
print("Status Code:", response.status_code)
print("Response:", response.text)
