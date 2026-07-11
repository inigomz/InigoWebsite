---
title: "Toy Language Compiler"
tech: ["Rust", "LLVM", "Cranelift", "Logos"]
links:
  - { label: "Repo", url: "https://github.com/inigo/toylang" }
  - { label: "Writeup", url: "https://example.com/toylang-writeup" }
description: "A small statically-typed language with type inference, generics, and an LLVM backend producing native binaries."
---

## Overview

Toylang is a small ML-flavored language built end-to-end as a learning
exercise: lexer, Pratt parser, Hindley-Milner type inference, monomorphization
of generic functions, and an LLVM-based code generator that emits native
executables. It supports first-class functions, algebraic data types, pattern
matching, and a tiny standard library written in the language itself.

## How it works

The front end tokenizes input with `logos` and parses into an untyped AST. The
type checker walks the AST, generating fresh type variables and equality
constraints, then unifies them with the standard occurs-check algorithm to
produce a fully annotated AST. Generic functions are specialized per concrete
instantiation during a second pass that lowers the typed AST into a simpler
core IR with explicit closures and tagged unions.

Code generation translates the core IR to LLVM IR through `inkwell`. Pattern
matches lower to decision trees built with the Maranget algorithm, so each
arm is checked exactly once and the compiler emits a warning when a branch
is unreachable or non-exhaustive.

## What I learned

Building inference before code generation made the rest of the pipeline far
calmer than I expected: every later pass operates on fully typed nodes, so
errors stay localized to the front end. The hardest part was getting
monomorphization right when generics call other generics; threading a
substitution map through the lowering pass turned out to be cleaner than
trying to memoize at the call site.
