import { httpRouter } from "convex/server";
import { auth } from "./auth";

const http = httpRouter();

// Use Convex Auth's routes
auth.addHttpRoutes(http);

export default http;