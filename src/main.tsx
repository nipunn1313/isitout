import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import {
  Authenticated,
  ConvexReactClient,
  Unauthenticated,
} from "convex/react";

import { ConvexAuthProvider, useAuthActions } from "@convex-dev/auth/react";

const address = import.meta.env.VITE_CONVEX_URL;
const convex = new ConvexReactClient(address);

function LoginButton() {
  const { signIn } = useAuthActions();
  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <button className="LoginButton" onClick={() => signIn("google")}>
        Log in
      </button>
    </div>
  );
}

const container = document.getElementById("root")!;
const root = createRoot(container);
root.render(
  <StrictMode>
    <ConvexAuthProvider client={convex}>
      <Authenticated>
        <App />
      </Authenticated>
      <Unauthenticated>
        <LoginButton />
      </Unauthenticated>
    </ConvexAuthProvider>
  </StrictMode>
);
