// @flow

import getBZCPrice from '../../services/bzc-price';

describe('ZEC PRICE Services', () => {
  test('should return the right value', async () => {
    const response = await getBZCPrice(['BRL', 'EUR', 'USD']);

    expect(response).toEqual({
      USD: expect.any(Number),
      BRL: expect.any(Number),
      EUR: expect.any(Number),
    });
  });
});
