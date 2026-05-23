import { create } from "zustand"
import { persist } from "zustand/middleware"

import { STORAGE_KEYS } from "@/utils/constants"
import type {
  Course,
  EnrollmentPayment,
  Enrollment,
  Institute,
  Student,
  Trainer,
  TrainerPayout,
} from "@/store/models"
import { genId, genReceiptNo } from "@/utils/helpers"

type AppState = {
  institutes: Institute[]
  courses: Course[]
  trainers: Trainer[]
  students: Student[]
  enrollments: Enrollment[]
  payouts: TrainerPayout[]
  payments: EnrollmentPayment[]
}

type AppActions = {
  instituteCreate: (data: Omit<Institute, "id" | "createdAt">) => Institute
  instituteUpdate: (id: string, patch: Partial<Omit<Institute, "id">>) => void
  instituteRemove: (id: string) => void

  courseCreate: (data: Omit<Course, "id" | "createdAt">) => Course
  courseUpdate: (id: string, patch: Partial<Omit<Course, "id">>) => void
  courseRemove: (id: string) => void

  trainerCreate: (data: Omit<Trainer, "id" | "createdAt">) => Trainer
  trainerUpdate: (id: string, patch: Partial<Omit<Trainer, "id">>) => void
  trainerRemove: (id: string) => void

  studentCreate: (data: Omit<Student, "id" | "createdAt">) => Student
  studentUpdate: (id: string, patch: Partial<Omit<Student, "id">>) => void
  studentRemove: (id: string) => void

  enrollmentCreate: (data: Omit<Enrollment, "id" | "enrolledAt">) => Enrollment
  enrollmentUpdate: (id: string, patch: Partial<Omit<Enrollment, "id">>) => void
  enrollmentRemove: (id: string) => void

  payoutCreate: (
    data: Omit<TrainerPayout, "id">
  ) => TrainerPayout
  payoutRemove: (id: string) => void

  paymentCreate: (data: Omit<EnrollmentPayment, "id" | "receiptNo"> & { receiptNo?: string }) => EnrollmentPayment
  paymentUpdate: (id: string, patch: Partial<Omit<EnrollmentPayment, "id">>) => void
  paymentRemove: (id: string) => void
}

function upsertById<T extends { id: string }>(
  items: T[],
  id: string,
  patch: Partial<Omit<T, "id">>
) {
  const index = items.findIndex((x) => x.id === id)
  if (index === -1) return items
  const next = items.slice()
  next[index] = { ...next[index], ...patch }
  return next
}

