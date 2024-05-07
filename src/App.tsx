import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import React, { useState } from "react";
import { formatRFC7231, formatDistanceToNowStrict } from "date-fns";

function PushTime({ d }: { d: Date }) {
  return (
    <div className="push-time" title={formatRFC7231(d)}>
      <span>{d.toLocaleString()}</span>
    </div>
  );
}

function Ago({ d }: { d: Date }) {
  return (
    <div className="ago">
      <span>{formatDistanceToNowStrict(d)} ago</span>
    </div>
  );
}

function Row({
  message,
}: {
  message: { version: string; url: string; service: string; pushDate: number };
}) {
  const d = new Date(message.pushDate);
  const version = message.version;
  const parts = version.split(".").map((x) => parseInt(x));
  const last = parts.pop()!;
  const prev = `${parts.join(".")}.${last - 1}`;
  return (
    <li className="row">
      <a href={message.url}>{message.version}</a>
      <div>{message.service}</div>
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

function Rows() {
  const [value, setValue] = useState<string | undefined>(undefined);
  const messages = useQuery(api.version_history.list, { service: value }) || [];
  const handleChange: React.ChangeEventHandler<HTMLSelectElement> = (event) => {
    if (event.target.value === "All") {
      setValue(undefined);
    } else {
      setValue(event.target.value);
    }
  };

  const services = [
    "All",
    "convex-backend",
    "big-brain",
    "searchlight",
    "funrun",
    "load-generator",
    "db-verifier",
  ];

  return (
    <>
      <select value={value} onChange={handleChange}>
        {services.map((service) => (
          <option key={service} value={service}>
            {service}
          </option>
        ))}
      </select>
      <ul>
        {messages.map((message) => (
          <Row key={JSON.stringify(message)} message={message} />
        ))}
      </ul>
    </>
  );
}

export default function App() {
  const lastSync = useQuery(api.last_sync.get);
  const lastSyncTime = lastSync
    ? new Date(lastSync.time * 1000).toLocaleString()
    : "unknown";

  return (
    <main>
      <h1>isitout</h1>
      <p className="badge">
        <span>Last sync: {lastSyncTime}</span>
      </p>
      <p className="note">
        List of when backend versions were <i>canaried</i>,
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
      <Rows />
    </main>
  );
}
