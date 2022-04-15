import axios from 'axios';
import { setupCache } from 'axios-cache-adapter';

const cache = setupCache({
  maxAge: 300000, // 5mins
  readHeaders: true, // maxAge will not take effect if no cache headers
  exclude: { query: false },
});

export const cAxios = axios.create({
  adapter: cache.adapter,
});

export default cAxios;