function removeById<T extends { id: string }>(items: T[], id: string) {
  return items.filter((x) => x.id !== id)
}

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      institutes: [],
      courses: [],
      trainers: [],
      students: [],
      enrollments: [],
      payouts: [],
      payments: [],

      instituteCreate: (data) => {
        const created: Institute = {
          id: genId("inst"),
          createdAt: new Date().toISOString(),
          ...data,
        }
        set({ institutes: [created, ...get().institutes] })
        return created
      },
      instituteUpdate: (id, patch) => {
        set({ institutes: upsertById(get().institutes, id, patch) })
      },
      instituteRemove: (id) => {
        const nextInstitutes = removeById(get().institutes, id)
        const nextCourses = get().courses.filter((c) => c.instituteId !== id)
        const removedCourseIds = new Set(
          get().courses.filter((c) => c.instituteId === id).map((c) => c.id)
        )
        const removedEnrollmentIds = new Set(
          get().enrollments
            .filter((e) => removedCourseIds.has(e.courseId))
            .map((e) => e.id)
        )
        const nextEnrollments = get().enrollments.filter((e) => !removedEnrollmentIds.has(e.id))
        const nextPayments = get().payments.filter((p) => !removedEnrollmentIds.has(p.enrollmentId))
        set({
          institutes: nextInstitutes,
          courses: nextCourses,
          enrollments: nextEnrollments,
          payments: nextPayments,
        })
      },

      courseCreate: (data) => {
        const created: Course = {
          id: genId("course"),
          createdAt: new Date().toISOString(),
          ...data,
          trainerId: data.trainerId ?? null,
          trainerCompType: data.trainerCompType ?? "percent",
          trainerCompValue: data.trainerCompValue ?? 0,
          startAt: data.startAt ?? new Date().toISOString(),
          durationMinutes: data.durationMinutes ?? 0,
        }
        set({ courses: [created, ...get().courses] })
        return created
      },
      courseUpdate: (id, patch) => {
        set({ courses: upsertById(get().courses, id, patch) })
      },
      courseRemove: (id) => {
        const removedEnrollmentIds = new Set(
          get().enrollments.filter((e) => e.courseId === id).map((e) => e.id)
        )
        set({
          courses: removeById(get().courses, id),
          enrollments: get().enrollments.filter((e) => e.courseId !== id),
          payouts: get().payouts.filter((p) => p.courseId !== id),
          payments: get().payments.filter((p) => !removedEnrollmentIds.has(p.enrollmentId)),
        })
      },

      trainerCreate: (data) => {
        const created: Trainer = {
          id: genId("trainer"),
          createdAt: new Date().toISOString(),
          ...data,
        }
        set({ trainers: [created, ...get().trainers] })
        return created
      },
      trainerUpdate: (id, patch) => {
        set({ trainers: upsertById(get().trainers, id, patch) })
      },
      trainerRemove: (id) => {
        set({
          trainers: removeById(get().trainers, id),
          courses: get().courses.map((c) =>
            c.trainerId === id ? { ...c, trainerId: null } : c
          ),
          payouts: get().payouts.filter((p) => p.trainerId !== id),
        })
      },

      studentCreate: (data) => {
        const created: Student = {
          id: genId("student"),
          createdAt: new Date().toISOString(),
          ...data,
        }
        set({ students: [created, ...get().students] })
        return created
      },
      studentUpdate: (id, patch) => {
        set({ students: upsertById(get().students, id, patch) })
      },
      studentRemove: (id) => {
        const removedEnrollmentIds = new Set(
          get().enrollments.filter((e) => e.studentId === id).map((e) => e.id)
        )
        set({
          students: removeById(get().students, id),
          enrollments: get().enrollments.filter((e) => e.studentId !== id),
          payments: get().payments.filter((p) => !removedEnrollmentIds.has(p.enrollmentId)),
        })
      },

      enrollmentCreate: (data) => {
        const created: Enrollment = {
          id: genId("enr"),
          enrolledAt: new Date().toISOString(),
          ...data,
          amountPaid: data.amountPaid ?? 0,
        }
        set({ enrollments: [created, ...get().enrollments] })
        return created
      },
      enrollmentUpdate: (id, patch) => {
        set({ enrollments: upsertById(get().enrollments, id, patch) })
      },
      enrollmentRemove: (id) => {
        set({
          enrollments: removeById(get().enrollments, id),
          payments: get().payments.filter((p) => p.enrollmentId !== id),
        })
      },

      payoutCreate: (data) => {
        const created: TrainerPayout = {
          id: genId("pay"),
          ...data,
          paidAt: data.paidAt || new Date().toISOString(),
        }
        set({ payouts: [created, ...get().payouts] })
        return created
      },
      payoutRemove: (id) => {
        set({ payouts: removeById(get().payouts, id) })
      },

      paymentCreate: (data) => {
        const created: EnrollmentPayment = {
          id: genId("rcpt"),
          receiptNo: data.receiptNo || genReceiptNo(),
          ...data,
          paidAt: data.paidAt || new Date().toISOString(),
          note: data.note || "",
        }

        const enrollment = get().enrollments.find((e) => e.id === created.enrollmentId)
        const nextEnrollments = enrollment
          ? get().enrollments.map((e) =>
              e.id === created.enrollmentId
                ? { ...e, amountPaid: (Number(e.amountPaid) || 0) + (Number(created.amount) || 0) }
                : e
            )
          : get().enrollments

        set({
          payments: [created, ...get().payments],
          enrollments: nextEnrollments,
        })
        return created
      },
      paymentUpdate: (id, patch) => {
        const current = get().payments.find((p) => p.id === id)
        if (!current) return
        const next = { ...current, ...patch }
        const prevAmount = Number(current.amount) || 0
        const nextAmount = Number(next.amount) || 0
        const diff = nextAmount - prevAmount

        set({
          payments: upsertById(get().payments, id, patch),
          enrollments:
            diff === 0
              ? get().enrollments
              : get().enrollments.map((e) =>
                  e.id === current.enrollmentId
                    ? { ...e, amountPaid: (Number(e.amountPaid) || 0) + diff }
                    : e
                ),
        })
      },
      paymentRemove: (id) => {
        const current = get().payments.find((p) => p.id === id)
        if (!current) {
          set({ payments: removeById(get().payments, id) })
          return
        }
        const amount = Number(current.amount) || 0
        set({
          payments: removeById(get().payments, id),
          enrollments: get().enrollments.map((e) =>
            e.id === current.enrollmentId
              ? { ...e, amountPaid: Math.max((Number(e.amountPaid) || 0) - amount, 0) }
              : e
          ),
        })
      },
    }),
    {
      name: STORAGE_KEYS.appState,
      version: 4,
      migrate: (persistedState) => {
        const s = persistedState as Partial<AppState>
        const institutes = Array.isArray(s.institutes) ? s.institutes : []
        const trainers = Array.isArray(s.trainers) ? s.trainers : []
        const students = Array.isArray(s.students) ? s.students : []

        const courses = Array.isArray(s.courses)
          ? s.courses.map((c) => ({
              ...c,
              trainerId: (c as Course).trainerId ?? null,
              trainerCompType: (c as Course).trainerCompType ?? "percent",
              trainerCompValue: (c as Course).trainerCompValue ?? 0,
              startAt: (c as Course).startAt ?? (c as Course).createdAt ?? new Date().toISOString(),
              durationMinutes: (c as Course).durationMinutes ?? 0,
            }))
          : []

        const enrollments = Array.isArray(s.enrollments)
          ? s.enrollments.map((e) => ({
              ...e,
              amountPaid: (e as Enrollment).amountPaid ?? 0,
            }))
          : []

        const payouts = Array.isArray((s as Partial<AppState>).payouts)
          ? (s as Partial<AppState>).payouts!
          : []

        const payments = Array.isArray((s as Partial<AppState>).payments)
          ? (s as Partial<AppState>).payments!
          : []

        const migratedPayments =
          payments.length > 0
            ? payments
            : enrollments
                .filter((e) => (Number((e as Enrollment).amountPaid) || 0) > 0)
                .map((e) => ({
                  id: genId("rcpt"),
                  enrollmentId: e.id,
                  amount: Number((e as Enrollment).amountPaid) || 0,
                  method: "cash",
                  paidAt: e.enrolledAt,
                  receiptNo: genReceiptNo(),
                  note: "ترحيل تلقائي",
                }))

        return {
          institutes,
          courses,
          trainers,
          students,
          enrollments,
          payouts,
          payments: migratedPayments,
        }
      },
      partialize: (state) => ({
        institutes: state.institutes,
        courses: state.courses,
        trainers: state.trainers,
        students: state.students,
        enrollments: state.enrollments,
        payouts: state.payouts,
        payments: state.payments,
      }),
    }
  )
)
