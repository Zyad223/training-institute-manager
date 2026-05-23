import type {
  CourseStatus,
  EnrollmentStatus,
  InstituteStatus,
  PaymentMethod,
  TrainerCompType,
} from "@/utils/constants"

export type Institute = {
  id: string
  name: string
  city: string
  address: string
  phone: string
  email: string
  status: InstituteStatus
  createdAt: string
}

export type Course = {
  id: string
  instituteId: string
  trainerId: string | null
  trainerCompType: TrainerCompType
  trainerCompValue: number
  startAt: string
  durationMinutes: number
  title: string
  description: string
  price: number
  status: CourseStatus
  createdAt: string
}

export type Trainer = {
  id: string
  fullName: string
  phone: string
  email: string
  specialty: string
  createdAt: string
}

export type Student = {
  id: string
  fullName: string
  phone: string
  email: string
  createdAt: string
}

export type Enrollment = {
  id: string
  studentId: string
  courseId: string
  enrolledAt: string
  status: EnrollmentStatus
  amountPaid: number
}

export type TrainerPayout = {
  id: string
  trainerId: string
  courseId: string | null
  amount: number
  paidAt: string
  note: string
}

export type EnrollmentPayment = {
  id: string
  enrollmentId: string
  amount: number
  method: PaymentMethod
  paidAt: string
  receiptNo: string
  note: string
}
