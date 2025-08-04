"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  type RequestData,
  type ResponseData,
  type HistoryItem,
  saveToHistory,
  getHistory,
  clearHistory,
  saveTabs,
  getTabs,
  saveTestResults,
  type RequestDataWithTests,
} from "@/lib/storage"
import { supabase } from "@/lib/supabase"
import RequestTab from "./request-tab"
import ResponseDisplay from "./response-display"
import AuthDialog from "./auth-dialog"
import { Plus, X, History, Trash2, Clock, Zap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { TestRunner } from "@/lib/test-runner"
import TestCollectionRunner from "./test-collection-runner"

export default function ApiTester() {
  const [tabs, setTabs] = useState<RequestDataWithTests[]>([])
  const [activeTab, setActiveTab] = useState(0)
  const [response, setResponse] = useState<ResponseData | null>(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [user, setUser] = useState<any>(null)
  const { toast } = useToast()
  const [testResults, setTestResults] = useState<any[]>([])
  const [showCollectionRunner, setShowCollectionRunner] = useState(false)

  useEffect(() => {
    // Load tabs from localStorage
    const savedTabs = getTabs()
    if (savedTabs.length > 0) {
      setTabs(savedTabs)
    } else {
      // Create initial tab
      const initialTab: RequestDataWithTests = {
        id: crypto.randomUUID(),
        method: "GET",
        url: "",
        headers: {},
        body: "",
        bearerToken: "",
        tests: [],
      }
      setTabs([initialTab])
    }

    // Load history
    setHistory(getHistory())

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    // Save tabs to localStorage whenever tabs change
    if (tabs.length > 0) {
      saveTabs(tabs)
    }
  }, [tabs])

  const createNewTab = () => {
    const newTab: RequestDataWithTests = {
      id: crypto.randomUUID(),
      method: "GET",
      url: "",
      headers: {},
      body: "",
      bearerToken: "",
      tests: [],
    }
    setTabs([...tabs, newTab])
    setActiveTab(tabs.length)
    setResponse(null)
    setTestResults([])
  }

  const closeTab = (index: number) => {
    if (tabs.length === 1) return // Don't close the last tab

    const newTabs = tabs.filter((_, i) => i !== index)
    setTabs(newTabs)

    if (activeTab >= newTabs.length) {
      setActiveTab(newTabs.length - 1)
    } else if (activeTab > index) {
      setActiveTab(activeTab - 1)
    }

    if (activeTab === index) {
      setResponse(null)
    }
  }

  const updateTab = (index: number, request: RequestDataWithTests) => {
    const newTabs = [...tabs]
    newTabs[index] = request
    setTabs(newTabs)
  }

  const sendRequest = async (request: RequestDataWithTests): Promise<ResponseData> => {
    setLoading(true)
    const startTime = Date.now()

    try {
      const headers: Record<string, string> = { ...request.headers }

      if (request.bearerToken) {
        headers["Authorization"] = `Bearer ${request.bearerToken}`
      }

      if (request.body && ["POST", "PUT", "PATCH"].includes(request.method)) {
        headers["Content-Type"] = headers["Content-Type"] || "application/json"
      }

      const fetchOptions: RequestInit = {
        method: request.method,
        headers,
      }

      if (request.body && ["POST", "PUT", "PATCH"].includes(request.method)) {
        fetchOptions.body = request.body
      }

      const response = await fetch(request.url, fetchOptions)
      const responseTime = Date.now() - startTime

      let data
      const contentType = response.headers.get("content-type")

      if (contentType?.includes("application/json")) {
        data = await response.json()
      } else {
        data = await response.text()
      }

      const responseHeaders: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      const responseData: ResponseData = {
        status: response.status,
        statusText: response.statusText,
        data,
        headers: responseHeaders,
        responseTime,
      }

      setResponse(responseData)

      // Run tests if they exist
      if (request.tests && request.tests.length > 0) {
        const results = TestRunner.runTests(request.tests, responseData)
        setTestResults(results)
        saveTestResults(request.id, results)

        // Show test results in toast
        const passedTests = results.filter((r) => r.passed).length
        const totalTests = results.length

        if (passedTests === totalTests) {
          toast({
            title: "All tests passed! ✅",
            description: `${passedTests}/${totalTests} tests passed`,
          })
        } else {
          toast({
            title: "Some tests failed ❌",
            description: `${passedTests}/${totalTests} tests passed`,
            variant: "destructive",
          })
        }
      }

      // Save to history
      saveToHistory(request, responseData)
      setHistory(getHistory())

      // Save to Supabase if user is logged in
      if (user) {
        try {
          await supabase.from("request_history").insert({
            user_id: user.id,
            method: request.method,
            url: request.url,
            headers: request.headers,
            body: request.body || null,
            response: responseData.data,
            status_code: responseData.status,
            response_time: responseData.responseTime,
          })
        } catch (error) {
          console.error("Failed to save to Supabase:", error)
        }
      }

      toast({
        title: "Request sent successfully",
        description: `${response.status} ${response.statusText} • ${responseTime}ms`,
      })

      return responseData
    } catch (error: any) {
      const responseTime = Date.now() - startTime
      const errorResponse: ResponseData = {
        status: 0,
        statusText: "Network Error",
        data: { error: error.message },
        headers: {},
        responseTime,
      }

      setResponse(errorResponse)

      toast({
        title: "Request failed",
        description: error.message,
        variant: "destructive",
      })

      return errorResponse
    } finally {
      setLoading(false)
    }
  }

  const loadFromHistory = (historyItem: HistoryItem) => {
    const newTab: RequestData = {
      id: crypto.randomUUID(),
      method: historyItem.method,
      url: historyItem.url,
      headers: historyItem.headers,
      body: historyItem.body,
      bearerToken: historyItem.bearerToken,
    }

    setTabs([...tabs, newTab])
    setActiveTab(tabs.length)

    if (historyItem.response) {
      setResponse(historyItem.response)
    }
  }

  const handleClearHistory = () => {
    clearHistory()
    setHistory([])
    toast({
      title: "History cleared",
      description: "All request history has been cleared.",
    })
  }

  const runTestsOnly = async () => {
    const currentRequest = tabs[activeTab]
    if (!currentRequest || !response) return

    if (!currentRequest.tests || currentRequest.tests.length === 0) {
      toast({
        title: "No tests to run",
        description: "Add some tests first before running them.",
        variant: "destructive",
      })
      return
    }

    const results = TestRunner.runTests(currentRequest.tests, response)
    setTestResults(results)
    saveTestResults(currentRequest.id, results)

    const passedTests = results.filter((r) => r.passed).length
    const totalTests = results.length

    toast({
      title: passedTests === totalTests ? "All tests passed! ✅" : "Some tests failed ❌",
      description: `${passedTests}/${totalTests} tests passed`,
      variant: passedTests === totalTests ? "default" : "destructive",
    })
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">API Buddy</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowCollectionRunner(!showCollectionRunner)}>
              <Zap className="h-4 w-4 mr-2" />
              Collection Runner
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <History className="h-4 w-4 mr-2" />
                  History ({history.length})
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between">
                    Request History
                    <Button variant="ghost" size="sm" onClick={handleClearHistory}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  </DialogTitle>
                  <DialogDescription>Click on any request to load it in a new tab.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-96">
                  <div className="space-y-2">
                    {history.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No requests in history yet.</p>
                    ) : (
                      history.map((item, index) => (
                        <Card
                          key={index}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => loadFromHistory(item)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{item.method}</Badge>
                                <span className="font-mono text-sm truncate max-w-md">{item.url}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {item.response && (
                                  <Badge variant={item.response.status >= 400 ? "destructive" : "default"}>
                                    {item.response.status}
                                  </Badge>
                                )}
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(item.timestamp).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
            <AuthDialog user={user} onAuthChange={setUser} />
          </div>
        </div>
      </div>

      {showCollectionRunner && (
        <Dialog open={showCollectionRunner} onOpenChange={setShowCollectionRunner}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Test Collection Runner</DialogTitle>
              <DialogDescription>Run all requests with tests in sequence and see aggregated results.</DialogDescription>
            </DialogHeader>
            <TestCollectionRunner requests={tabs} onSendRequest={sendRequest} />
          </DialogContent>
        </Dialog>
      )}

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 overflow-hidden">
        {/* Request Panel */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Tabs value={activeTab.toString()} onValueChange={(value) => setActiveTab(Number.parseInt(value))}>
              <div className="flex items-center gap-2">
                <TabsList className="h-auto p-1">
                  {tabs.map((tab, index) => (
                    <TabsTrigger key={tab.id} value={index.toString()} className="relative group px-3 py-2">
                      <span className="truncate max-w-32">{tab.url || `Request ${index + 1}`}</span>
                      {tabs.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-2 h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation()
                            closeTab(index)
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <Button variant="ghost" size="sm" onClick={createNewTab}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </Tabs>
          </div>

          <div className="flex-1 overflow-auto">
            {tabs[activeTab] && (
              <RequestTab
                request={tabs[activeTab]}
                onUpdate={(request) => updateTab(activeTab, request)}
                onSend={sendRequest}
                onRunTests={runTestsOnly}
                testResults={testResults}
                loading={loading}
              />
            )}
          </div>
        </div>

        {/* Response Panel */}
        <div className="flex flex-col">
          <ResponseDisplay response={response} loading={loading} testResults={testResults} />
        </div>
      </div>
    </div>
  )
}
