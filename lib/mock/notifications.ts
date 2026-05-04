export interface Notification {
  id: string
  type: 'request_approved' | 'request_rejected' | 'request_pending' | 'system' | 'payday'
  title: string
  titleTh: string
  message: string
  messageTh: string
  timestamp: string
  read: boolean
  employeeId?: string
  requestId?: string
}

export const notifications: Notification[] = [
  {
    id: 'NOTIF-001',
    type: 'request_pending',
    title: 'New EWA Request',
    titleTh: 'คำขอเบิกเงินใหม่',
    message: 'Somchai Jaidee has submitted a request for ฿3,000',
    messageTh: 'สมชาย ใจดี ยื่นคำขอเบิกเงิน ฿3,000',
    timestamp: '2025-05-14T09:12:00',
    read: false,
    employeeId: 'EMP-0001',
    requestId: 'EWA-2025-000001',
  },
  {
    id: 'NOTIF-002',
    type: 'request_pending',
    title: 'New EWA Request',
    titleTh: 'คำขอเบิกเงินใหม่',
    message: 'Su Su Win has submitted a request for ฿1,000',
    messageTh: 'ซู ซู วิน ยื่นคำขอเบิกเงิน ฿1,000',
    timestamp: '2025-05-14T08:30:00',
    read: false,
    employeeId: 'EMP-0007',
    requestId: 'EWA-2025-000005',
  },
  {
    id: 'NOTIF-003',
    type: 'request_approved',
    title: 'Request Approved',
    titleTh: 'อนุมัติคำขอแล้ว',
    message: 'Nattaya Srisuk\'s request for ฿5,000 has been approved',
    messageTh: 'คำขอของ ณัฐยา ศรีสุข ฿5,000 ได้รับการอนุมัติแล้ว',
    timestamp: '2025-05-13T14:20:00',
    read: true,
    employeeId: 'EMP-0002',
    requestId: 'EWA-2025-000002',
  },
  {
    id: 'NOTIF-004',
    type: 'payday',
    title: 'Monthly Payday Reminder',
    titleTh: 'แจ้งเตือนวันจ่ายเงินเดือน',
    message: 'Monthly payday is in 17 days (May 31)',
    messageTh: 'วันจ่ายเงินเดือนอีก 17 วัน (31 พฤษภาคม)',
    timestamp: '2025-05-14T07:00:00',
    read: true,
  },
  {
    id: 'NOTIF-005',
    type: 'system',
    title: 'EWA Cutoff Approaching',
    titleTh: 'ใกล้ถึงวันปิดรับคำขอ',
    message: 'Weekly EWA cutoff is tomorrow (May 15)',
    messageTh: 'วันปิดรับคำขอรายสัปดาห์คือพรุ่งนี้ (15 พฤษภาคม)',
    timestamp: '2025-05-14T06:00:00',
    read: false,
  },
]
