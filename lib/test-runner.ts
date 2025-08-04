import type { TestCase, TestAssertion, TestResult, ResponseData } from "./storage"

export class TestRunner {
  static runTests(testCases: TestCase[], response: ResponseData): TestResult[] {
    return testCases.filter((test) => test.enabled).map((testCase) => this.runTestCase(testCase, response))
  }

  private static runTestCase(testCase: TestCase, response: ResponseData): TestResult {
    const startTime = Date.now()
    const assertions: TestAssertion[] = []
    let passed = true

    try {
      for (const assertion of testCase.assertions) {
        const result = this.runAssertion(assertion, response)
        assertions.push(result)
        if (!result.passed) {
          passed = false
        }
      }

      return {
        testCaseId: testCase.id,
        passed,
        assertions,
        executionTime: Date.now() - startTime,
      }
    } catch (error: any) {
      return {
        testCaseId: testCase.id,
        passed: false,
        assertions,
        executionTime: Date.now() - startTime,
        error: error.message,
      }
    }
  }

  private static runAssertion(assertion: TestAssertion, response: ResponseData): TestAssertion {
    let actualValue: string | number | undefined
    let passed = false

    try {
      switch (assertion.type) {
        case "status":
          actualValue = response.status
          passed = this.compareValues(actualValue, assertion.operator, assertion.expectedValue)
          break

        case "header":
          if (!assertion.field) throw new Error("Header field is required")
          actualValue = response.headers[assertion.field.toLowerCase()]
          passed = this.compareValues(actualValue, assertion.operator, assertion.expectedValue)
          break

        case "body":
          if (assertion.field) {
            // Check specific field in JSON response
            actualValue = this.getNestedValue(response.data, assertion.field)
          } else {
            // Check entire body
            actualValue = typeof response.data === "string" ? response.data : JSON.stringify(response.data)
          }
          passed = this.compareValues(actualValue, assertion.operator, assertion.expectedValue)
          break

        case "responseTime":
          actualValue = response.responseTime
          passed = this.compareValues(actualValue, assertion.operator, assertion.expectedValue)
          break

        default:
          throw new Error(`Unknown assertion type: ${assertion.type}`)
      }

      return {
        ...assertion,
        actualValue,
        passed,
      }
    } catch (error: any) {
      return {
        ...assertion,
        actualValue: undefined,
        passed: false,
      }
    }
  }

  private static compareValues(actual: any, operator: string, expected: string | number): boolean {
    switch (operator) {
      case "equals":
        return actual == expected

      case "contains":
        return String(actual).includes(String(expected))

      case "greaterThan":
        return Number(actual) > Number(expected)

      case "lessThan":
        return Number(actual) < Number(expected)

      case "exists":
        return actual !== undefined && actual !== null

      case "notExists":
        return actual === undefined || actual === null

      default:
        return false
    }
  }

  private static getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined
    }, obj)
  }
}
