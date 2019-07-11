// @flow

import got from 'got';

type Payload = {
  [currency: string]: number,
};

/**
  WARNING:
  Just a super fast way to get the bzc price
*/
// eslint-disable-next-line
export default (currencies: string[] = ['USD']): Promise<Payload> => new Promise((resolve, reject) => {
  const ENDPOINT = `https://api.coingecko.com/api/v3/simple/price?ids=bitzec&vs_currencies=${currencies.join(
    ',',
  )}&api_key=${String(process.env.BZC_PRICE_API_KEY)}`;

  got(ENDPOINT)
    .then(response => resolve(JSON.parse(response.body).bitzec))
    .catch(reject);
});
