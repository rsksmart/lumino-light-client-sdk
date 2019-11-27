import * as openActions from "./open";
import * as getActions from "./get";
import * as depositActions from "./deposit";
import * as closeActions from "./close";
import * as paymentActions from "./payment";
import * as pollingActions from "./polling";
import * as onboardingActions from "./onboarding";

const Actions = {
  ...openActions,
  ...depositActions,
  ...getActions,
  ...closeActions,
  ...paymentActions,
  ...pollingActions,
  ...onboardingActions,
};

export default Actions;
