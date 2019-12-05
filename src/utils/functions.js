const getGreater = (n1, n2) => (n1 > n2 ? n1 : n2);

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
