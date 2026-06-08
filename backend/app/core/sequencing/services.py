from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from app.core.sequencing.models import DocumentSequence

async def get_next_sequence_number(db: AsyncSession, sequence_key: str) -> str:
    # Acquire a row-level lock to prevent race conditions across concurrent async requests
    stmt = select(DocumentSequence).where(DocumentSequence.sequence_key == sequence_key).with_for_update()
    result = await db.execute(stmt)
    seq = result.scalar_one_or_none()

    if not seq:
        # Create an initial fallback record if the sequence doesn't exist yet
        # Derive a sensible default prefix from the sequence key (e.g. 'inventory_transfers' -> 'INV-')
        prefix = sequence_key[:3].upper() + "-" if len(sequence_key) >= 3 else "SEQ-"
        seq = DocumentSequence(
            sequence_key=sequence_key,
            prefix=prefix,
            next_value=1,
            padding_length=6
        )
        db.add(seq)
        
        try:
            await db.flush()
        except IntegrityError:
            # Handle the edge case where another concurrent request created the row exactly before we did
            await db.flush()
            result = await db.execute(stmt)
            seq = result.scalar_one()

    # Construct the finalized string (e.g., 'INV-000001')
    padded_value = str(seq.next_value).zfill(seq.padding_length)
    generated_sequence = f"{seq.prefix}{padded_value}"

    # Increment the next_value for the subsequent call
    seq.next_value += 1

    # Flush the transaction to persist the increment and release locks/trigger updates
    await db.flush()

    return generated_sequence
