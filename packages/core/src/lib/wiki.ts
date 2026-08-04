/**
 * Turning piece names and custom overrides into Wikipedia article titles.
 */

import type { CustomWiki } from "@mappuzzle/shared";

/**
 * Removes HTML comments, references, and audio descriptions from a given array of strings.
 * @param html - The array of strings to remove HTML comments, references, and audio descriptions from.
 * @returns The array of strings without HTML comments, references, and audio descriptions.
 */
export function cleanWikiComment(html: string[]): string[] {
  //remove comment
  let htmlAux = cleanHtmlComment(html.join(""));

  //remove references <sup>...</sup>
  htmlAux = htmlAux.replace(/<sup[\s\S]*?<\/sup>/g, "");
  //remove audio description
  htmlAux = htmlAux.replace(
    "<span>(<span><span><span></span>listen</span></span>)</span>",
    ""
  );
  htmlAux = htmlAux.replace(
    '<small class="nowrap">&nbsp;( escuchar)</small>',
    ""
  );

  //convert string to array
  return [htmlAux];
}

/**
 * Removes HTML comments from a given string.
 * @param html - The string to remove HTML comments from.
 * @returns The string without HTML comments.
 */
function cleanHtmlComment(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, "");
}

/**
 * Cleans a given name to generate a Wikipedia URL.
 * @param name - The name to clean.
 * @returns The cleaned Wikipedia URL.
 */
function cleanNameToWiki(name: string): string {
  let wiki_url = name.trim();
  wiki_url = wiki_url.replace("(disputed)", "");
  //if include string " - " split and take the first part
  if (wiki_url.includes(" - ")) {
    wiki_url = wiki_url.split(" - ")[0];
  }
  //replace - to space
  //wiki_url = wiki_url.replace(/-/g, " ");
  //remove (Disputed)
  wiki_url = wiki_url.replace(/ /g, "_");
  return wiki_url;
}

/**
 * Returns a Wikipedia URL for a given name and custom Wikipedia URL, if available.
 * If a custom Wikipedia URL is not available, it generates a Wikipedia URL from the name.
 * @param cartodb_id - The cartodb_id of the feature.
 * @param name - The name to generate a Wikipedia URL from.
 * @param custom_wiki - An array of custom Wikipedia URLs, if available.
 * @returns The Wikipedia URL.
 */
export function getWiki(
  cartodb_id: number,
  name: string,
  custom_wiki: CustomWiki[]
): string {
  let wiki_url = "";
  if (custom_wiki) {
    wiki_url =
      custom_wiki.find((x: CustomWiki) => x.cartodb_id === cartodb_id)?.wiki ||
      "";
  }
  if (wiki_url !== "") {
    return wiki_url;
  } else {
    return cleanNameToWiki(name);
  }
}

/**
 * Returns a Wikipedia URL for a given name and custom Wikipedia URL, if available.
 * If a custom Wikipedia URL is not available, it generates a Wikipedia URL from the name.
 * @param name - The name to generate a Wikipedia URL from.
 * @param custom_wiki - A custom Wikipedia URL, if available.
 * @returns The Wikipedia URL.
 */
export function getWikiSimple(name: string, custom_wiki: string): string {
  let wiki_url = "";
  if (custom_wiki) {
    wiki_url = custom_wiki;
  }
  if (wiki_url !== "") {
    return wiki_url;
  } else {
    return cleanNameToWiki(name);
  }
}
