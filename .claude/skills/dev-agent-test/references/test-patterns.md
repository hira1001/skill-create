# Test Patterns by Framework

## Jest (TypeScript/JavaScript)

### Structure
```typescript
import { createUser } from '../src/users';

describe('createUser', () => {
  it('creates a user with valid input', async () => {
    const user = await createUser({ name: 'Alice', email: 'alice@example.com' });
    expect(user.id).toBeDefined();
    expect(user.name).toBe('Alice');
  });

  it('throws on missing email', async () => {
    await expect(createUser({ name: 'Alice', email: '' }))
      .rejects.toThrow('Email is required');
  });
});
```

### Mocking
```typescript
jest.mock('../src/db', () => ({
  query: jest.fn().mockResolvedValue([{ id: 1, name: 'Alice' }])
}));
```

---

## pytest (Python)

### Structure
```python
import pytest
from src.users import create_user

def test_create_user_with_valid_input():
    user = create_user(name="Alice", email="alice@example.com")
    assert user.id is not None
    assert user.name == "Alice"

def test_create_user_raises_on_missing_email():
    with pytest.raises(ValueError, match="Email is required"):
        create_user(name="Alice", email="")

@pytest.fixture
def mock_db(mocker):
    return mocker.patch("src.users.db.query", return_value=[{"id": 1}])
```

---

## Go testing

### Structure
```go
func TestCreateUser(t *testing.T) {
    t.Run("creates user with valid input", func(t *testing.T) {
        user, err := CreateUser("Alice", "alice@example.com")
        if err != nil {
            t.Fatalf("unexpected error: %v", err)
        }
        if user.Name != "Alice" {
            t.Errorf("expected Alice, got %s", user.Name)
        }
    })

    t.Run("returns error on missing email", func(t *testing.T) {
        _, err := CreateUser("Alice", "")
        if err == nil {
            t.Fatal("expected error, got nil")
        }
    })
}
```

---

## Rust (#[test])

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn creates_user_with_valid_input() {
        let user = create_user("Alice", "alice@example.com").unwrap();
        assert_eq!(user.name, "Alice");
    }

    #[test]
    fn returns_error_on_missing_email() {
        let result = create_user("Alice", "");
        assert!(result.is_err());
    }
}
```

---

## Test Case Design Template

For each function, generate test cases covering:

| Category | Example |
|----------|---------|
| Happy path | Valid inputs → expected output |
| Empty input | `""`, `[]`, `{}`, `0` |
| Null/None input | `null`, `None`, `nil` |
| Boundary values | Max int, min int, single-element collection |
| Invalid type | String where int expected |
| Error condition | DB down, network timeout, permission denied |
| Concurrent access | Multiple simultaneous calls (if applicable) |
