import { useAction, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import React, { useEffect, useState } from "react";
import { formatRFC7231, formatDistanceToNowStrict } from "date-fns";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DropdownMenuRadioItem,
  ItemIndicator,
} from "@radix-ui/react-dropdown-menu";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { CheckIcon } from "@radix-ui/react-icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// 7 days
const STALE_AGE_MILLIS = 1000 * 3600 * 24 * 7;

function PushTime({ d }: { d: Date }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className="text-left">{d.toLocaleString()}</div>
        </TooltipTrigger>
        <TooltipContent side="top" align="start">
          <p>{formatRFC7231(d)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function isStale(d: Date): boolean {
  return Date.now() - d.valueOf() >= STALE_AGE_MILLIS;
}

function Ago({ d }: { d: Date }) {
  return (
    <div className="ago">
      <span>{formatDistanceToNowStrict(d)} ago</span>
      {isStale(d) && "🥱"}
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
    void fetchData();
  }, [compareCommits, gitShaToCheck]);

  return (
    <div className="flex gap-2 items-center">
      <div className="w-[10%]">{comparison}</div>
      <div className="flex flex-col w-[50%]">
        <span>
          <a
            className="underline text-blue-800 visited:text-purple-800"
            href={message.url}
          >
            {message.version}
          </a>
        </span>
        <span>
          <a
            className="underline text-primary text-xs"
            href={`https://github.com/get-convex/convex/compare/${service}/${prev}...get-convex:convex:${service}/${version}`}
          >
            diff previous
          </a>
        </span>
      </div>
      <div className="w-[20%]">{service}</div>
      <div className="w-[20%] flex flex-col">
        <PushTime d={new Date(message.pushDate)} />
        <Ago d={d} />
      </div>
    </div>
  );
}

function Rows() {
  const [value, setValue] = useState("all");
  const [gitShaToCheck, setGitShaToCheck] = useState("");
  const serviceToLastPushed = useQuery(api.version_history.services) || [];
  const messages =
    useQuery(api.version_history.list, {
      service: value === "all" ? undefined : value,
    }) || [];

  const handleInputChange: React.ChangeEventHandler<HTMLInputElement> = (
    event
  ) => {
    setGitShaToCheck(event.target.value);
  };

  const anyStale = Object.values(serviceToLastPushed).some((lastPushed) =>
    isStale(new Date(lastPushed))
  );

  return (
    <div className="max-w-[1600px] w-full">
      <div className="flex ml-4 gap-4 p-4 flex-grow-0 flex-shrink">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              {value === "all" ? "All services" : value}
              {anyStale && "🥱"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuRadioGroup
              className="w-96"
              value={value}
              onValueChange={setValue}
            >
              <DropdownMenuRadioItem
                className="flex items-center justify-between px-2 cursor-pointer border-2 border-transparent hover:border-primary hover:border-solid"
                value={"all"}
              >
                <span className="w-5 flex-shrink-0">
                  <ItemIndicator>
                    <CheckIcon />
                  </ItemIndicator>
                </span>
                <span className="flex-grow">All services</span>
              </DropdownMenuRadioItem>
              {Object.entries(serviceToLastPushed).map(
                ([service, lastPushed]) => (
                  <DropdownMenuRadioItem
                    key={service}
                    value={service}
                    className="flex items-center justify-between px-2 cursor-pointer border-2 border-transparent hover:border-primary hover:border-solid"
                  >
                    <span className="w-5 flex-shrink-0">
                      <ItemIndicator>
                        <CheckIcon />
                      </ItemIndicator>
                    </span>
                    <span className="flex-grow">{service}</span>
                    <span className="mx-2">
                      <Ago d={new Date(lastPushed)} />
                    </span>
                  </DropdownMenuRadioItem>
                )
              )}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <Input
          className="max-w-56"
          onChange={handleInputChange}
          value={gitShaToCheck}
          placeholder="Paste git SHA here"
        />
      </div>
      {gitShaToCheck && (
        <>
          <div>✅ - It's out!</div>
          <div>❌ - It's not out!</div>
          <div>❓ - Not sure.. it diverged</div>
        </>
      )}
      <div>🥱 - It's been over a week</div>
      <div className="flex flex-col p-4 divide-y gap-2">
        {messages.map((message) => (
          <Row
            key={JSON.stringify(message)}
            message={message}
            gitShaToCheck={gitShaToCheck}
          />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const lastSync = useQuery(api.last_sync.get);
  const lastSyncTime = lastSync
    ? new Date(lastSync.time * 1000).toLocaleString()
    : "unknown";

  return (
    <main className="flex flex-col h-[100vh] w-[100vw] p-4 gap-2 justify-start items-center">
      <h1 className="text-4xl font-extrabold text-center">isitout</h1>
      <div className="flex flex-col mx-auto gap-2">
        <p className="bg-primary text-primary-foreground p-2 rounded text-center">
          <span>Last sync: {lastSyncTime}</span>
        </p>
        <p className="note">
          For convex-backend, this indicates when versions were <i>canaried</i>.
          <br />
          <a
            className="underline text-blue-800 visited:text-purple-800"
            href="https://grafana.cvx.is/d/aab19343-40fb-48fa-9774-e5301a70a2cd/versions?orgId=1&viewPanel=4"
          >
            Backend Versions Plot »
          </a>{" "}
          can tell you if/when the version was rolled out. To list instances on
          a specific version, run:
        </p>
        <pre className="note">
          big-brain-tool dump-instances --current-version
          20240524T135055Z-4d6ae6f745ec --name-only
        </pre>
        <p className="note">
          All times are local, hover over timestamp for UTC.
        </p>
      </div>
      <Rows />
      <div>
        <a
          href="https://github.com/nipunn1313/isitout"
          className="underline text-blue-800 visited:text-purple-800"
        >
          https://github.com/nipunn1313/isitout
        </a>
      </div>
    </main>
  );
}
