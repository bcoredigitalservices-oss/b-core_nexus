import asyncio
import logging
from typing import Callable, Dict, List, Any

logger = logging.getLogger("bcore.events")

class EventBus:
    """
    Internal Event Bus for B-Core Nexus.
    Implements the Event-Driven Architecture (EDA) inside the backend.
    """
    def __init__(self):
        # Maps event_name to a list of async callback functions
        self.subscribers: Dict[str, List[Callable[..., Any]]] = {}

    def subscribe(self, event_name: str, callback: Callable[..., Any]):
        """Subscribe an async callback to a specific event."""
        if event_name not in self.subscribers:
            self.subscribers[event_name] = []
        self.subscribers[event_name].append(callback)
        logger.info(f"Subscribed '{callback.__name__}' to event '{event_name}'")

    async def publish(self, event_name: str, payload: Any = None):
        """
        Publish an event with an optional payload.
        Callbacks are dispatched as background asyncio tasks so they don't block.
        """
        if event_name not in self.subscribers:
            logger.debug(f"Event published but no subscribers found: {event_name}")
            return
            
        callbacks = self.subscribers[event_name]
        logger.info(f"Publishing event '{event_name}' to {len(callbacks)} subscribers.")
        
        for callback in callbacks:
            # Fire and forget
            asyncio.create_task(self._safe_execute(callback, event_name, payload))
            
    async def _safe_execute(self, callback: Callable, event_name: str, payload: Any):
        try:
            if payload is not None:
                await callback(payload)
            else:
                await callback()
        except Exception as e:
            logger.error(f"Error executing subscriber '{callback.__name__}' for event '{event_name}': {e}", exc_info=True)

# Global internal event bus singleton
internal_bus = EventBus()
