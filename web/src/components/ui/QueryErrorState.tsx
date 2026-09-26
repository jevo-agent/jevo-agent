"use client";

import Link from "next/link";

interface QueryErrorStateProps {
  title?: string;
  message?: string;
  error?: Error | unknown;
  onRetry?: () => void;
}

export function QueryErrorState({
  title = "Backend Connection Error",
  message,
  error,
  onRetry,
}: QueryErrorStateProps) {
  const errorMessage =
    message ??
    (error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Failed to communicate with JEVO backend API.");

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md border border-[var(--jevo-line)] bg-[rgb(11_13_11_/_90%)] p-6 sm:p-8">
        <div className="mb-3 inline-flex items-center gap-2 border border-[rgb(255_105_95_/_30%)] bg-[rgb(255_105_95_/_10%)] px-2.5 py-1 font-mono text-[0.62rem] tracking-[0.08em] text-[var(--jevo-danger)] uppercase">
          <span className="size-1.5 rounded-full bg-[var(--jevo-danger)] animate-pulse" />
          Backend Unavailable
        </div>
        <h2 className="text-xl font-medium tracking-tight text-[var(--jevo-text)] sm:text-2xl">
          {title}
        </h2>
        <p className="mt-3 font-mono text-xs leading-5 text-[var(--jevo-muted)] break-words">
          {errorMessage}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="h-9 cursor-pointer border border-[var(--jevo-line)] bg-[var(--jevo-accent-soft)] px-4 font-mono text-[0.65rem] tracking-[0.08em] text-[var(--jevo-text)] uppercase transition-colors hover:border-[var(--jevo-accent)] hover:text-[var(--jevo-accent)]"
            >
              Retry Connection
            </button>
          )}
          <Link
            href="/"
            className="h-9 inline-flex items-center border border-[var(--jevo-line)] px-4 font-mono text-[0.65rem] tracking-[0.08em] text-[var(--jevo-muted)] uppercase transition-colors hover:text-[var(--jevo-text)]"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
