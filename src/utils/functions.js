export const findMaxMsgInternalId = arr => {
  const idKey = "internal_msg_identifer";
  const l = arr.length;
  let max = 0;
  let c;
  for (c = 0; c < l; c++) {
    if (arr[c][idKey] > max) {
      max = arr[c][idKey];
    }
  }
  return max;
};
