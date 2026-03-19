# Documentation Style Guide

## Docstring Styles by Language

### TypeScript / JavaScript — JSDoc
```typescript
/**
 * Finds a user by their unique identifier.
 *
 * @param id - The user's UUID
 * @returns The user object, or null if not found
 * @throws {DatabaseError} If the database query fails
 *
 * @example
 * const user = await findUserById('abc-123');
 * if (user) console.log(user.name);
 */
async function findUserById(id: string): Promise<User | null> { ... }
```

### Python — Google style
```python
def find_user_by_id(user_id: int) -> User | None:
    """Find a user by their unique identifier.

    Args:
        user_id: The user's integer ID.

    Returns:
        The User object if found, otherwise None.

    Raises:
        DatabaseError: If the database query fails.

    Example:
        user = find_user_by_id(42)
        if user:
            print(user.name)
    """
```

### Go — godoc
```go
// FindUserByID retrieves a user from the database by their ID.
// Returns ErrNotFound if no user with the given ID exists.
func FindUserByID(ctx context.Context, id int64) (*User, error) { ... }
```

### Rust — rustdoc
```rust
/// Finds a user by their unique identifier.
///
/// Returns `None` if no user with the given ID exists.
///
/// # Errors
/// Returns `Err(DbError)` if the database query fails.
///
/// # Example
/// ```rust
/// let user = find_user_by_id(pool, 42).await?;
/// ```
pub async fn find_user_by_id(pool: &PgPool, id: i64) -> Result<Option<User>, DbError> { ... }
```

---

## README Section Templates

### New Feature Section
```markdown
## Feature Name

Brief description of what the feature does and why it's useful.

### Usage

\```language
// Minimal working example
\```

### Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `option_name` | `string` | `"default"` | What it controls |

### Notes
- Important constraint or gotcha
```

---

## CHANGELOG Format (Keep a Changelog)

```markdown
## [Unreleased]

### Added
- New `/users/:id/profile` endpoint for retrieving user profile data

### Changed
- `createUser` now validates email format before saving

### Fixed
- Fixed session timeout not resetting on user activity

### Removed
- Removed deprecated `getUserLegacy()` function
```

Rules:
- Use imperative mood ("Add", "Fix", not "Added", "Fixed")
- One bullet per user-visible change
- Link to PR or issue number if available: `(#123)`
- Group by category: Added / Changed / Fixed / Removed / Deprecated / Security
