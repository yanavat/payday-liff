# Business Rules — EWA System

## R1: Earned Wage Calculation

Monthly employee:
earnedToDate = (monthlySalary / totalWorkDays) × workedDays

Weekly employee:
earnedToDate = dailyRate × workedDaysThisWeek

## R2: Maximum Withdrawable

maxWithdrawable = (earnedToDate × maxPercent) - previousEWAThisPeriod

Example (monthly):
Salary ฿18,000 / 22 work days × 18 days worked = ฿14,727
Max 50% = ฿7,363
Previous EWA = ฿1,100
Available = ฿6,263

## R3: Request Limits

Monthly: max 2 requests per month
Weekly: max 1 request per week
Cannot request if quota_used

## R4: Amount Validation

amount >= ฿500 (minimum)
amount <= maxWithdrawable
amount must be whole number (no satang)

## R5: Cutoff Rules

Monthly: no EWA requests after 25th of month
Weekly: no EWA requests after Thursday 18:00

If blackout date → show: "ไม่สามารถยื่นคำขอได้ในวันนี้"

## R6: Auto-Approval

If enabled AND amount < threshold (e.g., ฿3,000):
status = "approved" immediately
Else:
status = "pending" → wait for HR

## R7: PIN Security

Wrong PIN 5 times → lock 30 minutes
Show remaining attempts: "เหลือ X ครั้ง"

## R8: HR On-Behalf Rules

HR must provide reason for on-behalf request
No PIN required (HR session auth)
Audit log records HR name

## R9: Status Flow

pending → approved → disbursed
pending → rejected (terminal)

Cannot edit after approved
Cannot re-submit rejected (must create new)
