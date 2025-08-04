"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import type { TestCase, TestAssertion } from "@/lib/storage"
import { Plus, Trash2, Play, CheckCircle, XCircle, Clock } from "lucide-react"

interface TestEditorProps {
  tests: TestCase[]
  onUpdateTests: (tests: TestCase[]) => void
  onRunTests?: () => void
  testResults?: any[]
  loading?: boolean
}

export default function TestEditor({
  tests,
  onUpdateTests,
  onRunTests,
  testResults = [],
  loading = false,
}: TestEditorProps) {
  const [expandedTest, setExpandedTest] = useState<string | null>(null)

  const addTest = () => {
    const newTest: TestCase = {
      id: crypto.randomUUID(),
      name: `Test ${tests.length + 1}`,
      description: "",
      assertions: [],
      enabled: true,
    }
    onUpdateTests([...tests, newTest])
    setExpandedTest(newTest.id)
  }

  const updateTest = (testId: string, updates: Partial<TestCase>) => {
    onUpdateTests(tests.map((test) => (test.id === testId ? { ...test, ...updates } : test)))
  }

  const deleteTest = (testId: string) => {
    onUpdateTests(tests.filter((test) => test.id !== testId))
    if (expandedTest === testId) {
      setExpandedTest(null)
    }
  }

  const addAssertion = (testId: string) => {
    const newAssertion: TestAssertion = {
      id: crypto.randomUUID(),
      type: "status",
      operator: "equals",
      expectedValue: 200,
    }

    updateTest(testId, {
      assertions: [...(tests.find((t) => t.id === testId)?.assertions || []), newAssertion],
    })
  }

  const updateAssertion = (testId: string, assertionId: string, updates: Partial<TestAssertion>) => {
    const test = tests.find((t) => t.id === testId)
    if (!test) return

    const updatedAssertions = test.assertions.map((assertion) =>
      assertion.id === assertionId ? { ...assertion, ...updates } : assertion,
    )

    updateTest(testId, { assertions: updatedAssertions })
  }

  const deleteAssertion = (testId: string, assertionId: string) => {
    const test = tests.find((t) => t.id === testId)
    if (!test) return

    updateTest(testId, {
      assertions: test.assertions.filter((a) => a.id !== assertionId),
    })
  }

  const getTestResult = (testId: string) => {
    return testResults.find((result) => result.testCaseId === testId)
  }

  const getAssertionResult = (testId: string, assertionId: string) => {
    const testResult = getTestResult(testId)
    return testResult?.assertions.find((a: any) => a.id === assertionId)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Tests</h3>
          <Badge variant="outline">{tests.length} tests</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={addTest}>
            <Plus className="h-4 w-4 mr-2" />
            Add Test
          </Button>
          {tests.length > 0 && (
            <Button size="sm" onClick={onRunTests} disabled={loading}>
              <Play className="h-4 w-4 mr-2" />
              {loading ? "Running..." : "Run Tests"}
            </Button>
          )}
        </div>
      </div>

      {tests.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No tests created yet.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Add tests to automatically validate your API responses.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tests.map((test) => {
            const testResult = getTestResult(test.id)
            const isExpanded = expandedTest === test.id

            return (
              <Card key={test.id} className="overflow-hidden">
                <CardHeader
                  className="cursor-pointer hover:bg-muted/50 pb-3"
                  onClick={() => setExpandedTest(isExpanded ? null : test.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={test.enabled}
                        onCheckedChange={(checked) => updateTest(test.id, { enabled: !!checked })}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div>
                        <CardTitle className="text-base">{test.name}</CardTitle>
                        {test.description && <p className="text-sm text-muted-foreground mt-1">{test.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {testResult && (
                        <div className="flex items-center gap-2">
                          {testResult.passed ? (
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Passed
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              Failed
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {testResult.executionTime}ms
                          </Badge>
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteTest(test.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`test-name-${test.id}`}>Test Name</Label>
                        <Input
                          id={`test-name-${test.id}`}
                          value={test.name}
                          onChange={(e) => updateTest(test.id, { name: e.target.value })}
                          placeholder="Enter test name"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`test-desc-${test.id}`}>Description</Label>
                        <Input
                          id={`test-desc-${test.id}`}
                          value={test.description}
                          onChange={(e) => updateTest(test.id, { description: e.target.value })}
                          placeholder="Enter test description"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Assertions</Label>
                        <Button variant="outline" size="sm" onClick={() => addAssertion(test.id)}>
                          <Plus className="h-4 w-4 mr-1" />
                          Add Assertion
                        </Button>
                      </div>

                      {test.assertions.map((assertion) => {
                        const assertionResult = getAssertionResult(test.id, assertion.id)

                        return (
                          <Card key={assertion.id} className="p-4">
                            <div className="grid grid-cols-12 gap-2 items-end">
                              <div className="col-span-2">
                                <Label className="text-xs">Type</Label>
                                <Select
                                  value={assertion.type}
                                  onValueChange={(value: any) =>
                                    updateAssertion(test.id, assertion.id, { type: value })
                                  }
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="status">Status</SelectItem>
                                    <SelectItem value="header">Header</SelectItem>
                                    <SelectItem value="body">Body</SelectItem>
                                    <SelectItem value="responseTime">Response Time</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {(assertion.type === "header" || assertion.type === "body") && (
                                <div className="col-span-2">
                                  <Label className="text-xs">Field</Label>
                                  <Input
                                    className="h-8"
                                    value={assertion.field || ""}
                                    onChange={(e) => updateAssertion(test.id, assertion.id, { field: e.target.value })}
                                    placeholder={assertion.type === "header" ? "Header name" : "JSON path"}
                                  />
                                </div>
                              )}

                              <div
                                className={
                                  assertion.type === "header" || assertion.type === "body" ? "col-span-2" : "col-span-4"
                                }
                              >
                                <Label className="text-xs">Operator</Label>
                                <Select
                                  value={assertion.operator}
                                  onValueChange={(value: any) =>
                                    updateAssertion(test.id, assertion.id, { operator: value })
                                  }
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="equals">Equals</SelectItem>
                                    <SelectItem value="contains">Contains</SelectItem>
                                    <SelectItem value="greaterThan">Greater Than</SelectItem>
                                    <SelectItem value="lessThan">Less Than</SelectItem>
                                    <SelectItem value="exists">Exists</SelectItem>
                                    <SelectItem value="notExists">Not Exists</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div
                                className={
                                  assertion.type === "header" || assertion.type === "body" ? "col-span-3" : "col-span-3"
                                }
                              >
                                <Label className="text-xs">Expected Value</Label>
                                <Input
                                  className="h-8"
                                  value={assertion.expectedValue}
                                  onChange={(e) =>
                                    updateAssertion(test.id, assertion.id, {
                                      expectedValue:
                                        assertion.type === "responseTime" || assertion.type === "status"
                                          ? Number(e.target.value) || 0
                                          : e.target.value,
                                    })
                                  }
                                  placeholder="Expected value"
                                  type={
                                    assertion.type === "responseTime" || assertion.type === "status" ? "number" : "text"
                                  }
                                />
                              </div>

                              <div className="col-span-2">
                                {assertionResult && (
                                  <div className="flex items-center gap-2">
                                    {assertionResult.passed ? (
                                      <Badge variant="default" className="bg-green-500 text-xs">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Pass
                                      </Badge>
                                    ) : (
                                      <Badge variant="destructive" className="text-xs">
                                        <XCircle className="h-3 w-3 mr-1" />
                                        Fail
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="col-span-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => deleteAssertion(test.id, assertion.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {assertionResult && !assertionResult.passed && (
                              <div className="mt-2 p-2 bg-destructive/10 rounded text-sm">
                                <p className="text-destructive">
                                  Expected: {assertion.expectedValue}, Got: {assertionResult.actualValue ?? "undefined"}
                                </p>
                              </div>
                            )}
                          </Card>
                        )
                      })}

                      {test.assertions.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No assertions added yet. Click "Add Assertion" to start testing.
                        </p>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
