// Client-side GitHub OAuth gate. Wraps a page to require a GitHub
// login before any content renders.
//
// Honest caveat: this is a STATIC SITE. The HTML and any data baked
// into it at build time still live on S3 and could in principle be
// fetched directly by anyone who knows the URL. This gate hides the
// page UI from casual visitors, NOT determined attackers. For truly
// private data we'd need server-side auth or a separate backend.
//
// Protocol (matches Decap CMS):
//   popup → parent: "authorizing:github"           (handshake ping)
//   parent → popup: "authorizing:github"           (echoed back)
//   popup → parent: "authorization:github:success:{json}"
//   popup → parent: "authorization:github:error:..." (rejected)

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

// Both accounts belong to Matt — matthewmalan8 owns the repo,
// mattmalan6 is the everyday personal account.
const ALLOWED_LOGINS = ["matthewmalan8", "mattmalan6"] as const;
const ALLOWED_LIST_DISPLAY = ALLOWED_LOGINS.join(" or ");
const OAUTH_URL = "https://decap-oauth.mattasu6.workers.dev/auth";
const STORAGE_KEY = "matthewmalan-goals-token";
const LOGIN_KEY = "matthewmalan-goals-login";

type State =
  | { kind: "loading" }
  | { kind: "signed-out"; error?: string }
  | { kind: "signed-in"; login: string };

async function fetchLogin(token: string): Promise<string | null> {
  try {
    const res = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { login?: string };
    return data.login ?? null;
  } catch {
    return null;
  }
}

function clearStored() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LOGIN_KEY);
  } catch {
    // ignore
  }
}

export default function GitHubGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ kind: "loading" });
  const popupRef = useRef<Window | null>(null);

  // On mount: try cached token.
  useEffect(() => {
    let cancelled = false;
    const stored = (() => {
      try {
        return localStorage.getItem(STORAGE_KEY);
      } catch {
        return null;
      }
    })();
    if (!stored) {
      setState({ kind: "signed-out" });
      return () => {
        cancelled = true;
      };
    }
    fetchLogin(stored).then((login) => {
      if (cancelled) return;
      if (login && (ALLOWED_LOGINS as readonly string[]).includes(login)) {
        setState({ kind: "signed-in", login });
      } else {
        clearStored();
        setState({
          kind: "signed-out",
          error: login
            ? `Signed in as ${login}, but this page is restricted to ${ALLOWED_LIST_DISPLAY}.`
            : "Saved login expired. Please sign in again.",
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // OAuth message listener.
  useEffect(() => {
    function onMessage(ev: MessageEvent) {
      const data = ev.data;
      if (typeof data !== "string") return;

      if (data === "authorizing:github") {
        try {
          if (ev.source && "postMessage" in ev.source) {
            (ev.source as Window).postMessage(
              "authorizing:github",
              ev.origin || "*"
            );
          } else if (popupRef.current) {
            popupRef.current.postMessage("authorizing:github", "*");
          }
        } catch {
          // ignore
        }
        return;
      }

      if (data.startsWith("authorization:github:success:")) {
        const payload = data.slice("authorization:github:success:".length);
        try {
          const parsed = JSON.parse(payload) as { token?: string };
          const token = parsed.token;
          if (!token) {
            setState({ kind: "signed-out", error: "No token in response." });
            return;
          }
          try {
            localStorage.setItem(STORAGE_KEY, token);
          } catch {
            // ignore
          }
          fetchLogin(token).then((login) => {
            if (login && (ALLOWED_LOGINS as readonly string[]).includes(login)) {
              try {
                localStorage.setItem(LOGIN_KEY, login);
              } catch {
                // ignore
              }
              setState({ kind: "signed-in", login });
              popupRef.current?.close();
            } else {
              clearStored();
              setState({
                kind: "signed-out",
                error: login
                  ? `Signed in as ${login}, but this page is restricted to ${ALLOWED_LIST_DISPLAY}.`
                  : "Sign-in succeeded but GitHub didn't return a user. Try again.",
              });
            }
          });
        } catch (err) {
          setState({
            kind: "signed-out",
            error: `Auth response parse error: ${(err as Error).message}`,
          });
        }
        return;
      }

      if (data.startsWith("authorization:github:error:")) {
        setState({
          kind: "signed-out",
          error: "GitHub denied the sign-in.",
        });
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const signIn = useCallback(() => {
    const w = 600;
    const h = 720;
    const left = window.screen.width / 2 - w / 2;
    const top = window.screen.height / 2 - h / 2;
    popupRef.current = window.open(
      `${OAUTH_URL}?provider=github&scope=read:user`,
      "github-oauth",
      `width=${w},height=${h},left=${left},top=${top}`
    );
  }, []);

  const signOut = useCallback(() => {
    clearStored();
    setState({ kind: "signed-out" });
  }, []);

  if (state.kind === "loading") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <p className="text-sm text-[var(--color-black)]/60">Checking access…</p>
      </div>
    );
  }

  if (state.kind === "signed-out") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center bg-[var(--color-off-white)] border-2 border-[var(--color-warm-gray)] rounded-2xl p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60">
            Private
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl tracking-tight">
            Sign in to continue.
          </h1>
          <p className="mt-3 text-sm text-[var(--color-black)]/70">
            This page is restricted to Matthew. Sign in with GitHub to
            access.
          </p>
          {state.error && (
            <p className="mt-4 text-sm text-[#D64545]">{state.error}</p>
          )}
          <button
            type="button"
            onClick={signIn}
            className="mt-6 inline-flex items-center gap-2 bg-[var(--color-black)] text-[var(--color-yellow)] px-6 py-3 text-sm font-semibold rounded-full hover:opacity-90 cursor-pointer"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2.1c-3.2.7-3.87-1.36-3.87-1.36-.52-1.34-1.28-1.7-1.28-1.7-1.05-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.71 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.07 0 0 .97-.31 3.18 1.18.92-.26 1.91-.39 2.89-.39.98 0 1.97.13 2.89.39 2.21-1.49 3.18-1.18 3.18-1.18.63 1.6.23 2.78.11 3.07.74.81 1.19 1.84 1.19 3.1 0 4.44-2.7 5.42-5.27 5.7.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.55C20.71 21.39 24 17.08 24 12 24 5.65 18.85.5 12 .5z" />
            </svg>
            Sign in with GitHub
          </button>
          <p className="mt-6 text-xs text-[var(--color-black)]/50">
            Same login as <code>/admin/</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-[var(--color-black)] text-[var(--color-off-white)] text-xs">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-2 flex items-center justify-between">
          <span>
            Signed in as <strong>{state.login}</strong>
          </span>
          <button
            type="button"
            onClick={signOut}
            className="text-[var(--color-yellow)] hover:underline cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}
