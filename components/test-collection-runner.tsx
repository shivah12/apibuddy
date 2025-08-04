"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { RequestDataWithTests, ResponseData } from "@/lib/storage"
import { TestRunner } from "@/lib/test-runner"
import { Play, Square, CheckCircle, XCircle, Clock, Zap } from "lucide-react"

interface CollectionRunnerProps {
  requests: RequestDataWithTests[]
  onSendRequest: (request: RequestDataWithTests) => Promise<ResponseData>
}

interface CollectionResult {
  requestId: string
  requestName: string
  response?: ResponseData
  testResults?: any[]
  error?: string
  status: "pending" | "running" | "completed" | "failed"
}

export default function TestCollectionRunner({ requests, onSendRequest }: CollectionRunnerProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<CollectionResult[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  const requestsWithTests = requests.filter((req) => req.tests && req.tests.length > 0)

  const runCollection = async () => {
    if (requestsWithTests.length === 0) return

    setIsRunning(true)
    setCurrentIndex(0)

    const initialResults: CollectionResult[] = requestsWithTests.map((req) => ({
      requestId: req.id,
      requestName: req.url || `${req.method} Request`,
      status: "pending",
    }))

    setResults(initialResults)

    for (let i = 0; i < requestsWithTests.length; i++) {
      if (!isRunning) break // Allow stopping mid-execution

      setCurrentIndex(i)
      const request = requestsWithTests[i]

      // Update status to running
      setResults((prev) => prev.map((result, index) => (index === i ? { ...result, status: "running" } : result)))

      try {
        const response = await onSendRequest(request)

        // Run tests if available
        let testResults
        if (request.tests && request.tests.length > 0) {
          testResults = TestRunner.runTests(request.tests, response)
        }

        // Update with results
        setResults((prev) =>
          prev.map((result, index) =>
            index === i
              ? {
                  ...result,
                  response,
                  testResults,
                  status: "completed",
                }
              : result,
          ),
        )

        // Small delay between requests
        await new Promise((resolve) => setTimeout(resolve, 500))
      } catch (error: any) {
        setResults((prev) =>
          prev.map((result, index) =>
            index === i
              ? {
                  ...result,
                  error: error.message,
                  status: "failed",
                }
              : result,
          ),
        )
      }
    }

    setIsRunning(false)
  }

  const stopCollection = () => {
    setIsRunning(false)
  }

  const getTotalStats = () => {
    const completed = results.filter((r) => r.status === "completed")
    const failed = results.filter((r) => r.status === "failed")
    const totalTests = results.reduce((acc, r) => acc + (r.testResults?.length || 0), 0)
    const passedTests = results.reduce((acc, r) => acc + (r.testResults?.filter((t: any) => t.passed).length || 0), 0)

    return { completed: completed.length, failed: failed.length, totalTests, passedTests }
  }

  const stats = getTotalStats()
  const progress = requestsWithTests.length > 0 ? (currentIndex / requestsWithTests.length) * 100 : 0

  if (requestsWithTests.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No requests with tests found.</p>
          <p className="text-sm text-muted-foreground mt-2">Add tests to your requests to run them as a collection.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Collection Runner
            </CardTitle>
            <div className="flex gap-2">
              {!isRunning ? (
                <Button onClick={runCollection}>
                  <Play className="h-4 w-4 mr-2" />
                  Run Collection
                </Button>
              ) : (
                <Button variant="destructive" onClick={stopCollection}>
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Progress</span>
                <span>
                  {currentIndex}/{requestsWithTests.length}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>

          <div className="flex gap-4">
            <Badge variant="outline" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              {stats.completed} Completed
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <XCircle className="h-3 w-3 text-red-500" />
              {stats.failed} Failed
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              Tests: {stats.passedTests}/{stats.totalTests}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {results.map((result, index) => (
                  <Card key={result.requestId} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {result.status === "pending" && <div className="h-4 w-4 rounded-full bg-gray-300" />}
                          {result.status === "running" && (
                            <div className="h-4 w-4 rounded-full bg-blue-500 animate-pulse" />
                          )}
                          {result.status === "completed" && <CheckCircle className="h-4 w-4 text-green-500" />}
                          {result.status === "failed" && <XCircle className="h-4 w-4 text-red-500" />}
                        </div>
                        <div>
                          <p className="font-medium">{result.requestName}</p>
                          {result.error && <p className="text-sm text-destructive">{result.error}</p>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {result.response && (
                          <Badge variant={result.response.status >= 400 ? "destructive" : "default"}>
                            {result.response.status}
                          </Badge>
                        )}
                        {result.testResults && (
                          <Badge variant="outline">
                            Tests: {result.testResults.filter((t: any) => t.passed).length}/{result.testResults.length}
                          </Badge>
                        )}
                        {result.response && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {result.response.responseTime}ms
                          </Badge>
                        )}
                      </div>
                    </div>

                    {result.testResults && result.testResults.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {result.testResults.map((testResult: any, testIndex: number) => (
                          <div key={testIndex} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Test {testIndex + 1}</span>
                            <div className="flex items-center gap-2">
                              {testResult.passed ? (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              ) : (
                                <XCircle className="h-3 w-3 text-red-500" />
                              )}
                              <span className="text-xs">
                                {testResult.assertions.filter((a: any) => a.passed).length}/
                                {testResult.assertions.length} assertions
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
