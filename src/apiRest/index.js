import axios from "axios";
import { API_BASE_URL } from "../config/apiRestConstants";

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

export default client;
