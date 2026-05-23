export const STORAGE_KEYS = {
  appState: "tim.appState.v1",
} as const

export const INSTITUTE_STATUS = ["active", "inactive"] as const
export type InstituteStatus = (typeof INSTITUTE_STATUS)[number]

export const COURSE_STATUS = ["draft", "published", "archived"] as const
export type CourseStatus = (typeof COURSE_STATUS)[number]

export const ENROLLMENT_STATUS = ["enrolled", "completed", "cancelled"] as const
export type EnrollmentStatus = (typeof ENROLLMENT_STATUS)[number]

export const TRAINER_COMP_TYPES = ["percent", "per_student", "fixed"] as const
export type TrainerCompType = (typeof TRAINER_COMP_TYPES)[number]

export const PAYMENT_METHODS = ["cash", "card", "transfer", "other"] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]
