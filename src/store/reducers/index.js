import {combineReducers} from 'redux';
import channel from './channelReducer';

const rootReducer = combineReducers({channelReducer: channel});

export default rootReducer;
