import logging
from app.core.events.bus import internal_bus
from app.database import AsyncSessionLocal
from app.workspaces.crm.models import Customer
from app.core.directory.models import ProfileType

logger = logging.getLogger("bcore.crm.events")

async def on_directory_profile_created(profile):
    """
    EDA Subscriber: Listens for DirectoryProfileCreated.
    If the profile is a CUSTOMER, it autonomously provisions a CRM Customer record.
    """
    if profile.profile_type != ProfileType.CUSTOMER:
        return

    logger.info(f"EDA Trigger: Automatically creating CRM Customer for {profile.name}")
    
    # We use a fresh database session since this runs asynchronously in the background
    async with AsyncSessionLocal() as db:
        new_customer = Customer(
            company_name=profile.name,
            contact_name="Directory Auto-Provisioned",
            email=profile.email or f"{profile.id}@placeholder.local",
            phone=profile.phone
        )
        db.add(new_customer)
        try:
            await db.commit()
            logger.info(f"Success: CRM Customer '{new_customer.company_name}' provisioned via Event Bus.")
        except Exception as e:
            await db.rollback()
            logger.error(f"Failed to auto-provision CRM Customer: {e}")

def register_crm_events():
    """Register all CRM event subscribers."""
    internal_bus.subscribe("DirectoryProfileCreated", on_directory_profile_created)
    logger.info("CRM Event Subscribers Registered.")
