import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Add Gmail scopes
provider.addScope("https://www.googleapis.com/auth/gmail.send");
provider.addScope("https://www.googleapis.com/auth/gmail.readonly");
provider.addScope("https://www.googleapis.com/auth/gmail.modify");

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  // Load token from sessionStorage if present to keep it persistent across refreshes
  const storedToken = sessionStorage.getItem("gmail_access_token");
  if (storedToken) {
    cachedAccessToken = storedToken;
  }

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      // If we don't have a cached token, clear and fail
      cachedAccessToken = null;
      sessionStorage.removeItem("gmail_access_token");
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Google
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to retrieve Google Access Token.");
    }

    cachedAccessToken = credential.accessToken;
    sessionStorage.setItem("gmail_access_token", cachedAccessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Gmail Sign In error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken || sessionStorage.getItem("gmail_access_token");
};

export const logoutGmail = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  sessionStorage.removeItem("gmail_access_token");
};

// Helper to compile standard RFC822 mail body and encode to Safe Base64URL
function buildRawEmail(to: string, subject: string, body: string): string {
  // Format subject with base64 for reliable UTF-8 support
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const emailLines = [
    `To: ${to}`,
    `Subject: ${utf8Subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    "",
    btoa(unescape(encodeURIComponent(body)))
  ];
  const email = emailLines.join("\r\n");
  
  // Base64URL encode (RFC 4648)
  return btoa(unescape(encodeURIComponent(email)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Send Email via Gmail REST API
export const sendGmailMessage = async (
  to: string,
  subject: string,
  body: string
): Promise<boolean> => {
  const token = await getAccessToken();
  if (!token) throw new Error("Authentication required to access Gmail API.");

  const rawMessage = buildRawEmail(to, subject, body);

  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: rawMessage }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || "Failed to deliver email through Gmail.");
  }

  return true;
};

// Search & List email messages via Gmail REST API
export interface SyncedEmail {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  bodyText?: string;
}

export const fetchGmailCorrespondence = async (query: string): Promise<SyncedEmail[]> => {
  const token = await getAccessToken();
  if (!token) return [];

  try {
    // 1. Fetch message IDs matching filter query
    const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=8`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return [];
    const data = await res.json();
    if (!data.messages || data.messages.length === 0) return [];

    // 2. Fetch complete metadata for matched messages
    const emails: SyncedEmail[] = await Promise.all(
      data.messages.map(async (msg: { id: string }) => {
        const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!detailRes.ok) return null;
        const msgData = await detailRes.json();

        const headers = msgData.payload?.headers || [];
        const subject = headers.find((h: any) => h.name.toLowerCase() === "subject")?.value || "(No Subject)";
        const from = headers.find((h: any) => h.name.toLowerCase() === "from")?.value || "Unknown Sender";
        const to = headers.find((h: any) => h.name.toLowerCase() === "to")?.value || "";
        const dateRaw = headers.find((h: any) => h.name.toLowerCase() === "date")?.value || "";
        
        let bodyText = msgData.snippet || "";
        // Attempt to extract plaintext from part if available
        if (msgData.payload?.parts) {
          const textPart = msgData.payload.parts.find((p: any) => p.mimeType === "text/plain");
          if (textPart?.body?.data) {
            try {
              // Decode base64url text body
              const base64 = textPart.body.data.replace(/-/g, "+").replace(/_/g, "/");
              bodyText = decodeURIComponent(escape(atob(base64)));
            } catch (e) {
              console.warn("Could not decode parts body", e);
            }
          }
        } else if (msgData.payload?.body?.data) {
          try {
            const base64 = msgData.payload.body.data.replace(/-/g, "+").replace(/_/g, "/");
            bodyText = decodeURIComponent(escape(atob(base64)));
          } catch (e) {
            // fallback to snippet
          }
        }

        return {
          id: msgData.id,
          threadId: msgData.threadId,
          subject,
          from,
          to,
          date: dateRaw ? new Date(dateRaw).toLocaleDateString("en-ZM", { day: "numeric", month: "short", year: "numeric" }) : "",
          snippet: msgData.snippet || "",
          bodyText,
        };
      })
    );

    return emails.filter((e): e is SyncedEmail => e !== null);
  } catch (err) {
    console.error("Error retrieving Gmail records:", err);
    return [];
  }
};
