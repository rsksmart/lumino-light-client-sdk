import * as channelActions from './channel';
import * as depositActions from './deposit';
import * as closeActions from './close';

const Actions = {
  ...channelActions,
  ...depositActions,
  ...closeActions,
};

export default Actions;
