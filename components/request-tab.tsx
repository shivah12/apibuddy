"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import type { RequestData, ResponseData, TestCase } from "@/lib/storage"
import { Send, Plus, Trash2 } from "lucide-react"
import TestEditor from "./test-editor"

interface RequestTabProps {
  request: RequestData & { tests?: TestCase[] }
  onUpdate: (request: RequestData & { tests?: TestCase[] }) => void
  onSend: (request: RequestData & { tests?: TestCase[] }) => Promise<ResponseData>
  onRunTests?: () => void
  testResults?: any[]
  loading: boolean
}

export default function RequestTab({ request, onUpdate, onSend, onRunTests, testResults, loading }: RequestTabProps) {
  const [headers, setHeaders] = useState<Array<{ key: string; value: string }>>(() => {
    return Object.entries(request.headers).map(([key, value]) => ({ key, value }))
  })

  const updateRequest = (updates: Partial<RequestData & { tests?: TestCase[] }>) => {
    onUpdate({ ...request, ...updates })
  }

  const updateHeaders = (newHeaders: Array<{ key: string; value: string }>) => {
    setHeaders(newHeaders)
    const headersObj = newHeaders.reduce(
      (acc, { key, value }) => {
        if (key.trim() && value.trim()) {
          acc[key.trim()] = value.trim()
        }
        return acc
      },
      {} as Record<string, string>,
    )
    updateRequest({ headers: headersObj })
  }

  const addHeader = () => {
    updateHeaders([...headers, { key: "", value: "" }])
  }

  const removeHeader = (index: number) => {
    updateHeaders(headers.filter((_, i) => i !== index))
  }

  const updateHeader = (index: number, field: "key" | "value", value: string) => {
    const newHeaders = [...headers]
    newHeaders[index][field] = value
    updateHeaders(newHeaders)
  }

  const handleSend = async () => {
    if (!request.url.trim()) return
    await onSend(request)
  }

  const isValidJson = (str: string) => {
    if (!str.trim()) return true
    try {
      JSON.parse(str)
      return true
    } catch {
      return false
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Request</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Select value={request.method} onValueChange={(value) => updateRequest({ method: value })}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GET">GET</SelectItem>
              <SelectItem value="POST">POST</SelectItem>
              <SelectItem value="PUT">PUT</SelectItem>
              <SelectItem value="PATCH">PATCH</SelectItem>
              <SelectItem value="DELETE">DELETE</SelectItem>
              <SelectItem value="HEAD">HEAD</SelectItem>
              <SelectItem value="OPTIONS">OPTIONS</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Enter request URL"
            value={request.url}
            onChange={(e) => updateRequest({ url: e.target.value })}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={loading || !request.url.trim()}>
            <Send className="h-4 w-4 mr-2" />
            Send
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bearer-token">Bearer Token</Label>
          <Input
            id="bearer-token"
            type="password"
            placeholder="Enter bearer token (optional)"
            value={request.bearerToken}
            onChange={(e) => updateRequest({ bearerToken: e.target.value })}
          />
        </div>

        <Tabs defaultValue="headers" className="w-full">
          <TabsList>
            <TabsTrigger value="headers">Headers</TabsTrigger>
            <TabsTrigger value="body">Body</TabsTrigger>
            <TabsTrigger value="tests">Tests</TabsTrigger>
          </TabsList>

          <TabsContent value="headers" className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Headers</Label>
              <Button variant="outline" size="sm" onClick={addHeader}>
                <Plus className="h-4 w-4 mr-1" />
                Add Header
              </Button>
            </div>
            <div className="space-y-2 max-h-48 overflow-auto">
              {headers.map((header, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    placeholder="Header name"
                    value={header.key}
                    onChange={(e) => updateHeader(index, "key", e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Header value"
                    value={header.value}
                    onChange={(e) => updateHeader(index, "value", e.target.value)}
                    className="flex-1"
                  />
                  <Button variant="ghost" size="sm" onClick={() => removeHeader(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="body" className="space-y-2">
            <Label htmlFor="request-body">Request Body</Label>
            <Textarea
              id="request-body"
              placeholder="Enter request body (JSON, XML, etc.)"
              value={request.body}
              onChange={(e) => updateRequest({ body: e.target.value })}
              className="min-h-32 font-mono text-sm"
            />
            {request.body && !isValidJson(request.body) && (
              <p className="text-sm text-destructive">Invalid JSON format</p>
            )}
          </TabsContent>

          <TabsContent value="tests" className="space-y-2">
            <TestEditor
              tests={request.tests || []}
              onUpdateTests={(tests) => updateRequest({ tests })}
              onRunTests={onRunTests}
              testResults={testResults}
              loading={loading}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
