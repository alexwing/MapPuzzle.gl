import axios from "axios";

/**
 * Talking to Wikipedia politely enough that it answers.
 *
 * Wikimedia's User-Agent policy rejects requests that do not identify
 * themselves, and the API calls here sent no User-Agent at all: every one came
 * back 403, which is why generating wiki links stopped working. The flag
 * download did work, because it claimed to be Chrome — impersonating a browser
 * is what the policy asks you not to do, so it uses this too now.
 *
 * The string names the tool and where to find out about it, which is what the
 * policy asks for: https://foundation.wikimedia.org/wiki/Policy:User-Agent_policy
 */
export const WIKIPEDIA_USER_AGENT =
  "MapPuzzle/0.2 (https://mappuzzle.xyz; map puzzle game content importer)";

/** Wikipedia asks for a pause between calls; this is how long we wait. */
export const WIKIPEDIA_DELAY_MS = 1000;

export const wikipediaHeaders = {
  "User-Agent": WIKIPEDIA_USER_AGENT,
  "Api-User-Agent": WIKIPEDIA_USER_AGENT,
  Accept: "application/json",
};

/**
 * GETs a Wikipedia API url and returns the parsed body.
 *
 * Throws with the status and the url on failure, so a job's summary can say what
 * went wrong instead of a bare "Request failed with status code 403".
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function wikipediaGet(url: string): Promise<any> {
  try {
    const response = await axios.get(url, {
      headers: wikipediaHeaders,
      timeout: 15000,
    });
    return response.data;
  } catch (e) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const status = (e as any)?.response?.status;
    throw new Error(
      `Wikipedia answered ${status ?? "no response"} for ${url}` +
        (status === 403
          ? ". That is the User-Agent policy: the request has to identify itself."
          : status === 429
          ? ". Too many requests; wait a while before retrying."
          : "")
    );
  }
}

/** A pause between calls, so a run of pieces does not hammer the API. */
export const wikipediaPause = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, WIKIPEDIA_DELAY_MS));
