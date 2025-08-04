// Example test cases for common API testing scenarios

const commonTestCases = {
  // Status code tests
  statusTests: [
    {
      name: "Success Response",
      assertions: [{ type: "status", operator: "equals", expectedValue: 200 }],
    },
    {
      name: "Created Response",
      assertions: [{ type: "status", operator: "equals", expectedValue: 201 }],
    },
    {
      name: "Not Found",
      assertions: [{ type: "status", operator: "equals", expectedValue: 404 }],
    },
  ],

  // Response time tests
  performanceTests: [
    {
      name: "Fast Response",
      assertions: [{ type: "responseTime", operator: "lessThan", expectedValue: 1000 }],
    },
    {
      name: "Very Fast Response",
      assertions: [{ type: "responseTime", operator: "lessThan", expectedValue: 500 }],
    },
  ],

  // Header tests
  headerTests: [
    {
      name: "Content Type JSON",
      assertions: [{ type: "header", field: "content-type", operator: "contains", expectedValue: "application/json" }],
    },
    {
      name: "CORS Headers",
      assertions: [{ type: "header", field: "access-control-allow-origin", operator: "exists", expectedValue: "" }],
    },
  ],

  // Body content tests
  bodyTests: [
    {
      name: "Response Has Data",
      assertions: [{ type: "body", field: "data", operator: "exists", expectedValue: "" }],
    },
    {
      name: "User ID Present",
      assertions: [{ type: "body", field: "user.id", operator: "exists", expectedValue: "" }],
    },
    {
      name: "Success Message",
      assertions: [{ type: "body", field: "message", operator: "equals", expectedValue: "success" }],
    },
  ],
}

console.log("Common test case templates:", commonTestCases)
