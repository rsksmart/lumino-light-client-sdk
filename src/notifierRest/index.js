import axios from "axios";
import { NOTIFIER_BASE_URL } from "../config/notifierConstants";

/**
 * This function returns an instance of axios, this is used for polling
 */
const notifierGet = axios.create({
  baseURL: NOTIFIER_BASE_URL,
});

/**
 * This functions returns an instance of axios, this should be used for subscribing and adding new notifiers
 */
export const notifierOperations = axios.create({});

export default notifierGet;
