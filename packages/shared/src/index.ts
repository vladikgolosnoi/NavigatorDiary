export type Id = string

export interface ApiResponse<T> {
  data: T
  meta?: Record<string, unknown>
}
