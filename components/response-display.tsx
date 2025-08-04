"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ResponseData } from "@/lib/storage"
import { Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface ResponseDisplayProps {
  response: ResponseData | null
  loading: boolean
  testResults?: any[]
}

export default function ResponseDisplay({ response, loading, testResults }: ResponseDisplayProps) {
  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            Sending request...
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  if (!response) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-muted-foreground">Response</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Send a request to see the response here.</p>
        </CardContent>
      </Card>
    )
  }

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "bg-green-500"
    if (status >= 300 && status < 400) return "bg-yellow-500"
    if (status >= 400 && status < 500) return "bg-orange-500"
    return "bg-red-500"
  }

  const getStatusIcon = (status: number) => {
    if (status >= 200 && status < 300) return <CheckCircle className="h-4 w-4" />
    if (status >= 300 && status < 400) return <AlertCircle className="h-4 w-4" />
    return <XCircle className="h-4 w-4" />
  }

  const formatJson = (data: any) => {
    try {
      return JSON.stringify(data, null, 2)
    } catch {
      return String(data)
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Response</span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`${getStatusColor(response.status)} text-white`}>
              {getStatusIcon(response.status)}
              {response.status} {response.statusText}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {response.responseTime}ms
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="body" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b">
            <TabsTrigger value="body">Body</TabsTrigger>
            <TabsTrigger value="headers">Headers</TabsTrigger>
            <TabsTrigger value="tests">Test Results</TabsTrigger>
          </TabsList>
          <TabsContent value="body" className="p-4">
            <pre className="bg-muted p-4 rounded-md overflow-auto text-sm max-h-96">
              <code>{formatJson(response.data)}</code>
            </pre>
          </TabsContent>
          <TabsContent value="headers" className="p-4">
            <div className="space-y-2">
              {Object.entries(response.headers).map(([key, value]) => (
                <div key={key} className="flex gap-2 text-sm">
                  <span className="font-medium text-muted-foreground min-w-0 flex-shrink-0">{key}:</span>
                  <span className="break-all">{value}</span>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="tests" className="p-4">
            {testResults && testResults.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">Test Results</h4>
                  <Badge variant={testResults.every((r) => r.passed) ? "default" : "destructive"}>
                    {testResults.filter((r) => r.passed).length}/{testResults.length} passed
                  </Badge>
                </div>

                {testResults.map((result) => (
                  <Card key={result.testCaseId} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {result.passed ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="font-medium">Test Case</span>
                      </div>
                      <Badge variant="outline">{result.executionTime}ms</Badge>
                    </div>

                    {result.error && (
                      <div className="mb-2 p-2 bg-destructive/10 rounded text-sm text-destructive">{result.error}</div>
                    )}

                    <div className="space-y-1">
                      {result.assertions.map((assertion: any, index: number) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span>
                            {assertion.type} {assertion.operator} {assertion.expectedValue}
                          </span>
                          <div className="flex items-center gap-2">
                            {assertion.passed ? (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            ) : (
                              <XCircle className="h-3 w-3 text-red-500" />
                            )}
                            <span className="text-muted-foreground">Got: {assertion.actualValue ?? "undefined"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">
                No test results available. Add tests and send a request to see results.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
