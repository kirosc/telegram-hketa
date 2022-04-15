import axios from 'axios';
import { setupCache } from 'axios-cache-adapter';

const cache = setupCache({
  maxAge: 0,
  readHeaders: true,
  exclude: { query: false },
});

export const cAxios = axios.create({
  adapter: cache.adapter,
});

export default cAxios;
