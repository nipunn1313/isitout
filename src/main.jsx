import { StrictMode } from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import {
  Authenticated,
  ConvexReactClient,
  Unauthenticated,
} from "convex/react";

import { ConvexProviderWithAuth0 } from "convex/react-auth0";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";

import authConfig from "../convex/auth.config.js";
const authInfo = authConfig.providers[0];
const address = import.meta.env.VITE_CONVEX_URL;

const convex = new ConvexReactClient(address);

function LoginButton() {
  const { loginWithRedirect } = useAuth0();
  return <div style={{
    height: "100vh",
    width: "100vw",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  }}>
    <button className="LoginButton" onClick={() => loginWithRedirect()}>Log in</button>
  </div>;
}

ReactDOM.render(
  <StrictMode>
    <Auth0Provider
      domain={authInfo.domain}
      clientId={authInfo.applicationID}
      authorizationParams={{
        redirect_uri:
          typeof window === "undefined" ? undefined : window.location.origin,
      }}
      useRefreshTokens={true}
      cacheLocation="localstorage"
    >
      <ConvexProviderWithAuth0 client={convex}>
        <Authenticated>
          <App />
        </Authenticated>
        <Unauthenticated>
          <LoginButton />
        </Unauthenticated>
      </ConvexProviderWithAuth0>
    </Auth0Provider>
  </StrictMode>,
  document.getElementById("root")
);
