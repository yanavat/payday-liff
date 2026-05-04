# Product Brief — PayDay+ EWA System

## What is this?

Earned Wage Access platform for factory workers.
Employees can withdraw earned wages before payday.
HR/Accountant manages approvals and disbursements.

## Users

| Role       | Platform         | Key Action              |
| ---------- | ---------------- | ----------------------- |
| HR Manager | Desktop (1440px) | Approve/reject requests |
| Accountant | Desktop (1440px) | View reports, reconcile |
| Employee   | Mobile (390px)   | Submit EWA requests     |

## Core Flow

Employee submits request → HR reviews → Approve/Reject
→ Disbursement → Deduct from next payroll

## Pay Cycle Support

- Monthly: 1st–31st, cutoff 25th, payday end of month
- Weekly: Mon–Fri, cutoff Thursday, payday Friday

## Language Support

TH (primary) | EN | Myanmar (MM)

## Scope (MVP)

Frontend only. Mock data. No real backend.
Deploy on Vercel for demo and stakeholder review.

## Tech Stack

Next.js 14 + TypeScript + Tailwind + shadcn/ui

## Screen Count

HR Side: 7 screens (desktop)
Employee Side: 5 screens (mobile)
Total: 12 screens
