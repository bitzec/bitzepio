// @flow

import getBZCPrice from '../../services/bzc-price';

describe('BZC PRICE Services', () => {
  test('should return the right value', async () => {
    const response = await getBZCPrice(['BRL', 'EUR', 'USD']);

    expect(response).toEqual({
      usd: expect.any(Number),
      brl: expect.any(Number),
      eur: expect.any(Number),
    });
  });
});
