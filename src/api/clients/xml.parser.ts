import { XMLParser } from 'fast-xml-parser';

/**
 * XML parsing helpers.
 *
 * ParaBank's SOAP responses are namespaced (`ns2:`, `soap:`) and its REST
 * responses wrap collections in a plural root element. Both are handled
 * here so that no service has to know about namespaces.
 */
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
  parseTagValue: true,
  parseAttributeValue: true,
  trimValues: true,
  // The XML declaration and processing instructions are not part of the
  // payload; without this they show up as a `?xml` sibling of the root
  // element and break the "single child" lookups.
  ignoreDeclaration: true,
  ignorePiTags: true,
});

/** Parse an XML document. Returns `null` for an empty or malformed body. */
export function parseXml<T = unknown>(xml: string): T | null {
  if (!xml || xml.trim() === '') {
    return null;
  }
  try {
    return parser.parse(xml) as T;
  } catch {
    return null;
  }
}

/**
 * Normalise a parsed XML value into an array.
 *
 * `fast-xml-parser` collapses a single-element sequence into the element
 * itself, so `<account>` and `<account/><account/>` produce different
 * shapes. Everything that can repeat goes through this helper.
 */
export function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

/**
 * Read a single leaf element's text from an XML fragment.
 *
 * Used for SOAP faults, where the interesting text lives in
 * `<faultstring>`.
 */
export function readXmlText(xml: string, elementName: string): string | null {
  const match = xml.match(new RegExp(`<${elementName}>([\\s\\S]*?)</${elementName}>`));
  return match ? match[1].trim() : null;
}
