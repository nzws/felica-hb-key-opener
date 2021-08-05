import { Accessory, Characteristic, Device } from 'hap-node-client';

export const getAccessory = (instance: Device, aid: number): Accessory => {
  const accessory = instance.accessories.accessories.find(
    acc => acc.aid === aid
  );
  if (!accessory) {
    throw new Error('accessory not found');
  }

  return accessory;
};

export const getCharacteristic = (
  accessory: Accessory,
  type: string
): Characteristic => {
  const service = accessory.services.find(service =>
    service.characteristics.find(char => char.type === type)
  );
  if (!service) {
    throw new Error('service not found');
  }

  const characteristic = service.characteristics.find(
    char => char.type === type
  );
  if (!characteristic) {
    throw new Error('characteristic not found');
  }

  return characteristic;
};
