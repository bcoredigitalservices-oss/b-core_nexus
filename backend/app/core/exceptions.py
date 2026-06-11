class CoreERPException(Exception):
    """Base exception for all B-Core ERP domain errors."""
    def __init__(self, message: str, error_code: str = "INTERNAL_ERROR", status_code: int = 500):
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        super().__init__(message)

class InsufficientClearanceError(CoreERPException):
    """Raised when a user lacks the required operational clearances."""
    def __init__(self, message: str = "Insufficient operational clearance."):
        super().__init__(
            message=message,
            error_code="INSUFFICIENT_CLEARANCE",
            status_code=403
        )

class InstanceAlreadyInitializedError(CoreERPException):
    """Raised when trying to initialize an already configured system instance."""
    def __init__(self, message: str = "Instance already initialized."):
        super().__init__(
            message=message,
            error_code="INSTANCE_ALREADY_INITIALIZED",
            status_code=410
        )

class ResourceNotFoundError(CoreERPException):
    """Raised when a requested resource cannot be found."""
    def __init__(self, message: str = "Resource not found."):
        super().__init__(
            message=message,
            error_code="RESOURCE_NOT_FOUND",
            status_code=404
        )

class DomainValidationError(CoreERPException):
    """Raised when a business rule or invariant is violated within a domain."""
    def __init__(self, message: str = "Domain validation failed."):
        super().__init__(
            message=message,
            error_code="DOMAIN_VALIDATION_ERROR",
            status_code=400
        )

class DataIntegrityError(CoreERPException):
    """Raised when a repository encounters a database integrity conflict (e.g., duplicates)."""
    def __init__(self, message: str = "Data integrity conflict detected."):
        super().__init__(
            message=message,
            error_code="DATA_INTEGRITY_CONFLICT",
            status_code=409
        )
