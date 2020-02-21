import getState from "./state";

export const getNumberOfNotifiers = () => {
  const { notifiers } = getState().notifier;
  return Object.keys(notifiers);
};
