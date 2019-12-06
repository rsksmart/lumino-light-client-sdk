const getGreater = (n1, n2) => (n1 > n2 ? n1 : n2);

/**
 * This methods performs a simple loop through an array and return the highest numeric value
 * @param {Array} arr The array of objects
 * @param {String} key The key value which holds the numeric value
 */
const findMaxByKey = (arr, key) => {
  let max = 0;
  for (let c = 0; c < arr.length; c++) {
    max = getGreater(arr[c][key], max);
  }
  return max;
};

export const findMaxMsgInternalId = arr =>
  findMaxByKey(arr, "internal_msg_identifer");

export const findMaxBlockId = notifications =>
  findMaxByKey(notifications, "id");

/**
 * This method takes an object with any number of keys and swaps the key for the value
 * @param {Object} data
 */
export const swapObjValueForKey = data =>
  Object.keys(data).reduce((obj, key) => ((obj[data[key]] = key), obj), {});
