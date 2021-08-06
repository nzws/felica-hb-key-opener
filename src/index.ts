import dotenv from 'dotenv';
import { Device, HAPNodeJSClient } from 'hap-node-client';
import NFC from 'node-nfcpy-id';
import { getAccessory, getCharacteristic } from './utils/parser';
dotenv.config();

type Card = {
  id: string;
  type: number;
};

// https://developers.homebridge.io/#/characteristic/LockTargetState
const UNSECURED = 0;
const LOCK_TARGET_STATE = '0000001E-0000-1000-8000-0026BB765291';

const { HB_PIN, HB_IP, HB_PORT, HB_ACC_AID, CARD_ID } = process.env as Record<
  string,
  string
>;

const getInstances = (hap: HAPNodeJSClient): Promise<Device[]> =>
  new Promise(resolve => hap.HAPaccessories(resolve));

(() => {
  const hap = new HAPNodeJSClient({
    pin: HB_PIN
  });
  const nfc = new NFC().start();

  const aid = parseInt(HB_ACC_AID);
  let iid: number;
  const ids = (CARD_ID || '').split(',');
  if (ids.length == 0) {
    console.warn('running in debug mode. all cards are allowed.');
  }

  hap.on('Ready', async () => {
    const instance = (await getInstances(hap)).find(
      instance => instance.instance.port === parseInt(HB_PORT)
    );
    if (!instance) {
      throw new Error('instance not found');
    }

    const accessory = getAccessory(instance, aid);
    const characteristic = getCharacteristic(accessory, LOCK_TARGET_STATE);
    iid = characteristic.iid;

    console.log('hap is ready');
  });

  nfc.on('touchstart', (card: Card) => {
    const id = card.id;
    console.log('Card: ', card);
    if (ids.length === 0 || ids.includes(id)) {
      // open
      hap.HAPcontrol(
        HB_IP,
        parseInt(HB_PORT),
        JSON.stringify({ characteristics: [{ aid, iid, value: UNSECURED }] }),
        err => {
          if (err) {
            console.error('HAP Error: ', err);
            return;
          }

          console.log('Open succeed');
        }
      );
    }
  });

  nfc.on('touchend', () => {
    console.log('Card was away.');
  });

  nfc.on('error', err => {
    console.error('NFC Error: ', err);
  });
})();
