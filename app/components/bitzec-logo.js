// @flow
import React from 'react';
import { LIGHT, THEME_MODE } from '../constants/themes';
import electronStore from '../../config/electron-store';

export const BitzecLogo = () => {
  const themeInStore = String(electronStore.get(THEME_MODE));
  let img = 'https://bitzec.github.io/wp-content/uploads/bitcoin.png';
  if (themeInStore === LIGHT) {
    img = 'https://bitzec.github.io/wp-content/uploads/2018/08/bitzec2.png';
  }

  return (
    <img vspace='5' hspace='5' width='50px' style={{ padding: '15px !important' }} src={img} alt='BZC' />
  );
};
