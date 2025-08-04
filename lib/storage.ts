export interface RequestData {
  id: string
  method: string
  url: string
  headers: Record<string, string>
  body: string
  bearerToken: string
}

export interface ResponseData {
  status: number
  statusText: string
  data: any
  headers: Record<string, string>
  responseTime: number
}

export interface HistoryItem extends RequestData {
  response?: ResponseData
  timestamp: number
}

export interface TestCase {
  id: string
  name: string
  description: string
  assertions: TestAssertion[]
  enabled: boolean
}

export interface TestAssertion {
  id: string
  type: "status" | "header" | "body" | "responseTime"
  field?: string
  operator: "equals" | "contains" | "greaterThan" | "lessThan" | "exists" | "notExists"
  expectedValue: string | number
  actualValue?: string | number
  passed?: boolean
}

export interface TestResult {
  testCaseId: string
  passed: boolean
  assertions: TestAssertion[]
  executionTime: number
  error?: string
}

export interface RequestDataWithTests extends RequestData {
  tests: TestCase[]
}

export const saveToHistory = (request: RequestData, response?: ResponseData) => {
  const history = getHistory()
  const historyItem: HistoryItem = {
    ...request,
    response,
    timestamp: Date.now(),
  }

  const updatedHistory = [historyItem, ...history.slice(0, 49)] // Keep last 50 items
  localStorage.setItem("api-buddy-history", JSON.stringify(updatedHistory))
}

export const getHistory = (): HistoryItem[] => {
  if (typeof window === "undefined") return []

  try {
    const history = localStorage.getItem("api-buddy-history")
    return history ? JSON.parse(history) : []
  } catch {
    return []
  }
}

export const clearHistory = () => {
  localStorage.removeItem("api-buddy-history")
}

export const saveTabs = (tabs: RequestData[]) => {
  localStorage.setItem("api-buddy-tabs", JSON.stringify(tabs))
}

export const getTabs = (): RequestData[] => {
  if (typeof window === "undefined") return []

  try {
    const tabs = localStorage.getItem("api-buddy-tabs")
    return tabs ? JSON.parse(tabs) : []
  } catch {
    return []
  }
}

export const saveTestResults = (requestId: string, results: TestResult[]) => {
  const key = `api-buddy-test-results-${requestId}`
  localStorage.setItem(key, JSON.stringify(results))
}

export const getTestResults = (requestId: string): TestResult[] => {
  if (typeof window === "undefined") return []

  try {
    const key = `api-buddy-test-results-${requestId}`
    const results = localStorage.getItem(key)
    return results ? JSON.parse(results) : []
  } catch {
    return []
  }
}
