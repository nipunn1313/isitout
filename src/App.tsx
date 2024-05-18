import { useAction, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import React, { useEffect, useState } from "react";
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
  gitShaToCheck,
}: {
  message: {
    version: string;
    url: string;
    service: string;
    pushDate: number;
    _creationTime: number;
  };
  gitShaToCheck: string;
}) {
  const compareCommits = useAction(api.github.compareCommits);
  const prevDoc = useQuery(api.version_history.prevRev, {
    service: message.service,
    _creationTime: message._creationTime,
  });
  const [comparison, setComparison] = useState("");

  const d = new Date(message.pushDate);

  const service = message.service;
  const version = message.version;
  const base = version.split("-")[1];

  const prev = prevDoc?.version || "";

  useEffect(() => {
    const fetchData = async () => {
      setComparison("");
      if (!gitShaToCheck) {
        return;
      }
      const comparison = await compareCommits({ head: gitShaToCheck, base });

      const getComparisonEmoji = () => {
        switch (comparison) {
          case "behind":
          case "identical":
            return "✅"; // Green check mark
          case "ahead":
            return "❌"; // Red X
          case "diverged":
          default:
            return "❓"; // Question mark
        }
      };

      setComparison(getComparisonEmoji());
    };
    fetchData();
  }, [compareCommits, gitShaToCheck]);

  return (
    <li className="row">
      <div>{comparison}</div>
      <a href={message.url}>{message.version}</a>
      <div>{service}</div>
      <Ago d={d} />
      <a
        className="small"
        href={`https://github.com/get-convex/convex/compare/${service}/${prev}...get-convex:convex:${service}/${version}`}
      >
        diff previous
      </a>
      <PushTime d={new Date(message.pushDate)} />
    </li>
  );
}

function Rows() {
  const [value, setValue] = useState<string | undefined>(undefined);
  const [gitShaToCheck, setGitShaToCheck] = useState("");
  const services = useQuery(api.version_history.services) || [];
  const messages = useQuery(api.version_history.list, { service: value }) || [];

  const handleDropdownChange: React.ChangeEventHandler<HTMLSelectElement> = (
    event
  ) => {
    if (event.target.value === "All") {
      setValue(undefined);
    } else {
      setValue(event.target.value);
    }
  };

  const handleInputChange: React.ChangeEventHandler<HTMLInputElement> = (
    event
  ) => {
    setGitShaToCheck(event.target.value);
  };

  return (
    <>
      <select value={value} onChange={handleDropdownChange}>
        <option value={"All"}>All</option>
        {services.map((service) => (
          <option key={service} value={service}>
            {service}
          </option>
        ))}
      </select>
      <input
        type="text"
        value={gitShaToCheck}
        onChange={handleInputChange}
        placeholder="paste a git sha here"
      />
      {gitShaToCheck && (
        <>
          <div>✅ - It's out!</div>
          <div>❌ - It's not out!</div>
          <div>❓ - Not sure.. it diverged</div>
        </>
      )}
      <ul>
        {messages.map((message) => (
          <Row
            key={JSON.stringify(message)}
            message={message}
            gitShaToCheck={gitShaToCheck}
          />
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
