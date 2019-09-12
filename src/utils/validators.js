export const validateOpenChannelParams = obj => {
  if (Object.keys(obj).length < 3)
    throw new Error('Invalid quantity of params');
  return true;
};
