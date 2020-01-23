import axios from "axios";
import { NOTIFIER_BASE_URL } from "../config/notifierConstants";

/**
 * This function returns an instance of axios pointing to the API_BASE_URL
 */
const notifier = axios.create({
  baseURL: NOTIFIER_BASE_URL,
});

export default notifier;
