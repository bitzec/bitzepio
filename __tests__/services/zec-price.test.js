// @flow

import getZECPrice from '../../services/bzc-price';

describe('BZC PRICE Services', () => {
  test('should return the right value', async () => {
    const response = await getZECPrice(['BRL', 'EUR', 'USD']);

    expect(response).toEqual({
      USD: expect.any(Number),
      BRL: expect.any(Number),
      EUR: expect.any(Number),
    });
  });
});
