import { create } from 'zustand'
import { approvalService } from '@/services/approvalService'

interface ApprovalStore {
  pendingCount: number
  isLoading: boolean
  fetchPendingCount: (userId: string, role: string) => Promise<void>
  setPendingCount: (count: number) => void
  decrementCount: (amount?: number) => void
}

export const useApprovalStore = create<ApprovalStore>((set) => ({
  pendingCount: 0,
  isLoading: false,
  fetchPendingCount: async (userId: string, role: string) => {
    set({ isLoading: true })
    try {
      const count = await approvalService.getPendingCount(userId, role)
      set({ pendingCount: count })
    } catch (error) {
      console.error('Failed to fetch pending count:', error)
    } finally {
      set({ isLoading: false })
    }
  },
  setPendingCount: (count) => set({ pendingCount: count }),
  decrementCount: (amount = 1) =>
    set((state) => ({
      pendingCount: Math.max(0, state.pendingCount - amount),
    })),
}))
