"""add_itemgroup_hierarchy_and_settings

Revision ID: 25f6d5f2a24a
Revises: b4d07413ba3d
Create Date: 2026-06-24 17:51:33.658220

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '25f6d5f2a24a'
down_revision: Union[str, Sequence[str], None] = 'b4d07413ba3d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 1. Create inv_item_groups table
    op.create_table(
        'inv_item_groups',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('parent_id', sa.UUID(), nullable=True),
        sa.Column('custom_attributes', sa.dialects.postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.ForeignKeyConstraint(['parent_id'], ['inv_item_groups.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_inv_item_groups_custom_attributes', 'inv_item_groups', ['custom_attributes'], unique=False, postgresql_using='gin')
    op.create_index(op.f('ix_inv_item_groups_name'), 'inv_item_groups', ['name'], unique=True)

    # 2. Create inv_settings table
    op.create_table(
        'inv_settings',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('default_uom', sa.String(length=50), nullable=False),
        sa.Column('custom_attributes', sa.dialects.postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_inv_settings_custom_attributes', 'inv_settings', ['custom_attributes'], unique=False, postgresql_using='gin')

    # 3. Add item_group_id to inv_items
    op.add_column('inv_items', sa.Column('item_group_id', sa.UUID(), nullable=True))
    op.create_foreign_key('fk_inv_items_item_group_id', 'inv_items', 'inv_item_groups', ['item_group_id'], ['id'], ondelete='SET NULL')

    # 4. Seed default General item group
    op.execute(
        "INSERT INTO inv_item_groups (id, name, custom_attributes) "
        "VALUES ('ea4d7328-98e6-42f0-8c26-6816fb457788', 'General', '{}') "
        "ON CONFLICT (name) DO NOTHING"
    )

    # 5. Migrate existing item_group text values to inv_item_groups and link them
    op.execute(
        "INSERT INTO inv_item_groups (id, name, custom_attributes) "
        "SELECT gen_random_uuid(), item_group, '{}' "
        "FROM (SELECT DISTINCT item_group FROM inv_items WHERE item_group != 'General' AND item_group IS NOT NULL) AS uniques "
        "ON CONFLICT (name) DO NOTHING"
    )
    op.execute(
        "UPDATE inv_items "
        "SET item_group_id = inv_item_groups.id "
        "FROM inv_item_groups "
        "WHERE inv_items.item_group = inv_item_groups.name"
    )
    # Set default for any remaining nulls
    op.execute(
        "UPDATE inv_items "
        "SET item_group_id = 'ea4d7328-98e6-42f0-8c26-6816fb457788' "
        "WHERE item_group_id IS NULL"
    )

    # 6. Drop legacy string item_group column
    op.drop_column('inv_items', 'item_group')

    # 7. Seed default settings record
    op.execute(
        "INSERT INTO inv_settings (id, default_uom, custom_attributes) "
        "VALUES ('18f7d98c-02cf-4b92-8dbb-f9d2d0f507ba', 'Piece', '{}') "
        "ON CONFLICT DO NOTHING"
    )

def downgrade() -> None:
    """Downgrade schema."""

    # Re-add item_group string column to inv_items
    op.add_column('inv_items', sa.Column('item_group', sa.String(length=100), nullable=True))
    
    # Restore string values based on item_group name
    op.execute(
        "UPDATE inv_items "
        "SET item_group = inv_item_groups.name "
        "FROM inv_item_groups "
        "WHERE inv_items.item_group_id = inv_item_groups.id"
    )
    # Fill remaining default
    op.execute("UPDATE inv_items SET item_group = 'General' WHERE item_group IS NULL")
    op.alter_column('inv_items', 'item_group', nullable=False)

    # Drop foreign key and column
    op.drop_constraint('fk_inv_items_item_group_id', 'inv_items', type_='foreignkey')
    op.drop_column('inv_items', 'item_group_id')

    # Drop inv_settings table
    op.drop_index('idx_inv_settings_custom_attributes', table_name='inv_settings', postgresql_using='gin')
    op.drop_table('inv_settings')

    # Drop inv_item_groups table
    op.drop_index(op.f('ix_inv_item_groups_name'), table_name='inv_item_groups')
    op.drop_index('idx_inv_item_groups_custom_attributes', table_name='inv_item_groups', postgresql_using='gin')
    op.drop_table('inv_item_groups')
