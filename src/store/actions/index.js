import * as openActions from "./open";
import * as depositActions from "./deposit";
import * as closeActions from "./close";
import * as paymentActions from "./payment";

const Actions = {
  ...openActions,
  ...depositActions,
  ...closeActions,
  ...paymentActions
};

export default Actions;
