import pyotp

def generate_totp_secret() -> str:
    """Returns a random base32 string."""
    return pyotp.random_base32()

def get_provisioning_uri(email: str, secret: str) -> str:
    """Returns a standard otpauth:// URI using issuer name 'BCoreCoreERP'."""
    return pyotp.totp.TOTP(secret).provisioning_uri(name=email, issuer_name="BCoreCoreERP")

def verify_totp_code(secret: str, code: str) -> bool:
    """Verifies a TOTP 6-digit code, allowing a drift window of 1 interval."""
    try:
        return pyotp.TOTP(secret).verify(code, valid_window=1)
    except Exception:
        return False
