import * as channelActions from './channel';
import * as depositActions from './deposit';
import * as closeActions from './close';
import * as paymentActions from './payment';

const Actions = {
  ...channelActions,
  ...depositActions,
  ...closeActions,
  ...paymentActions,
};

export default Actions;
