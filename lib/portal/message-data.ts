import "server-only";
import { cache } from "react";
import { listMessages } from "@/lib/airtable";

/** A client's messages, read once per request: the layout and the page both need them. */
export const getMessages = cache(listMessages);
