import type { HRUser, Employee } from '@/types'

// Mock HR user session
export const hrUser: HRUser = {
  id: 'HR-0001',
  name: 'Siriwan Buakum',
  email: 'siriwan@factory.co.th',
  role: 'hr_manager',
}

// Mock employee session (for employee-side screens)
// In a real app this would come from auth context
export const currentEmployee: Employee = {
  id: 'EMP-0001',
  name: 'Somchai Jaidee',
  nameTh: 'สมชาย ใจดี',
  department: 'ไลน์ผลิต A',
  position: 'พนักงานสายการผลิต',
  payCycle: 'monthly',
  workType: 'onsite',
  baseSalary: 15000,
  bankAccountMasked: 'กสิกรไทย xxx-x-xx891-2',
  bankName: 'KBANK',
  ewaStatus: 'eligible',
  enrolledAt: '2024-01-15',
}
