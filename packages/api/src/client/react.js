"use client";
"use strict";
exports.__esModule = true;
exports.TRPCReactProvider = exports.api = void 0;
var react_query_1 = require("@tanstack/react-query");
var client_1 = require("@trpc/client");
var react_query_2 = require("@trpc/react-query");
var react_1 = require("react");
var superjson_1 = require("superjson");
var query_client_1 = require("./query-client");
var clientQueryClientSingleton = undefined;
var getQueryClient = function () {
    if (typeof window === "undefined") {
        // Server: always make a new query client
        return query_client_1.createQueryClient();
    }
    // Browser: use singleton pattern to keep the same query client
    clientQueryClientSingleton !== null && clientQueryClientSingleton !== void 0 ? clientQueryClientSingleton : (clientQueryClientSingleton = query_client_1.createQueryClient());
    return clientQueryClientSingleton;
};
exports.api = react_query_2.createTRPCReact();
function TRPCReactProvider(props) {
    var queryClient = getQueryClient();
    var trpcClient = react_1.useState(function () {
        return exports.api.createClient({
            links: [
                client_1.loggerLink({
                    enabled: function (op) {
                        return process.env.NODE_ENV === "development" ||
                            (op.direction === "down" && op.result instanceof Error);
                    }
                }),
                client_1.httpBatchStreamLink({
                    transformer: superjson_1["default"],
                    url: getBaseUrl() + "/api/trpc",
                    headers: function () {
                        var headers = new Headers();
                        headers.set("x-trpc-source", "nextjs-react");
                        return headers;
                    }
                }),
            ]
        });
    })[0];
    return (<react_query_1.QueryClientProvider client={queryClient}>
      <exports.api.Provider client={trpcClient} queryClient={queryClient}>
        {props.children}
      </exports.api.Provider>
    </react_query_1.QueryClientProvider>);
}
exports.TRPCReactProvider = TRPCReactProvider;
function getBaseUrl() {
    var _a;
    if (typeof window !== "undefined")
        return window.location.origin;
    if (process.env.VERCEL_URL)
        return "https://" + process.env.VERCEL_URL;
    return "http://localhost:" + ((_a = process.env.PORT) !== null && _a !== void 0 ? _a : 3000);
}
