import axios from "axios";
import JSONbig from "json-bigint";
import { API_BASE_URL } from "../config/apiRestConstants";

/**
 * This function returns an instance of axios pointing to the API_BASE_URL
 */
const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },

  transformResponse: /* istanbul ignore next */ res => JSONbig.parse(res),
});

export default client;
