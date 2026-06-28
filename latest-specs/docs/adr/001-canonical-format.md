# ADR-001: Canonical Serialization Format

**Status:** Accepted
**Date:** 2026-06-27
**Epic:** Epic 2 — Beancount Parser & Canonical Serializer (M1)

## Context

SPEC C4 requires deterministic canonical serialization: given the same set of transactions, every peer renders byte-identical `.bean` output. This is load-bearing for P2P merge convergence (I6, I7) and `txid` hashing (I5).

We need to define a precise, unambiguous serialization format and decide whether to write a custom parser or wrap an existing one.

## Decision

### Parser Approach: Hand-Written

We chose a **hand-written recursive-descent parser** over wrapping an existing Beancount parser for these reasons:

1. **No viable npm Beancount parser.** The reference Beancount parser is Python (`beancount`). No actively maintained, Bun-compatible npm package exists.
2. **Scoped subset.** We only support 10 directive types (§2.3), not full Beancount syntax. A hand-written parser for this subset is straightforward.
3. **Round-trip control.** The parser and serializer must be perfectly symmetric. A hand-written parser gives us full control over which details are preserved.
4. **No external dependency.** Avoids coupling to a third-party library that could drift from our specification.

### Canonical Serialization Rules

The following rules define the canonical `.bean` format. Any file produced by `canonicalSerialize()` conforms to these rules, and `parseBeancount()` round-trips cleanly through them.

#### 1. Directive Ordering

Directives are sorted by a three-level key:
1. **Date** (ascending, lexicographic `YYYY-MM-DD`)
2. **Type priority** (numeric, lower = earlier):
   - `open` (0), `commodity` (1), `pad` (2), `balance` (3), `transaction` (4), `note` (5), `document` (6), `event` (7), `price` (8), `close` (9)
3. **Stable sort key** (type-specific, lexicographic):
   - Transaction: `narration|payee`
   - Open/Close: `account`
   - Balance: `account|amount`
   - Pad: `account|sourceAccount`
   - Commodity: `currency`
   - Price: `currency|amount`
   - Note: `account|comment`
   - Document: `account|path`
   - Event: `name|value`

This ordering ensures `open` comes before transactions which come before `close` within the same date, matching the logical lifecycle of accounts.

#### 2. Transaction Header Format

```
YYYY-MM-DD FLAG "payee" "narration" #tag1 #tag2 ^link1
```

- `FLAG` is `*` (complete) or `!` (incomplete)
- Payee and narration are double-quoted strings
- If only narration (no payee): `YYYY-MM-DD FLAG "narration"`
- Tags prefixed with `#`, links prefixed with `^`

#### 3. Posting Format

```
  Account                                     NUMBER CURRENCY
```

- 2-space indentation
- Amount right-aligned to column 52
- If the account name is too long, a minimum 2-space gap separates account from amount
- Cost: `{NUMBER CURRENCY}` appended after amount
- Price: `@ NUMBER CURRENCY` or `@@ NUMBER CURRENCY` appended after cost/amount

#### 4. Amount Formatting

- Decimal numbers formatted via `Decimal.toFixed()` — preserves original precision
- No thousands separators in output
- Currency follows number, separated by a single space

#### 5. String Quoting

- All strings double-quoted: `"value"`
- Escaped characters: `\"` for quote, `\\` for backslash

#### 6. Metadata Format

```
  key: "value"
```

- 2-space indentation
- Keys sorted alphabetically for determinism
- Values always double-quoted

#### 7. Whitespace Rules

- **Line endings:** Always `\n` (Unix), never `\r\n`
- **Trailing newline:** File ends with exactly one `\n`
- **Blank lines:** Exactly one blank line between top-level directives
- **Indentation:** 2 spaces for postings and metadata lines

#### 8. Comments

- Top-level comments (lines starting with `;`) are preserved and placed at the beginning of the file
- Inline comments are not part of the canonical form

### txid Hashing

`txid = SHA-256(canonicalSerializeTransaction(transaction))`

- Produces a 64-character lowercase hexadecimal string
- **Only the transaction directive is hashed**, not surrounding context
- The `signature` field is explicitly **excluded** from the canonical form (§3.8)
- Toggling signing does not change any `txid`

## Consequences

- **Positive:** Full round-trip stability (I7) — `parse(serialize(t))` produces identical directives
- **Positive:** Byte-identical output across peers (C4) enables clean P2P merge and git diffs
- **Positive:** No external parser dependency — the format is fully under our control
- **Positive:** `txid` stability (I5) is a direct consequence of deterministic serialization
- **Trade-off:** We don't support the full Beancount syntax (only the §2.3 subset). Files using unsupported directives (plugins, custom directives, etc.) may not round-trip.
- **Trade-off:** The parser is hand-written, so extending it requires manual work. However, the supported subset is stable and well-defined.

## References

- SPEC §2.3 — Domain model & ubiquitous language
- SPEC §2.4, I5 — `txid = hash(canonical_serialize(txn))`
- SPEC §2.4, I7 — Round-trip stability
- SPEC §3.3 — Source of truth & derived DAG
- SPEC §3.8 — Security & peer identity (signature exclusion from canonical form)
- C1 — `.bean` is the single source of truth
- C4 — Deterministic canonical serialization
