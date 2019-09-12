import * as channelActions from './channel';
import * as depositActions from './deposit';

const Actions = {
  ...channelActions,
  ...depositActions,
};

export default Actions;
