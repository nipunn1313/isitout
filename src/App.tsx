import { useAction, useMutation, useQuery } from "convex/react";
import { Id } from "../convex/_generated/dataModel";
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
  CheckboxItem,
  DropdownMenuRadioItem,
  ItemIndicator,
} from "@radix-ui/react-dropdown-menu";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { CheckIcon, InfoCircledIcon } from "@radix-ui/react-icons";
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

function ReleaseTagBadge({ tag }: { tag: string }) {
  const colorClasses: Record<string, string> = {
    default: "bg-blue-100 text-blue-800",
    biz: "bg-green-100 text-green-800",
  };
  const classes = colorClasses[tag] ?? "bg-gray-100 text-gray-800";

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${classes}`}>
      {tag}
    </span>
  );
}

function Row({
  message,
  gitShaToCheck,
}: {
  message: {
    _id: Id<"version_history">;
    version: string;
    url: string;
    service: string;
    release_tag: string;
    pushDate: number;
    _creationTime: number;
    is_stable: boolean;
  };
  gitShaToCheck: string;
}) {
  const compareCommits = useAction(api.github.compareCommits);
  const markReleaseStability = useMutation(
    api.version_history.markReleaseStability,
  );
  const prevDoc = useQuery(api.version_history.prevRev, {
    service: message.service,
    _creationTime: message._creationTime,
  });
  const [comparison, setComparison] = useState("");

  const d = new Date(message.pushDate);

  const service = message.service;
  const version = message.version;
  const base = version.split("-").pop()!;

  const prev = prevDoc?.version || "";

  useEffect(() => {
    const fetchData = async () => {
      setComparison("");
      if (!gitShaToCheck) {
        return;
      }
      const comparison = await compareCommits({
        head: gitShaToCheck,
        base,
        service,
      });

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
      <div className="flex flex-col w-[35%]">
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
      <div className="w-[10%]">
        <ReleaseTagBadge tag={message.release_tag} />
      </div>
      <div className="w-[15%]">{service}</div>
      <div className="w-[20%] flex flex-col">
        <PushTime d={new Date(message.pushDate)} />
        <Ago d={d} />
      </div>
      <div className="w-[10%] flex items-center justify-center">
        <input
          type="checkbox"
          checked={message.is_stable}
          onChange={(e) =>
            markReleaseStability({
              service: message.service,
              version: message.version,
              is_stable: e.target.checked,
            })
          }
          title={message.is_stable ? "Stable" : "Unstable"}
        />
      </div>
    </div>
  );
}

function Rows() {
  const [value, setValue] = useState("all");
  const [latestOnly, setLatestOnly] = useState(true);
  const displayLatestOnly = latestOnly && value === "all";
  const [gitShaToCheck, setGitShaToCheck] = useState("");
  const serviceToLastPushed = useQuery(api.version_history.services) || [];
  const messages =
    useQuery(api.version_history.list, {
      service: value === "all" ? undefined : value,
    }) || [];
  const latestPushes = useQuery(api.version_history.listLatest) || [];
  const pushes = displayLatestOnly ? latestPushes : messages;

  const handleInputChange: React.ChangeEventHandler<HTMLInputElement> = (
    event,
  ) => {
    setGitShaToCheck(event.target.value);
  };

  const anyStale = Object.values(serviceToLastPushed).some((lastPushed) =>
    isStale(new Date(lastPushed)),
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
                ),
              )}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        {value === "all" && (
          <div>
            <Input
              type="checkbox"
              checked={latestOnly}
              onChange={(e) => setLatestOnly(e.target.checked)}
            />
            Latest only
          </div>
        )}
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
        <div className="flex gap-2 items-center font-bold text-sm text-gray-600 pb-2">
          <div className="w-[10%]">Status</div>
          <div className="w-[35%]">Version</div>
          <div className="w-[10%]">Tag</div>
          <div className="w-[15%]">Service</div>
          <div className="w-[20%]">Pushed</div>
          <div className="w-[10%] flex items-center justify-center gap-1">
            <span>Stable</span>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoCircledIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Versions default to stable and can be manually marked as
                    unstable if there is a bug.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        {pushes.map((message) => (
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
  const scream = lastSync && Date.now() - lastSync.time * 1000 >= 5 * 60 * 1000;

  return (
    <main className="flex flex-col h-[100vh] w-[100vw] p-4 gap-2 justify-start items-center">
      <h1 className="text-4xl font-extrabold text-center">isitout</h1>
      <div className="flex flex-col mx-auto gap-2">
        <p className="bg-primary text-primary-foreground p-2 rounded text-center">
          <span>Last sync: {lastSyncTime} </span>
          <br />
          <span>{scream ? "😱😱😱Sync seems broken😱😱😱" : ""}</span>
        </p>
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
