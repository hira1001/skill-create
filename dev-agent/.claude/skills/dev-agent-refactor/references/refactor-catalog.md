# Refactoring Catalog

## Extract Function
**When**: A block of code can be named and understood separately from its context.
**How**: Move the code block into a new function with a descriptive name. Pass in any variables it uses as parameters.
**Before**:
```typescript
// Order processing logic
const tax = total * 0.1;
const discount = total > 100 ? total * 0.05 : 0;
const finalTotal = total + tax - discount;
```
**After**:
```typescript
function calculateTotal(subtotal: number): number {
  const tax = subtotal * 0.1;
  const discount = subtotal > 100 ? subtotal * 0.05 : 0;
  return subtotal + tax - discount;
}
```

---

## Extract Class / Module
**When**: A class has too many responsibilities (god object), or a module has unrelated functions.
**How**: Identify a coherent subset of the functionality. Move it to a new class/module. Update the original to delegate.

---

## Replace Conditional with Polymorphism
**When**: A chain of if/else or switch-case based on an object's type.
**How**: Create a base class/interface with the behavior. Each variant implements it.

---

## Guard Clauses (Early Return)
**When**: Deeply nested if-else logic.
**How**: Invert conditions to return early for invalid cases, keeping the happy path unindented.
**Before**:
```typescript
function process(user) {
  if (user) {
    if (user.isActive) {
      if (user.hasPermission) {
        doWork(user);
      }
    }
  }
}
```
**After**:
```typescript
function process(user) {
  if (!user) return;
  if (!user.isActive) return;
  if (!user.hasPermission) return;
  doWork(user);
}
```

---

## Extract Constant / Configuration
**When**: Magic numbers or hardcoded strings appear in code.
**How**: Name them as constants at the top of the file or in a config module.

---

## Replace Duplication with Abstraction
**When**: The same logic appears in 3+ places with minor variations.
**How**: Extract a parameterized function that covers all cases. Replace each occurrence with a call to it.

---

## Separate Query from Command (CQS)
**When**: A function both modifies state AND returns data.
**How**: Split into two functions: one that queries (returns data, no side effects) and one that commands (modifies state, returns void).

---

## Introduce Parameter Object
**When**: A function takes 4+ parameters, especially if several always appear together.
**How**: Group related parameters into a single object/struct.

---

## Remove Dead Code
**When**: Functions, variables, imports, or files that are never called/used.
**How**: Delete them. Verify with search that there are no usages.

---

## Inline Function
**When**: A function's body is just as clear as its name, and the function is only called once.
**How**: Replace the call with the function body and delete the function.
