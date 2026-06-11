import os
import json
import logging
import urllib.request
import urllib.error

logger = logging.getLogger("bcore.resend")

def send_onboarding_email(to_email: str, onboarding_url: str) -> bool:
    api_key = os.environ.get("RESEND_API_KEY")
    from_email = os.environ.get("RESEND_FROM_EMAIL", "onboarding@bcore.digital")
    
    if not api_key:
        logger.warning("[RESEND] RESEND_API_KEY not set in environment. Skipping email dispatch. Onboarding URL: %s", onboarding_url)
        return False
        
    url = "https://api.resend.com/emails"
    
    # HTML body
    html_content = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #9d4edd; text-align: center;">Welcome to B-Core Nexus</h2>
        <p>Hello,</p>
        <p>You have been provisioned as an operator on the B-Core Nexus Enterprise Operations Center.</p>
        <p>Please click the button below to set up your password and activate your account:</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{onboarding_url}" style="background-color: #9d4edd; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Activate Account</a>
        </div>
        <p style="font-size: 0.8rem; color: #718096;">If the button above does not work, copy and paste this URL into your browser:</p>
        <p style="font-size: 0.8rem; color: #4a5568; word-break: break-all;">{onboarding_url}</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 0.75rem; color: #a0aec0; text-align: center;">This link will expire in 24 hours.</p>
    </div>
    """
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 B-Core-Nexus"
    }
    
    payload = {
        "from": from_email,
        "to": [to_email],
        "subject": "Activate Your B-Core Nexus Account",
        "html": html_content
    }
    
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST"
        )
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            logger.info("[RESEND] Email sent successfully to %s: %s", to_email, res_data)
            return True
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        logger.error("[RESEND] Failed to send email via Resend. Status: %s, Response: %s", e.code, err_body)
        return False
    except Exception as e:
        logger.error("[RESEND] Error connecting to Resend API: %s", str(e))
        return False
