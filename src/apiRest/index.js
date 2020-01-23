import axios from "axios";
import { API_BASE_URL } from "../config/apiRestConstants";


/**
 * This function returns an instance of axios pointing to the API_BASE_URL
 */
const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default client;
