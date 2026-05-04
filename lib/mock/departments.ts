import type { Department } from '@/types'

export const departments: Department[] = [
  { id: 'DEPT-01', name: 'Production Line A', nameTh: 'ไลน์ผลิต A', headCount: 45 },
  { id: 'DEPT-02', name: 'Production Line B', nameTh: 'ไลน์ผลิต B', headCount: 38 },
  { id: 'DEPT-03', name: 'Quality Control',   nameTh: 'ควบคุมคุณภาพ', headCount: 12 },
  { id: 'DEPT-04', name: 'Warehouse',          nameTh: 'คลังสินค้า', headCount: 20 },
  { id: 'DEPT-05', name: 'Maintenance',        nameTh: 'ซ่อมบำรุง', headCount: 8 },
  { id: 'DEPT-06', name: 'HR & Admin',         nameTh: 'HR & ธุรการ', headCount: 6 },
  { id: 'DEPT-07', name: 'Finance',            nameTh: 'การเงิน', headCount: 4 },
]
