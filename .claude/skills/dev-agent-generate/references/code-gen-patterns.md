# Code Generation Patterns by Language

## TypeScript / JavaScript

### File Structure
- Group imports: stdlib → third-party → local (blank line between groups)
- Export at bottom of file or inline with declaration
- Use `type` imports for type-only imports: `import type { Foo } from './foo'`

### Naming
- Variables and functions: camelCase
- Classes and types: PascalCase
- Constants: UPPER_SNAKE_CASE
- Files: kebab-case.ts

### Common Patterns
```typescript
// Route handler (Express)
export const getUser = async (req: Request, res: Response) => {
  try {
    const user = await userService.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Service method
export class UserService {
  constructor(private readonly db: Database) {}

  async findById(id: string): Promise<User | null> {
    return this.db.query('SELECT * FROM users WHERE id = $1', [id]);
  }
}
```

---

## Python

### File Structure
- stdlib imports → third-party → local (PEP 8)
- Class definitions before module-level functions

### Naming
- Variables and functions: snake_case
- Classes: PascalCase
- Constants: UPPER_SNAKE_CASE
- Private: _leading_underscore

### Common Patterns
```python
# FastAPI endpoint
@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Service class
class UserService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def find_by_id(self, user_id: int) -> User | None:
        return await self.db.get(User, user_id)
```

---

## Go

### Naming
- Functions/methods: camelCase (PascalCase if exported)
- Interfaces: single method → method name + "er" (e.g., `Reader`)
- Files: snake_case.go
- Errors: `var ErrNotFound = errors.New("not found")`

### Common Patterns
```go
// Handler
func (h *UserHandler) GetUser(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")
    user, err := h.svc.FindByID(r.Context(), id)
    if errors.Is(err, ErrNotFound) {
        http.Error(w, "not found", http.StatusNotFound)
        return
    }
    if err != nil {
        http.Error(w, "internal error", http.StatusInternalServerError)
        return
    }
    json.NewEncoder(w).Encode(user)
}
```

---

## Rust

### Naming
- Variables and functions: snake_case
- Types, traits, enums: PascalCase
- Constants: UPPER_SNAKE_CASE

### Common Patterns
```rust
// Axum handler
pub async fn get_user(
    Path(id): Path<i64>,
    State(pool): State<PgPool>,
) -> Result<Json<User>, AppError> {
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
        .bind(id)
        .fetch_optional(&pool)
        .await?
        .ok_or(AppError::NotFound)?;
    Ok(Json(user))
}
```
