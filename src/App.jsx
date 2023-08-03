import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

import { formatRFC7231, formatDistanceToNowStrict } from "date-fns";

function PushTime({ d }) {
  return (
    <div className="push-time" title={formatRFC7231(d)}>
      <span>{d.toLocaleString()}</span>
    </div>
  );
}

function Ago({ d }) {
  return (
    <div className="ago">
      <span>{formatDistanceToNowStrict(d)} ago</span>
    </div>
  );
}

function Row({ message }) {
  const d = new Date(message.pushDate);
  const version = message.version;
  const parts = version.split(".").map((x) => parseInt(x));
  const last = parts.pop();
  const prev = `${parts.join(".")}.${last - 1}`;
  return (
    <li className="row" key={message.pushDate.toString()}>
      <a href={message.url}>{message.version}</a>
      <Ago d={d} />
      <a
        className="small"
        href={`https://github.com/get-convex/convex/compare/convex-backend/${prev}...get-convex:convex:convex-backend/${version}`}
      >
        diff previous
      </a>
      <PushTime d={new Date(message.pushDate)} />
    </li>
  );
}

export default function App() {
  const messages = useQuery(api.backend_version_history.list) || [];
  const lastSync = useQuery(api.last_sync.get) || "unknown";
  const lastSyncTime = new Date(lastSync.time * 1000).toLocaleString();

  return (
    <main>
      <h1>isitout</h1>
      <p className="badge">
        <span>Last sync: {lastSyncTime}</span>
      </p>
      <p className="note">
        List of when backend versions were <i>tagged</i>,
        <br />
        check{" "}
        <a href="https://grafana.cvx.is/d/aab19343-40fb-48fa-9774-e5301a70a2cd/versions?orgId=1&viewPanel=4">
          Backend Versions Plot »
        </a>{" "}
        to make sure this version was rolled out.
      </p>
      <pre className="note">
        big-brain-tool dump-instances --current-version 0.0.417 --name-only
      </pre>
      <p className="note">lists instances on a specific version.</p>
      <p className="note">All times are local, hover over timestamp for UTC.</p>
      <ul>
        {messages.map((message) => (
          <Row
            key={message.version + message.pushDate + ""}
            message={message}
          />
        ))}
      </ul>
    </main>
  );
}
